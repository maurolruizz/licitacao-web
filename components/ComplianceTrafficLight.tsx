'use client';

/**
 * Semáforo de conformidade da fase preparatória (Lei 14.133/2021).
 * Exibe o status de cada etapa: DFD, ETP, TR, Pesquisa de Preços (PNCP).
 * Verde = concluído | Amarelo = incompleto (próxima etapa) | Vermelho = não realizado
 */

export type PhaseStatus = 'valid' | 'incomplete' | 'missing';

const FASES = [
  { key: 'DFD', label: 'DFD', ordem: 1 },
  { key: 'ETP', label: 'ETP', ordem: 2 },
  { key: 'TR', label: 'TR', ordem: 3 },
  { key: 'PNCP', label: 'Pesquisa de Preços (PNCP)', ordem: 4 },
] as const;

const FASE_ATUAL_ORDEM: Record<string, number> = {
  DFD_CONCLUIDO: 1,
  ETP_CONCLUIDO: 2,
  TR_CONCLUIDO: 3,
  PESQUISA_CONCLUIDA: 4,
};

function getStatus(faseOrdem: number, faseAtual: string): PhaseStatus {
  const ordemAtual = FASE_ATUAL_ORDEM[faseAtual] ?? 0;
  if (faseOrdem <= ordemAtual) return 'valid'; // fase já concluída
  if (faseOrdem === ordemAtual + 1) return 'incomplete'; // próxima etapa (incompleta)
  return 'missing';
}

const statusStyles: Record<PhaseStatus, { dot: string; text: string; label: string }> = {
  valid: {
    dot: 'bg-emerald-500 ring-2 ring-emerald-200',
    text: 'text-slate-800',
    label: 'Concluído',
  },
  incomplete: {
    dot: 'bg-amber-400 ring-2 ring-amber-200',
    text: 'text-slate-700',
    label: 'Incompleto',
  },
  missing: {
    dot: 'bg-red-500 ring-2 ring-red-200',
    text: 'text-slate-600',
    label: 'Não realizado',
  },
};

export interface ComplianceTrafficLightProps {
  /** Fase atual do processo: DFD_CONCLUIDO | ETP_CONCLUIDO | TR_CONCLUIDO | PESQUISA_CONCLUIDA */
  faseAtual: string;
  /** Título opcional do bloco */
  title?: string;
  /** Classe CSS adicional no container */
  className?: string;
}

export function ComplianceTrafficLight({ faseAtual, title = 'Etapas do processo (Lei 14.133/2021)', className = '' }: ComplianceTrafficLightProps) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
      <ul className="space-y-2">
        {FASES.map(({ key, label, ordem }) => {
          const status = getStatus(ordem, faseAtual);
          const style = statusStyles[status];
          return (
            <li key={key} className="flex items-center gap-3">
              <span
                className={`inline-block h-3 w-3 rounded-full flex-shrink-0 ${style.dot}`}
                title={style.label}
                aria-hidden
              />
              <span className={`text-sm font-medium ${style.text}`}>{label}</span>
              <span className="ml-auto text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {style.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
