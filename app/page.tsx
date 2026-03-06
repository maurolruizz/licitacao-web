'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = localStorage.getItem('licitacao_auth');
    if (!auth) {
      router.replace('/login');
      return;
    }
    setShowLanding(true);
  }, [router]);

  if (!showLanding) return null;

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-sans text-slate-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-white">LicitaIA — GovTech Engine</h1>
        <p className="text-slate-400 text-lg">
          Plataforma de blindagem probatória e governança para contratações públicas (Lei 14.133/2021).
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            Entrar
          </Link>
          <Link
            href="/novo"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            Novo Processo
          </Link>
        </div>
      </div>
    </main>
  );
}
