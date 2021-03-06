import {
  dedupExchange,
  errorExchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import {
  LoginMutation,
  MeQuery,
  MeDocument,
  RegisterMutation,
  LogoutMutation,
  VoteMutationVariables,
  DeletePostMutationVariables,
} from "../generated/graphql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { appUpdateQuery } from "./appUpdateQuery";
import Router from "next/router";
import { gql } from "@urql/core";
import { isServer } from "./isServer";
import { appInvalidatePosts } from "./appInvalidatePosts";

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter(
      (_info) => _info.fieldName === fieldName
    );

    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    info.partial = !cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );

    const posts: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore") as boolean;
      hasMore = hasMore && _hasMore;
      posts.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts,
    };
  };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => ({
  url: process.env.NEXT_PUBLIC_API_URL as string,
  fetchOptions: {
    headers: isServer() ? { cookie: ctx?.req?.headers?.cookie } : undefined,
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PaginatedPosts: () => null,
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      updates: {
        Mutation: {
          login: (_result, args, cache, info) => {
            appUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) =>
                result.login.errors
                  ? query
                  : {
                      me: result.login.user,
                    }
            );
            appInvalidatePosts(cache);
          },
          register: (_result, args, cache, info) => {
            appUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) =>
                result.register.errors
                  ? query
                  : {
                      me: result.register.user,
                    }
            );
          },
          logout: (_result, args, cache, info) => {
            appUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            );
          },
          createPost: (_result, args, cache, info) => {
            appInvalidatePosts(cache);
          },
          vote: (_result, args, cache, info) => {
            const { postId, value } = args as VoteMutationVariables;
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            );
            if (data) {
              if (data.voteStatus === null && value === undefined) return;
              const newPoints =
                (data.points as number) +
                (value === undefined
                  ? data.voteStatus
                    ? -1
                    : 1
                  : (data.voteStatus === null ? 1 : 2) * (value ? 1 : -1));
              cache.writeFragment(
                gql`
                  fragment _ on Post {
                    points
                    voteStatus
                  }
                `,
                {
                  id: postId,
                  points: newPoints,
                  voteStatus: value === undefined ? null : value,
                }
              );
            }
          },
          deletePost: (_result, args, cache, info) => {
            cache.invalidate({
              __typename: "Post",
              id: (args as DeletePostMutationVariables).id,
            });
          },
        },
      },
    }),
    ssrExchange,
    errorExchange({
      onError(error) {
        if (error?.message.includes("not authenticated")) {
          Router.replace("/login");
        }
      },
    }),
    fetchExchange,
  ],
});
