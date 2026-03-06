"use client";

import React, { Suspense } from "react";
import NovoProcessoPageContent from "./NovoProcessoPageContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-8">Carregando...</div>}>
      <NovoProcessoPageContent />
    </Suspense>
  );
}