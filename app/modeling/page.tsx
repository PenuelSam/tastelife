import type { Metadata } from "next";
import LanePage from "@/components/lane/LanePage";

export const metadata: Metadata = {
  title: "Modeling | Taiwo Adeoshun",
};

export default function Page() {
  return <LanePage slug="modeling" />;
}
