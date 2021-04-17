import React from "react";
import { NavBar } from "./NavBar";
import { Wrapper } from "./Wrapper";

export type WrapperVariant = "small" | "regular";
interface LayoutProps {
  variant?: WrapperVariant;
  empty?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, variant, empty }) => {
  return (
    <>
      <NavBar empty={empty} />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  );
};
