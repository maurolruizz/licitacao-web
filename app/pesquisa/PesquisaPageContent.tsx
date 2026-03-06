'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Rota legada: blueprint define Fase 4 como /pncp.
 * Redireciona para /pncp preservando id e regime na query.
 */
export default function PesquisaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    const regime = searchParams.get('regime');
    const query = new URLSearchParams();
    if (id) query.set('id', id);
    if (regime) query.set('regime', regime);
    const qs = query.toString();
    router.replace(qs ? `/pncp?${qs}` : '/pncp');
  }, [router, searchParams]);

  return null;
}
