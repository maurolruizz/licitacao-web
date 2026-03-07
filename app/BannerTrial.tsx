'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LICITACAO_STORAGE_KEYS } from '../lib/storageKeys';

export default function BannerTrial() {
  const [authData, setAuthData] = useState<any>(null);
  const [diasRestantes, setDiasRestantes] = useState(30);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/login' || pathname === '/cadastro') return;

    const pipelinePages = ['/dfd', '/etp', '/tr', '/pncp', '/novo'];
    const isPipeline = pipelinePages.some((p) => pathname?.startsWith(p));

    const data = localStorage.getItem('licitacao_auth');
    if (!data) {
      if (!isPipeline) router.push('/login');
      return;
    }
    const parsed = JSON.parse(data);
    setAuthData(parsed);
    const dataCadastro = new Date(parsed.data_cadastro);
    const dataAtual = new Date();
    const diffTime = Math.abs(dataAtual.getTime() - dataCadastro.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const restantes = 30 - diffDays;
    setDiasRestantes(restantes > 0 ? restantes : 0);
  }, [pathname, router]);

  if (pathname === '/login' || pathname === '/cadastro' || !authData) return null;

  const handleLogout = () => {
    LICITACAO_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('licitacao_')) localStorage.removeItem(key);
      });
      sessionStorage.clear();
    }
    router.push('/login');
  };

  return (
    <div className="relative z-50 pointer-events-none bg-slate-900 text-slate-300 py-2 px-6 flex justify-between items-center text-sm font-mono border-b-2 border-yellow-500 shadow-md">
      
      <div className="flex items-center gap-3 pointer-events-none">
        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
          {authData.cidade}
        </span>
        <span>| Usuário: {authData.responsavel}</span>
      </div>
      
      <div className="flex items-center gap-4">
        
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Licença Trial GovTech: <strong className="text-yellow-400">{diasRestantes} dias restantes</strong></span>
        </div>
        
        <button 
          type="button"
          onClick={() => router.push('/processos')} 
          className="pointer-events-auto bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1 rounded transition-colors text-xs tracking-wider border border-slate-500"
        >
          🗂️ Meus Processos
        </button>

        <button 
          type="button"
          onClick={() => router.push('/upgrade')} 
          className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded transition-colors text-xs uppercase tracking-wider"
        >
          Fazer Upgrade
        </button>
        
        <button 
          type="button"
          onClick={handleLogout} 
          className="pointer-events-auto text-slate-400 hover:text-red-400 ml-2 text-xs transition-colors font-bold"
        >
          Sair [x]
        </button>

      </div>
    </div>
  );
}