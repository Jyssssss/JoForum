import { FieldError } from "src/resolvers/FieldError";
import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";
import EmailVaidator from "email-validator";

export const validateRegister = (
  options: UsernamePasswordInput
): FieldError[] => {
  const errors: FieldError[] = [];
  if (options.username.length < 3) {
    errors.push({
      field: "username",
      message: "username length must be greater than 2",
    });
  }
  if (["@", "(", ")"].some((v) => options.username.includes(v))) {
    errors.push({
      field: "username",
      message: "username cannot include @",
    });
  }
  if (options.password.length < 4) {
    errors.push({
      field: "password",
      message: "password length must be greater than 3",
    });
  }
  if (!EmailVaidator.validate(options.email)) {
    errors.push({
      field: "email",
      message: "invalid email format",
    });
  }
  return errors;
};
