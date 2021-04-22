import { Box, Flex, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import {
  useMeQuery,
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useIsAuth } from "../../../utils/useIsAuth";

const EditPost: React.FC<{}> = () => {
  const router = useRouter();
  const [, updatePost] = useUpdatePostMutation();
  const [{ data, fetching }] = usePostQuery({
    variables: {
      id: parseInt(router.query.id as string),
    },
  });
  const [{ data: meData, fetching: meFetching }] = useMeQuery();
  useIsAuth();

  useEffect(() => {
    if (!meFetching && !fetching && meData?.me?.id !== data?.post?.creator.id) {
      router.replace("/post/[id]", `/post/${data?.post?.id}`);
    }
  }, [meFetching, fetching, meData, data, router]);

  return (
    <Layout variant="small">
      {fetching || meFetching ? (
        <Box>Loading...</Box>
      ) : !data?.post ? (
        <Box>No post</Box>
      ) : (
        <Formik
          initialValues={{ title: data.post.title, text: data.post.text }}
          onSubmit={async (values, { setErrors }) => {
            const { error } = await updatePost({
              id: data.post?.id ?? -1,
              title: values.title,
              text: values.text,
            });
            if (!error) {
              router.back();
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField name="title" placeholder="title" label="Title" />
              <Box mt={4}>
                <InputField name="text" label="Body" height={80} textarea />
              </Box>
              <Flex justifyContent="center">
                <Button
                  variant="regular"
                  mt={4}
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Update
                </Button>
              </Flex>
            </Form>
          )}
        </Formik>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
