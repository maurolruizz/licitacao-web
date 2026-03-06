'use client';

/**
 * Painel de explicação legal exibido quando o sistema toma uma decisão de conformidade.
 * Fundamentação: Lei 14.133/2021, IN 65/2021, orientações TCU.
 */

export type LegalExplanationVariant =
  | 'dispensa'
  | 'inexigibilidade'
  | 'pesquisa_precos_valida'
  | 'valor_dentro_limite'
  | 'custom';

const VARIANT_CONTENT: Record<LegalExplanationVariant, { title: string; explanation: string; legalBasis: string }> = {
  dispensa: {
    title: 'Dispensa de licitação',
    explanation: 'Contratação direta permitida. O valor e o motivo escolhido estão dentro do que a lei permite.',
    legalBasis: 'Lei 14.133/2021, art. 75.',
  },
  inexigibilidade: {
    title: 'Inexigibilidade de licitação',
    explanation: 'Usado quando só um fornecedor pode atender ou quando a competição não é possível. É preciso documentar o motivo.',
    legalBasis: 'Lei 14.133/2021, art. 74.',
  },
  pesquisa_precos_valida: {
    title: 'Pesquisa de preços válida',
    explanation: 'Foram usados pelo menos 3 preços e a diferença entre eles está dentro do aceitável. O valor de referência pode ser usado para a contratação.',
    legalBasis: 'Conforme orientações do Tribunal de Contas (norma de pesquisa de preços).',
  },
  valor_dentro_limite: {
    title: 'Valor dentro do limite legal',
    explanation: 'O valor informado está dentro do teto permitido para o tipo de contratação escolhido.',
    legalBasis: 'Lei 14.133/2021 (limites para dispensa).',
  },
  custom: {
    title: '',
    explanation: '',
    legalBasis: '',
  },
};

export interface LegalExplanationPanelProps {
  /** Variante pré-definida (dispensa, pesquisa_precos_valida, valor_dentro_limite, etc.) */
  variant?: LegalExplanationVariant;
  /** Título do painel (usado quando variant="custom") */
  title?: string;
  /** Texto explicativo (usado quando variant="custom") */
  explanation?: string;
  /** Base legal (ex.: "Art. 75 da Lei 14.133/2021.") (usado quando variant="custom") */
  legalBasis?: string;
  /** Classe CSS adicional no container */
  className?: string;
  /** Usar estilos para fundo escuro (ex.: formulário /novo) */
  dark?: boolean;
}

export function LegalExplanationPanel({
  variant = 'custom',
  title: titleProp,
  explanation: explanationProp,
  legalBasis: legalBasisProp,
  className = '',
  dark = false,
}: LegalExplanationPanelProps) {
  const content = variant !== 'custom' ? VARIANT_CONTENT[variant] : null;
  const title = content ? content.title : titleProp;
  const explanation = content ? content.explanation : explanationProp;
  const legalBasis = content ? content.legalBasis : legalBasisProp;

  if (!title && !explanation && !legalBasis) return null;

  const containerClass = dark
    ? `rounded-lg border border-slate-600 bg-slate-800/60 p-4 ${className}`
    : `rounded-lg border border-slate-200 bg-slate-50 p-4 ${className}`;
  const titleClass = dark ? 'text-sm font-bold text-slate-100 mb-1' : 'text-sm font-bold text-slate-800 mb-1';
  const explanationClass = dark ? 'text-sm text-slate-300 leading-relaxed' : 'text-sm text-slate-700 leading-relaxed';
  const legalClass = dark
    ? 'text-xs font-semibold text-emerald-400 mt-2 pt-2 border-t border-slate-600'
    : 'text-xs font-semibold text-emerald-700 mt-2 pt-2 border-t border-slate-200';
  const iconBgClass = dark ? 'bg-emerald-500/20' : 'bg-emerald-100';
  const iconColorClass = dark ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className={containerClass} role="region" aria-label="Explicação legal">
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${iconBgClass} flex items-center justify-center`} aria-hidden>
          <svg className={`w-4 h-4 ${iconColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {title && <p className={titleClass}>{title}</p>}
          {explanation && <p className={explanationClass}>{explanation}</p>}
          {legalBasis && <p className={legalClass}>Base legal: {legalBasis}</p>}
        </div>
      </div>
    </div>
  );
}
