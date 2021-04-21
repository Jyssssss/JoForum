import { Box, Button, Flex } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";

interface NavBarProps {
  empty?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ empty }) => {
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

  return (
    <Flex position="sticky" top={0} zIndex={1} bg="darkturquoise" p={4}>
      {empty ? null : (
        <Box ml={"auto"}>
          {fetching ? null : !data?.me ? (
            <>
              <NextLink href="/login">
                <Button variant="regular" mr={4}>
                  Login
                </Button>
              </NextLink>
              <NextLink href="/register">
                <Button variant="regular">Register</Button>
              </NextLink>
            </>
          ) : (
            <Flex>
              <Box mr={8} mt={2} fontFamily={"mono"}>
                {data.me.username}
              </Box>
              <Button
                variant="regular"
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
