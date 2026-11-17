import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { MasukForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Masuk — DJSport" };

export default function MasukPage() {
  return (
    <AuthCard title="Masuk" subtitle="Khusus tim admin DJSport.">
      <Suspense>
        <MasukForm />
      </Suspense>
    </AuthCard>
  );
}
