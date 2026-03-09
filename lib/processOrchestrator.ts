import { canTransition } from "./processStageControl";
import { logDecision } from "./decisionLog";
import { guardDispensa } from "./complianceGuard";
import type { DecisionEventType } from "./decisionEvents";

/**
 * Representa o estado de um processo de licitação.
 */
export type ProcessState = {
  processId: string;
  stage: "DFD" | "ETP" | "TR" | "PNCP" | "FINAL";
};

/**
 * Avança o estágio do processo, registrando o evento se permitido.
 * @param state Estado atual do processo
 * @param targetStage Próximo estágio desejado
 * @param user Usuário responsável pela transição (opcional)
 * @returns Novo estado se transição permitida, senão null
 */
export function advanceStage(
  state: ProcessState,
  targetStage: "DFD" | "ETP" | "TR" | "PNCP" | "FINAL",
  user?: string
): ProcessState | null {
  if (!canTransition(state.stage, targetStage)) {
    return null;
  }

  // Mapeamento do estágio para o tipo de evento correspondente
  const stageEventMap: Record<ProcessState["stage"], DecisionEventType> = {
    "DFD": "DFD_CREATED",
    "ETP": "ETP_CREATED",
    "TR": "TR_CREATED",
    "PNCP": "PNCP_CREATED",
    "FINAL": "PROCESS_FINALIZED",
  };

  // Determinar qual evento logar para o novo estágio
  const event = stageEventMap[targetStage];

  logDecision({
    processId: state.processId,
    event,
    timestamp: Date.now(),
    user,
  });

  return {
    ...state,
    stage: targetStage,
  };
}

/**
 * Tenta aplicar a dispensa de licitação, disparando validação de compliance.
 * @param processId ID do processo
 * @param valorEstimado Valor estimado para dispensa
 * @param user Usuário responsável pela ação (opcional)
 * @returns Resultado da guarda de compliance
 */
export function tryDispensa(
  processId: string,
  valorEstimado: number,
  user?: string
): { allowed: true } | { allowed: false; reason: string } {
  return guardDispensa(processId, valorEstimado, user);
}