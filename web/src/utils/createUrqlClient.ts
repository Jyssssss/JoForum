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
} from "../generated/graphql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { appUpdateQuery } from "./appUpdateQuery";
import Router from "next/router";

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

    // info.partial = !cache.resolve(entityKey, fieldKey);

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

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
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
