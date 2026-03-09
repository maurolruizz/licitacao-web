import { generateComplianceReport } from "./complianceReport";
import { formatComplianceReport } from "./complianceReportFormatter";

/**
 * Prepara o texto formatado de um relatório de compliance para geração futura de um arquivo DOCX.
 *
 * @param processId ID do processo a gerar o relatório
 * @returns Texto formatado do relatório de compliance (para posterior exportação como DOCX)
 */
export function generateComplianceReportDocx(processId: string): string {
  const report = generateComplianceReport(processId);
  const formatted = formatComplianceReport(report);
  // No momento retornamos apenas o texto, DOCX será implementado depois
  return formatted;
}