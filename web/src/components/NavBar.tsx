import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = () => {
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

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
            <Box mr={8} mt={2}>{data.me.username}</Box>
            <Button
              bg="lightseagreen"
              color="white"
              onClick={() => {
                logout();
              }}
              isLoading={logoutFetching}
            >
              Logout
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
