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
    return root.text.slice(0, 50) + "...";
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
    SELECT p.*,
    JSON_BUILD_OBJECT(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
    ) creator
    FROM Post p
    INNER JOIN PUBLIC.User u ON u.id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ""}
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
  async post(@Arg("id") id: number): Promise<Post | undefined> {
    return await Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: ApplicationContext
  ): Promise<Post> {
    return await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) return null;
    await Post.update({ id }, { title });
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
    } catch {
      return false;
    }
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Boolean) value: boolean,
    @Ctx() { req }: ApplicationContext
  ): Promise<boolean> {
    const { userId } = req.session;

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    if (upvote && upvote.value !== value) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        UPDATE Upvote
        SET value = $1
        WHERE "postId" = $2 AND "userId" = $3
        `,
          [value, postId, userId]
        );

        await tm.query(
          `
        UPDATE Post
        SET points = points + $1
        WHERE id = $2
        `,
          [value ? 2 : -2, postId]
        );
      });
    } else if (!upvote) {
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
