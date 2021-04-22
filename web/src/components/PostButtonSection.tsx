import React, { useEffect, useState } from "react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Box, IconButton, useDisclosure } from "@chakra-ui/react";
import NextLink from "next/link";
import { useDeletePostMutation } from "../generated/graphql";
import { ConfirmModal } from "./ConfirmModal";
import { useRouter } from "next/router";

interface PostButtonSectionProps {
  id: number;
}

export const PostButtonSection: React.FC<PostButtonSectionProps> = ({ id }) => {
  const router = useRouter();
  const [, deletePost] = useDeletePostMutation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Manually add useState and useEffect to solve the error:
  // Can't perform a React state update on an unmounted component.
  // This is a no-op, but it indicates a memory leak in your application.
  // To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  useEffect(() => {
    setIsModalOpen(isOpen);
    return () => {
      setIsModalOpen(false);
    };
  }, [isOpen, isModalOpen]);

  return (
    <>
      <Box>
        <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
          <IconButton
            mr={4}
            aria-label="Edit"
            colorScheme="blackAlpha"
            icon={<EditIcon></EditIcon>}
          ></IconButton>
        </NextLink>
        <IconButton
          aria-label="Delete"
          colorScheme="blackAlpha"
          icon={<DeleteIcon></DeleteIcon>}
          onClick={() => {
            onOpen();
          }}
        ></IconButton>
      </Box>
      <ConfirmModal
        message="Click Confirm to delete the post"
        onConfirm={async () => {
          await deletePost({ id: id });
          onClose();
          if (router.route === "/post/[id]") {
            router.push("/");
          }
        }}
        isOpen={isModalOpen}
        onClose={onClose}
      ></ConfirmModal>
    </>
  );
};
