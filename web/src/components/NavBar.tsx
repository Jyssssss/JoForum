import { Box, Button, Flex } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {
  empty?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ empty }) => {
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

  return (
    <Flex position="sticky" top={0} zIndex={1} bg="darkturquoise" p={4}>
      {empty ? null : (
        <Box ml={"auto"}>
          {fetching ? null : !data?.me ? (
            <>
              <NextLink href="/login">
                <Button
                  bg="lightseagreen"
                  color="white"
                  mr={4}
                  _hover={{ background: "darkcyan" }}
                >
                  Login
                </Button>
              </NextLink>
              <NextLink href="/register">
                <Button
                  bg="lightseagreen"
                  color="white"
                  _hover={{ background: "darkcyan" }}
                >
                  Register
                </Button>
              </NextLink>
            </>
          ) : (
            <Flex>
              <Box mr={8} mt={2} fontFamily={"mono"}>
                {data.me.username}
              </Box>
              <Button
                bg="lightseagreen"
                color="white"
                _hover={{ background: "darkcyan" }}
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
      )}
    </Flex>
  );
};
