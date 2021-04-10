import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = () => {
  const [{ data, fetching }] = useMeQuery();

  return (
    <Flex bg="darkturquoise" p={4}>
      <Box ml={"auto"}>
        {fetching ? null : !data?.me ? (
          <>
            <NextLink href="/login">
              <Button bg="lightseagreen" color="white" mr={4}>
                Login
              </Button>
            </NextLink>
            <NextLink href="/register">
              <Button bg="lightseagreen" color="white">
                Register
              </Button>
            </NextLink>
          </>
        ) : (
          <Flex>
            <Box mr={4}>{data.me.username}</Box>
            <Button bg="lightseagreen" color="white">
              Logout
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
