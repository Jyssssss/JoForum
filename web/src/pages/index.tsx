import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { Layout } from "../components/Layout";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { UpvoteSection } from "../components/UpvoteSection";
import { DeleteIcon } from "@chakra-ui/icons";
import { ConfirmModal } from "../components/ConfirmModal";

const Index = () => {
  const [variables, setvariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data: postData, fetching: postFetching }] = usePostsQuery({
    variables,
  });
  const [{ data: meData }] = useMeQuery();
  const [, deletePost] = useDeletePostMutation();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const [deletedPostId, setDeletedPostId] = useState(-1);

  return (
    <Layout>
      {!postData && postFetching ? (
        <div>Loading...</div>
      ) : !postFetching && !postData ? (
        <div>No posts</div>
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
                      <IconButton
                        aria-label="Delete"
                        colorScheme="blackAlpha"
                        icon={<DeleteIcon></DeleteIcon>}
                        onClick={() => {
                          setDeletedPostId(p.id);
                          onDeleteModalOpen();
                        }}
                      ></IconButton>
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
      <ConfirmModal
        message="Click Confirm to delete the post"
        onConfirm={async () => {
          await deletePost({ id: deletedPostId });
          onDeleteModalClose();
        }}
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
      ></ConfirmModal>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
