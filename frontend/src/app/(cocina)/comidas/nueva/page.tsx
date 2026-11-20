import { CreateDishScreen } from "@/components/dishes/CreateDishScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva comida · PrepPari",
};

export default function Page() {
  return <CreateDishScreen />;
}
