import { notFound } from "next/navigation";

import { ServiceDetailView } from "@/components/services/service-detail-view";
import {
  getServiceBySlugExtended,
  serviceCatalogItems,
} from "@/lib/service-catalog";

/** Merges live `/api/services` rows with the built-in catalog fallback. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return serviceCatalogItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getServiceBySlugExtended(slug);
  if (!item) return { title: "Service | Hire A Drone" };
  return {
    title: `${item.title} | Services | Hire A Drone`,
    description: item.description,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getServiceBySlugExtended(slug);
  if (!item) notFound();

  return <ServiceDetailView item={item} />;
}
