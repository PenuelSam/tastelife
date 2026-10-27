import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LanePage from "@/components/lane/LanePage";
import { lanes, visibleItems } from "@/data/lanes";

const lane = lanes["fashion-design"];
const items = visibleItems(lane);

export function generateStaticParams() {
  return items.length ? items.map((item) => ({ id: item.id })) : [{ id: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/fashion-design/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = items.find((i) => i.id === id);
  return { title: item ? `${item.title} | Fashion Design | Taiwo Adeoshun` : "Fashion Design | Taiwo Adeoshun" };
}

async function KnownItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!items.some((i) => i.id === id)) notFound();
  return null;
}

export default function Page({ params }: PageProps<"/fashion-design/[id]">) {
  return (
    <>
      <LanePage slug="fashion-design" />
      <Suspense fallback={null}>
        <KnownItem params={params} />
      </Suspense>
    </>
  );
}
