import type { Metadata } from "next";
import LanePage from "@/components/lane/LanePage";

export const metadata: Metadata = {
  title: "Fashion Design | Taiwo Adeoshun",
};

export default function Page() {
  return <LanePage slug="fashion-design" />;
}
