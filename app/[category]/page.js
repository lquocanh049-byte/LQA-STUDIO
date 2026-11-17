import Gallery from "@/components/Gallery";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CATEGORIES.map((item) => ({ category: item.slug }));
}

export default function CategoryPage({ params }) {
  const category = getCategory(params.category);
  if (!category) notFound();
  return <Gallery category={category} />;
}
