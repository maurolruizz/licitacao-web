'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const data = localStorage.getItem('licitacao_auth');
    
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.login === login && parsed.senha === senha) {
        router.push('/');
        return;
      }
    }
    alert("Credenciais inválidas ou órgão não cadastrado.");
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GovTech Engine</h1>
          <p className="text-slate-400 mt-2 text-sm">Plataforma de Blindagem Probatória (Lei 14.133)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Login do Órgão (CNPJ ou Cidade)</label>
            <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} required className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Digite seu usuário..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Senha de Acesso</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/20 text-lg mt-4">
            Acessar Plataforma
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-700 pt-6">
          <p className="text-slate-400 text-sm mb-2">Sua instituição ainda não possui acesso?</p>
          <Link href="/cadastro" className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-md transition-colors text-sm">
            Criar Conta (30 Dias Grátis)
          </Link>
        </div>
      </div>
    </main>
  );
}