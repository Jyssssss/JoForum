import { User } from "../entities/User";
import { ApplicationContext } from "../types";
import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Mutation,
  Field,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";
import EmailVaidator from "email-validator";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { FieldError } from "./FieldError";
import { validateRegister } from "../utils/validateRegister";

const ALREADY_EXIST = "23505";

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
    const errors = validateRegister(options);
    if (errors.length > 0) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: options.email,
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
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: ApplicationContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      EmailVaidator.validate(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username/email is incorrect",
          },
        ],
      };
    } else if (!(await argon2.verify(user.password, password))) {
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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: ApplicationContext): Promise<boolean> {
    return new Promise((resolve, reject) =>
      req.session.destroy((err) => {
        if (err) {
          reject(false);
        } else {
          res.clearCookie(COOKIE_NAME);
          resolve(true);
        }
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em }: ApplicationContext
  ) {
    // const user = await em.findOne(User,)
    return true;
  }
}
