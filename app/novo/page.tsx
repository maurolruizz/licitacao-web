"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NovoProcessoPageContent from "./NovoProcessoPageContent";

export default function Page() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("licitacao_auth");
    if (!auth) {
      router.replace("/login");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) return null;

  return (
    <Suspense fallback={<div className="text-white p-8">Carregando...</div>}>
      <NovoProcessoPageContent />
    </Suspense>
  );
}