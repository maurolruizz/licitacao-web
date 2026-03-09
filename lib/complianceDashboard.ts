import { calculateComplianceScore, ComplianceScoreResult } from "./complianceScore";

export type ComplianceDashboard = {
  totalProcesses: number;
  averageScore: number;
  criticalProcesses: number;
  scores: ComplianceScoreResult[];
};

/**
 * Gera um painel agregando scores de compliance para múltiplos processos.
 * 
 * @param processIds Array de IDs de processos a serem avaliados
 * @returns Objeto ComplianceDashboard com agregação dos resultados
 */
export function generateComplianceDashboard(processIds: string[]): ComplianceDashboard {
  const scores: ComplianceScoreResult[] = processIds.map(pid => calculateComplianceScore(pid));
  const totalProcesses = scores.length;
  const totalScore = scores.reduce((sum, result) => sum + result.score, 0);
  const averageScore = totalProcesses > 0 ? totalScore / totalProcesses : 0;
  const criticalProcesses = scores.filter(r => r.score < 60).length;

  return {
    totalProcesses,
    averageScore,
    criticalProcesses,
    scores,
  };
}