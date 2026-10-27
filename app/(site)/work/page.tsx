import type { Metadata } from "next";
import WorkPicker from "@/components/WorkPicker";

export const metadata: Metadata = {
  title: "Work | Taiwo Adeoshun",
};

export default function WorkPage() {
  return <WorkPicker />;
}
