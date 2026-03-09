import { generateAuditTimeline } from "./auditEngine";
import type { AuditTimelineEvent } from "./auditEngine";

export type ComplianceReport = {
  processId: string;
  generatedAt: number;
  timeline: AuditTimelineEvent[];
};

/**
 * Gera um relatório de compliance para o processo especificado.
 *
 * @param processId ID do processo a ser analisado
 * @returns Objeto ComplianceReport com a linha do tempo de auditoria
 */
export function generateComplianceReport(processId: string): ComplianceReport {
  const timeline = generateAuditTimeline(processId);
  const report: ComplianceReport = {
    processId,
    generatedAt: Date.now(),
    timeline,
  };
  return report;
}