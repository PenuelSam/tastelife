import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LanePage from "@/components/lane/LanePage";
import { lanes, visibleItems } from "@/data/lanes";

// Shareable /styling/<id>: the lane page with that item's detail view open.
// LanePage reads the id from the URL itself; params are only needed to 404.
const lane = lanes["styling"];
const items = visibleItems(lane);

export function generateStaticParams() {
  // Cache Components needs at least one param; with no media yet, a placeholder
  // id (which 404s below) stands in until the lane has visible items.
  return items.length ? items.map((item) => ({ id: item.id })) : [{ id: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/styling/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = items.find((i) => i.id === id);
  return { title: item ? `${item.title} — Styling — Taiwo Adeoshun` : "Styling — Taiwo Adeoshun" };
}

async function KnownItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!items.some((i) => i.id === id)) notFound();
  return null;
}

export default function Page({ params }: PageProps<"/styling/[id]">) {
  return (
    <>
      <LanePage slug="styling" />
      <Suspense fallback={null}>
        <KnownItem params={params} />
      </Suspense>
    </>
  );
}
