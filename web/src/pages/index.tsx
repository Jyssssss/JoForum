import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useMeQuery, usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { UpvoteSection } from "../components/UpvoteSection";
import { PostButtonSection } from "../components/PostButtonSection";

const Index = () => {
  const [variables, setvariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data: postData, fetching: postFetching }] = usePostsQuery({
    variables,
  });
  const [{ data: meData }] = useMeQuery();

  return (
    <Layout>
      {!postData && postFetching ? (
        <Box>Loading...</Box>
      ) : !postFetching && !postData ? (
        <Box>No posts</Box>
      ) : (
        <Stack spacing={8}>
          {postData?.posts.posts.map((p) =>
            !p ? null : (
              <Box
                key={p.id}
                p={5}
                shadow="md"
                borderWidth="1px"
                flex="1"
                borderRadius="md"
              >
                <Flex>
                  <UpvoteSection post={p}></UpvoteSection>
                  <Box>
                    <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                      <Link>
                        <Heading fontSize="xl">{p.title}</Heading>
                      </Link>
                    </NextLink>
                    <Text>posted by {p.creator.username}</Text>
                    <Text mt={4}>{p.textSnippet}</Text>
                  </Box>
                  {meData?.me?.id === p.creator.id ? (
                    <Box ml="auto">
                      <PostButtonSection id={p.id} />
                    </Box>
                  ) : null}
                </Flex>
              </Box>
            )
          )}
        </Stack>
      )}
      {postData && postData.posts.hasMore ? (
        <Flex>
          <Button
            isLoading={postFetching}
            variant="regular"
            m="auto"
            my={8}
            onClick={() => {
              setvariables({
                limit: variables.limit,
                cursor:
                  postData.posts.posts[postData.posts.posts.length - 1]
                    .createdAt,
              });
            }}
          >
            More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
