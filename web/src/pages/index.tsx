import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import React, { useState } from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { UpvoteSection } from "../components/UpvoteSection";

const Index = () => {
  const [variables, setvariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  return (
    <Layout>
      <Flex>
        <Heading>JoForum</Heading>
        <NextLink href="/create-post">
          <Button variant="regular" mb={4} ml="auto">
            Create Post
          </Button>
        </NextLink>
      </Flex>
      <br></br>
      {!data && fetching ? (
        <div>Loading...</div>
      ) : !fetching && !data ? (
        <div>No posts</div>
      ) : (
        <Stack spacing={8}>
          {data?.posts.posts.map((p) => (
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
                  <Heading fontSize="xl">{p.title}</Heading>
                  <Text>posted by {p.creator.username}</Text>
                  <Text mt={4}>{p.textSnippet}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            isLoading={fetching}
            variant="regular"
            m="auto"
            my={8}
            onClick={() => {
              setvariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
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
