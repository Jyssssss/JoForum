import { Heading } from "@chakra-ui/layout";
import { Box, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { Layout } from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

const Post = ({}) => {
  const router = useRouter();
  const [{ data, fetching }] = usePostQuery({
    variables: {
      id: parseInt(router.query.id as string),
    },
  });
  return (
    <Layout>
      {fetching ? (
        <Box>Loading...</Box>
      ) : !data?.post ? (
        <Box>No post</Box>
      ) : (
        <>
          <Heading mb={4}>{data.post.title}</Heading>
          <Box mt={4}>
            <Text whiteSpace="pre-line">{data.post.text}</Text>
          </Box>
        </>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
