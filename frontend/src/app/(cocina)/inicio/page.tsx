import { HomeScreen } from "@/components/home/HomeScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio · PrepPari",
};

export default function Page() {
  return <HomeScreen />;
}
