import { ShoppingScreen } from "@/components/shopping/ShoppingScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compras · PrepPari",
};

export default function Page() {
  return <ShoppingScreen />;
}
