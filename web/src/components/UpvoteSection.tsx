import React, { useState } from "react";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface UpvoteSectionProps {
  post: PostSnippetFragment;
}

export const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();
  
  return (
    <Flex
      direction="column"
      justifyContent="space-around"
      alignItems="center"
      mr={4}
    >
      <Box>
        <IconButton
          aria-label="Upvote"
          icon={<ChevronUpIcon></ChevronUpIcon>}
          colorScheme="teal"
          onClick={async () => {
            setLoadingState("upvote-loading");
            await vote({ postId: post.id, value: true });
            setLoadingState("not-loading");
          }}
          isLoading={loadingState === "upvote-loading"}
        ></IconButton>
      </Box>
      <Box>{post.points}</Box>
      <Box>
        <IconButton
          aria-label="Downvote"
          icon={<ChevronDownIcon></ChevronDownIcon>}
          colorScheme="teal"
          onClick={async () => {
            setLoadingState("downvote-loading");
            await vote({ postId: post.id, value: false });
            setLoadingState("not-loading");
          }}
          isLoading={loadingState === "downvote-loading"}
        ></IconButton>
      </Box>
    </Flex>
  );
};
