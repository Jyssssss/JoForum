import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

export const ForgotPassword: React.FC<{}> = ({}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, { setErrors }) => {
          await forgotPassword(values);
          setIsCompleted(true);
        }}
      >
        {({ isSubmitting }) =>
          !isCompleted ? (
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
              />
              <Button
                variant="regular"
                mt={4}
                type="submit"
                isLoading={isSubmitting}
              >
                Confirm
              </Button>
            </Form>
          ) : (
            <Box>The password reset link has been sent to your email</Box>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
