import { Suspense } from "react";
import { AuthPortal } from "@/components/auth/auth-portal";

export default function Page() {
  return (
    <Suspense>
      <AuthPortal />
    </Suspense>
  );
}
