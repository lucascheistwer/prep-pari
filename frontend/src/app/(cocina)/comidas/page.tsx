import { LibraryScreen } from "@/components/dishes/LibraryScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis comidas · PrepPari",
};

export default function Page() {
  return <LibraryScreen />;
}
