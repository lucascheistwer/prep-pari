import { Suspense } from "react";
import { AcceptInvitationScreen } from "@/components/household/AcceptInvitationScreen";

export const metadata = {
  title: "Invitación · PrepPari",
};

export default function InvitationPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-text-muted">Cargando…</p>}>
      <AcceptInvitationScreen />
    </Suspense>
  );
}
