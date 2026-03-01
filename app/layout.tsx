import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// INJEÇÃO COMERCIAL (Projeto PLG)
import BannerTrial from './BannerTrial';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GovTech Engine - Lei 14.133/21',
  description: 'Plataforma de Blindagem Probatória e Governança para Contratações Públicas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        
        {/* === CAMADA COMERCIAL (PLG) === */}
        {/* O Banner rastreia os 30 dias e bloqueia usuários não logados */}
        <BannerTrial />
        
        {/* === NÚCLEO DO SISTEMA (REGRESSÃO ZERO) === */}
        {/* Todo o seu DFD, ETP, TR e Auditoria rodam aqui dentro de forma intacta */}
        {children}
        
      </body>
    </html>
  );
}