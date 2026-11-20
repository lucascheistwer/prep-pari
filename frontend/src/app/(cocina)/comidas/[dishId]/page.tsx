import { DishScreen } from "@/components/dishes/DishScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comida · PrepPari",
};

export default async function Page({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId } = await params;
  return <DishScreen dishId={dishId} />;
}
