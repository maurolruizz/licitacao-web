"use client";

import React, { Suspense } from "react";
import PesquisaPageContent from "./PesquisaPageContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-8">Carregando...</div>}>
      <PesquisaPageContent />
    </Suspense>
  );
}