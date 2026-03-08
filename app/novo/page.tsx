"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAuth, refreshSession } from "@/lib/auth";
import NovoProcessoPageContent from "./NovoProcessoPageContent";

export default function Page() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    console.log("[AUTH_GUARD] /novo");
    if (requireAuth(router)) {
      refreshSession();
      setAllowed(true);
    }
  }, [router]);

  if (!allowed) return null;

  return (
    <Suspense fallback={<div className="text-white p-8">Carregando...</div>}>
      <NovoProcessoPageContent />
    </Suspense>
  );
}