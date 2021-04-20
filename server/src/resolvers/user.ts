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
  FieldResolver,
  Root,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import EmailVaidator from "email-validator";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { FieldError } from "./FieldError";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

const ALREADY_EXIST = "23505";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: ApplicationContext) {
    return req.session.userId === user.id ? user.email : "";
  }

  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { req }: ApplicationContext
  ): Promise<User | undefined | null> {
    if (!req.session.userId) return null;
    return await User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: ApplicationContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors.length > 0) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    const user = User.create({
      username: options.username,
      password: hashedPassword,
      email: options.email,
    });
    try {
      await user.save();
    } catch (err) {
      return {
        errors: [
          {
            field:
              err.code === ALREADY_EXIST
                ? err.detail.includes("(username)")
                  ? "username"
                  : err.detail.includes("(email)")
                  ? "email"
                  : "other field"
                : "N/A",
            message:
              err.code === ALREADY_EXIST
                ? `${
                    err.detail.includes("(username)")
                      ? "username"
                      : err.detail.includes("(email)")
                      ? "email"
                      : "other field"
                  } has already existed`
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
    @Ctx() { req }: ApplicationContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: EmailVaidator.validate(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });
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
  async users(): Promise<User[]> {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  async user(@Arg("id") id: number): Promise<User | undefined> {
    return await User.findOne(id);
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
    @Ctx() { redis }: ApplicationContext
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email } });
    if (user) {
      const token = v4();
      await redis.set(
        FORGET_PASSWORD_PREFIX + token,
        user.id,
        "ex",
        1000 * 60 * 60
      );

      sendEmail(
        email,
        "Change password",
        `<a href="http://localhost:3000/change-password/${token}">Click to reset password</a>`
      );
    }
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis }: ApplicationContext
  ): Promise<UserResponse> {
    if (newPassword.length < 4) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password length must be greater than 3",
          },
        ],
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }
    const user = await User.findOne(parseInt(userId));
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user does not exists",
          },
        ],
      };
    }

    await User.update(
      { id: user.id },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    return { user };
  }
}
