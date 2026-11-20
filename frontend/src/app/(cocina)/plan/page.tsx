import { PlannerScreen } from "@/components/planner/PlannerScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan de la semana · PrepPari",
};

export default function Page() {
  return <PlannerScreen />;
}
