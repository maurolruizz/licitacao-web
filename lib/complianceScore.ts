import { generateComplianceReport } from "./complianceReport";

export type ComplianceScoreResult = {
  processId: string;
  score: number;
  maxScore: number;
  details: string[];
};

const EVENT_SCORES: Record<string, { points: number; description: string }> = {
  DFD_CREATED: { points: 20, description: "Documento de Formalização da Demanda (DFD) criado" },
  ETP_CREATED: { points: 20, description: "Estudo Técnico Preliminar (ETP) criado" },
  TR_CREATED: { points: 20, description: "Termo de Referência (TR) criado" },
  PNCP_CREATED: { points: 20, description: "Publicação no PNCP realizada" },
  DISPENSA_VALIDATED: { points: 20, description: "Validação de dispensa realizada" },
};

/**
 * Calcula o score de compliance para um processo de licitação.
 * 
 * @param processId ID do processo
 * @returns Objeto ComplianceScoreResult com score e detalhes
 */
export function calculateComplianceScore(processId: string): ComplianceScoreResult {
  const report = generateComplianceReport(processId);
  let score = 0;
  const details: string[] = [];
  const countedEvents = new Set<string>();

  for (const event of report.timeline) {
    if (EVENT_SCORES[event.event] && !countedEvents.has(event.event)) {
      score += EVENT_SCORES[event.event].points;
      details.push(
        `+${EVENT_SCORES[event.event].points}: ${EVENT_SCORES[event.event].description}`
      );
      countedEvents.add(event.event);
    }
  }

  return {
    processId: report.processId,
    score,
    maxScore: 100,
    details,
  };
}