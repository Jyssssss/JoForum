import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useGetPostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import React from "react";
import { Button } from "@chakra-ui/react";
import NextLink from "next/link";

const Index = () => {
  const [{ data }] = useGetPostsQuery({
    variables: {
      limit: 10,
    },
  });
  return (
    <Layout>
      <NextLink href="/create-post">
        <Button
          bg="lightseagreen"
          color="white"
          mb={4}
          _hover={{ background: "darkcyan" }}
        >
          Create Post
        </Button>
      </NextLink>
      <br></br>
      {!data ? (
        <div>Loading...</div>
      ) : (
        data.getPosts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
