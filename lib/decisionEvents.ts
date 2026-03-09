/**
 * Tipos padronizados de eventos de decisão usados no sistema LicitaIA.
 */

export type DecisionEventType =
  | "DFD_CREATED"
  | "ETP_CREATED"
  | "ETP_SKIPPED"
  | "TR_CREATED"
  | "PNCP_CREATED"
  | "DISPENSA_VALIDATED"
  | "PESQUISA_PRECOS_VALIDATED"
  | "OUTLIER_REMOVED"
  | "PROCESS_FINALIZED";

export const ALL_DECISION_EVENTS: DecisionEventType[] = [
  "DFD_CREATED",
  "ETP_CREATED",
  "ETP_SKIPPED",
  "TR_CREATED",
  "PNCP_CREATED",
  "DISPENSA_VALIDATED",
  "PESQUISA_PRECOS_VALIDATED",
  "OUTLIER_REMOVED",
  "PROCESS_FINALIZED"
];