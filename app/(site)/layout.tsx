import type { ReactNode } from "react";
import Nav from "@/components/Nav";

// Pages with the shared nav. Pages with their own header nav (e.g. /fashion-design)
// live outside this group.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
