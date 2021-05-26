import { Post } from "../entities/Post";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { ApplicationContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Upvote } from "../entities/Upvote";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title!: string;

  @Field()
  text!: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50) + (root.text.length > 50 ? "..." : "");
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: ApplicationContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Boolean, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { req, upvoteLoader }: ApplicationContext
  ) {
    if (!req.session.userId) return null;

    const upvote = await upvoteLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return upvote ? upvote.value : null;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const params: any[] = cursor
      ? [realLimitPlusOne, new Date(parseInt(cursor))]
      : [realLimitPlusOne];

    const posts = await getConnection().query(
      `
    SELECT p.*
    FROM Post p
    ${cursor ? 'where p."createdAt" < $2' : ""}
    ORDER BY p."createdAt" DESC
    limit $1
    `,
      params
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: ApplicationContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String, { nullable: true }) text: string,
    @Ctx() { req }: ApplicationContext
  ): Promise<Post | null> {
    return getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute()
      .then((response) => response.raw[0] as Post);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: ApplicationContext
  ): Promise<boolean> {
    try {
      await Post.delete({ id, creatorId: req.session.userId });
    } catch {
      return false;
    }
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Boolean, { nullable: true }) value: boolean | null,
    @Ctx() { req }: ApplicationContext
  ): Promise<boolean> {
    const { userId } = req.session;

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    if (upvote && upvote.value !== value) {
      await getConnection().transaction(async (tm) => {
        if (value !== null) {
          await tm.query(
            `
          UPDATE Upvote
          SET value = $1
          WHERE "postId" = $2 AND "userId" = $3
          `,
            [value, postId, userId]
          );
        } else {
          await tm.query(
            `
          DELETE FROM Upvote
          WHERE "postId" = $1 AND "userId" = $2
          `,
            [postId, userId]
          );
        }

        await tm.query(
          `
        UPDATE Post
        SET points = points + $1
        WHERE id = $2
        `,
          [value === null ? (upvote.value ? -1 : 1) : value ? 2 : -2, postId]
        );
      });
    } else if (!upvote && value !== null) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          INSERT INTO Upvote ("userId", "postId", value)
          values ($1, $2, $3)
          `,
          [userId, postId, value]
        );

        await tm.query(
          `
        UPDATE Post
        SET points = points + $1
        WHERE id = $2
        `,
          [value ? 1 : -1, postId]
        );
      });
    }

    return true;
  }
}
