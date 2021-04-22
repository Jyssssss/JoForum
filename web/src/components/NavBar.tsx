import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useRouter } from "next/router";

interface NavBarProps {
  empty?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ empty }) => {
  const router = useRouter();
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

  return (
    <Flex
      position="sticky"
      top={0}
      zIndex={1}
      bg="darkturquoise"
      p={4}
      align="center"
    >
      <Flex flex={1} m="auto" maxW={800}>
        <NextLink href="/">
          <Link>
            <Heading>JoForum</Heading>
          </Link>
        </NextLink>
        {empty ? null : (
          <>
            {fetching ? null : !data?.me ? (
              <Box ml={"auto"}>
                <NextLink href="/login">
                  <Button variant="regular" mr={4}>
                    Login
                  </Button>
                </NextLink>
                <NextLink href="/register">
                  <Button variant="regular">Register</Button>
                </NextLink>
              </Box>
            ) : (
              <>
                <Box ml="8">
                  <NextLink href="/create-post">
                    <Button variant="regular">Create Post</Button>
                  </NextLink>
                </Box>
                <Box ml={"auto"}>
                  <Flex>
                    <Box mr={8} mt={2} fontFamily={"mono"}>
                      {data.me.username}
                    </Box>
                    <Button
                      variant="regular"
                      onClick={async () => {
                        await logout();
                        router.reload();
                      }}
                      isLoading={logoutFetching}
                    >
                      Logout
                    </Button>
                  </Flex>
                </Box>
              </>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
};
