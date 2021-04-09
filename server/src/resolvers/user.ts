import { User } from "../entities/User";
import { ApplicationContext } from "../types";
import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";

const ALREADY_EXIST = "23505";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: ApplicationContext): Promise<User | null> {
    if (!req.session.userId) return null;
    return await em.findOne(User, { id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: ApplicationContext
  ): Promise<UserResponse> {
    const errors: FieldError[] = [];
    if (options.username.length < 3) {
      errors.push({
        field: "username",
        message: "username length must be greater than 2",
      });
    }
    if (options.password.length < 4) {
      errors.push({
        field: "password",
        message: "password length must be greater than 3",
      });
    }
    if (errors.length > 0) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      return {
        errors: [
          {
            field: err.code === ALREADY_EXIST ? "username" : "N/A",
            message:
              err.code === ALREADY_EXIST
                ? "username has already existed"
                : "an unexpected error occurred",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: ApplicationContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "username is incorrect",
          },
        ],
      };
    } else if (!(await argon2.verify(user.password, options.password))) {
      return {
        errors: [
          {
            field: "password",
            message: "password is incorrect",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Query(() => [User])
  getUsers(@Ctx() { em }: ApplicationContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Query(() => User, { nullable: true })
  getUser(
    @Arg("id") id: number,
    @Ctx() { em }: ApplicationContext
  ): Promise<User | null> {
    return em.findOne(User, { id });
  }
}
