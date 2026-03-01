'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradePlanos() {
  const [orgao, setOrgao] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('licitacao_orgao_data');
    if (data) {
      setOrgao(JSON.parse(data));
    }
  }, []);

  const gerarPropostaEmpenho = () => {
    if (!orgao) return;
    
    const conteudo = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Proposta Comercial GovTech</title></head><body>
      <h2 style="text-align: center; font-family: Arial; color: #1e3a8a;">PROPOSTA COMERCIAL E FUNDAMENTAÇÃO LEGAL</h2>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #666;">Contratação Direta SaaS B2G - Plataforma GovTech Engine</p>
      
      <p style="font-family: Arial; font-size: 11pt;"><strong>À:</strong> ${orgao.cidade} (${orgao.populacao} habitantes)</p>
      <p style="font-family: Arial; font-size: 11pt;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. Objeto</h3>
      <p style="font-family: Arial; font-size: 11pt; text-align: justify; line-height: 1.5;">
        Concessão de licença de uso (Software as a Service) da Plataforma GovTech Engine, ferramenta estruturadora para elaboração de DFD, ETP, TR e Pesquisa de Preços (IN 65), contemplando Motor IQR, Data Moat e Validador WORM de Compliance.
      </p>

      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. Valores e Fundamentação Legal (Dispensa de Licitação)</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial; font-size: 10pt;">
        <thead style="background-color: #f1f5f9;">
          <tr><th style="padding: 8px;">Descrição do Serviço</th><th style="padding: 8px;">Período</th><th style="padding: 8px;">Valor Total (R$)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px;">Licença GovTech Engine (Acessos Ilimitados ao Órgão)</td>
            <td style="padding: 8px; text-align: center;">12 Meses</td>
            <td style="padding: 8px; text-align: center;"><strong>R$ 24.840,00</strong></td>
          </tr>
        </tbody>
      </table>
      
      <p style="font-family: Arial; font-size: 10pt; text-align: justify; line-height: 1.5; background-color: #fefce8; padding: 10px; border: 1px dashed #eab308; margin-top: 15px;">
        <strong>Enquadramento Jurídico:</strong> O valor global anual desta proposta (R$ 24.840,00) encontra-se estritamente dentro do limite legal de R$ 59.906,02, permitindo a contratação direta mediante <strong>Dispensa de Licitação</strong>, conforme expresso no Art. 75, inciso II, da Lei 14.133/2021.
      </p>

      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">3. Dados para Empenho e Pagamento</h3>
      <ul style="font-family: Arial; font-size: 11pt; line-height: 1.6;">
        <li><strong>Empresa:</strong> GovTech Engine Soluções em Compliance S/A</li>
        <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
        <li><strong>Banco:</strong> 341 - Itaú | <strong>Ag:</strong> 0001 | <strong>CC:</strong> 12345-6</li>
        <li><strong>Chave PIX (CNPJ):</strong> 00.000.000/0001-00</li>
      </ul>
      
      <br><br>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #666;">
        Proposta válida por 30 dias.<br>A liberação definitiva do sistema ocorrerá mediante o envio da Nota de Empenho ou comprovante de pagamento.
      </p>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = 'Proposta_Comercial_GovTech_Anual.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto mt-8">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Blinde sua instituição de forma definitiva.</h1>
          <p className="text-lg text-slate-600">Assine o GovTech Engine via <strong className="text-blue-600">Dispensa de Licitação (Art. 75, II)</strong> e mitigue os riscos do TCU.</p>
        </div>

        {/* ESTRUTURA REFEITA PARA 3 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* PLANO TRIMESTRAL */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-800 p-6 text-center border-b border-slate-700">
              <h2 className="text-xl font-bold text-white mb-2">Plano Trimestral</h2>
              <p className="text-slate-400 text-xs">Licença de 3 Meses</p>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-slate-900">R$ 8.850</span>
                <span className="text-slate-500 text-sm"> /total</span>
                <div className="text-xs font-bold mt-2 text-slate-600 bg-slate-100 py-1 px-2 rounded-md inline-block">
                  Até 3x sem juros (CPGF)
                </div>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                <li className="flex items-center gap-2">✅ Usuários Ilimitados do Órgão</li>
                <li className="flex items-center gap-2">✅ Motor IQR (IN 65) em Tempo Real</li>
                <li className="flex items-center gap-2 text-slate-400">❌ Acesso ao Data Moat (Analytics)</li>
                <li className="flex items-center gap-2 text-slate-400">❌ Automação IBGE Integrada</li>
              </ul>
              <button onClick={() => alert("Gateway de Cartão (3x sem juros) será acoplado aqui.")} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg text-sm mt-auto">
                Pagar com Cartão (CPGF)
              </button>
            </div>
          </div>

          {/* PLANO SEMESTRAL */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-blue-900 p-6 text-center border-b border-blue-800">
              <h2 className="text-xl font-bold text-white mb-2">Plano Semestral</h2>
              <p className="text-blue-200 text-xs">Licença de 6 Meses</p>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-slate-900">R$ 13.800</span>
                <span className="text-slate-500 text-sm"> /total</span>
                <div className="text-xs font-bold mt-2 text-blue-700 bg-blue-50 py-1 px-2 rounded-md inline-block">
                  Até 6x sem juros (CPGF)
                </div>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                <li className="flex items-center gap-2">✅ Usuários Ilimitados do Órgão</li>
                <li className="flex items-center gap-2">✅ Motor IQR (IN 65) em Tempo Real</li>
                <li className="flex items-center gap-2">✅ Matriz de Risco e Validador WORM</li>
                <li className="flex items-center gap-2 text-slate-400">❌ Acesso Premium ao Data Moat</li>
              </ul>
              <button onClick={() => alert("Gateway de Cartão (6x sem juros) será acoplado aqui.")} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg text-sm mt-auto">
                Pagar com Cartão (CPGF)
              </button>
            </div>
          </div>

          {/* PLANO ANUAL (O MAIS ESCOLHIDO / EMPENHO) */}
          <div className="bg-blue-600 rounded-2xl shadow-2xl border-2 border-yellow-400 overflow-hidden relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Mais Escolhido
            </div>
            <div className="p-6 text-center border-b border-blue-500">
              <h2 className="text-2xl font-bold text-white mb-2">Plano Anual</h2>
              <p className="text-blue-200 text-xs">Licença de 12 Meses</p>
            </div>
            <div className="p-8 bg-white flex-1 flex flex-col">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-slate-900">R$ 24.840</span>
                <span className="text-slate-500 text-sm"> /ano</span>
                <div className="text-[11px] text-green-700 font-bold mt-2 uppercase tracking-wide bg-green-50 py-1 px-2 rounded">
                  Abaixo do teto legal (Dispensa Art. 75, II)
                </div>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                <li className="flex items-center gap-2">✅ <strong className="text-blue-600">Todas as features Semestrais</strong></li>
                <li className="flex items-center gap-2">✅ <strong className="text-blue-600">Acesso Premium ao Data Moat</strong></li>
                <li className="flex items-center gap-2">✅ Automação API IBGE Ativa</li>
                <li className="flex items-center gap-2">✅ Suporte Prioritário Exclusivo</li>
              </ul>
              
              <div className="mt-auto">
                <button onClick={() => alert("Gateway de Cartão (12x sem juros) será acoplado aqui.")} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors shadow-md text-sm mb-3">
                  💳 Pagar em até 12x (CPGF)
                </button>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <p className="text-[11px] text-blue-800 font-bold mb-2 uppercase">Pagamento via Empenho/PIX Oficial</p>
                  <button onClick={gerarPropostaEmpenho} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 text-xs">
                    📄 Gerar Proposta PDF Oficial
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}