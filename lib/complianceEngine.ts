import { LIMITES_LEGAIS } from "./legalConstants";
// complianceEngine.ts

export type ComplianceResult = {
  valid: boolean;
  message?: string;
  baseLegal?: string;
};

/**
 * Valida se o valor estimado está dentro do limite legal para dispensa de licitação
 * conforme a Lei 14.133/2021, art. 75, incisos I e II.
 * Limite comum (2024): R$ 50.000,00 para obras/serviços de engenharia, R$ 100.000,00 para outros.
 * Para simplificação, utiliza o maior valor (R$ 100.000,00). Ajuste conforme sua regra.
 */
export function validateDispensa(valorEstimado: number): ComplianceResult {
    const LIMITE_DISPENSA = LIMITES_LEGAIS.DISPENSA_BENS_SERVICOS;
  if (typeof valorEstimado !== "number" || isNaN(valorEstimado)) {
    return {
      valid: false,
      message: "Valor estimado inválido.",
      baseLegal: "Lei 14.133/2021, art. 75"
    };
  }

  if (valorEstimado <= 0) {
    return {
      valid: false,
      message: "O valor estimado deve ser maior que zero.",
      baseLegal: "Lei 14.133/2021, art. 75"
    };
  }

  if (valorEstimado > LIMITE_DISPENSA) {
    return {
      valid: false,
      message: `Valor acima do limite para dispensa de licitação (R$ ${LIMITE_DISPENSA.toLocaleString("pt-BR")}).`,
      baseLegal: "Lei 14.133/2021, art. 75, I e II"
    };
  }

  return {
    valid: true,
    message: "Valor dentro do limite para dispensa.",
    baseLegal: "Lei 14.133/2021, art. 75, I e II"
  };
}

/**
 * Valida se ao menos um item foi incluído no processo.
 */
export function validateItens(itens: any[]): ComplianceResult {
  if (!Array.isArray(itens)) {
    return {
      valid: false,
      message: "Itens inválidos: esperado um array.",
    };
  }

  if (itens.length === 0) {
    return {
      valid: false,
      message: "Pelo menos um item deve ser informado no processo.",
    };
  }

  return {
    valid: true,
    message: "Itens informados.",
  };
}

/**
 * Valida o coeficiente de variação (CV) da pesquisa de preços conforme IN 65/2021.
 * O valor aceito geralmente é até 50% (0.5).
 */
export function validateCV(cv: number): ComplianceResult {
    const LIMITE_CV = LIMITES_LEGAIS.LIMITE_CV;
  if (typeof cv !== "number" || isNaN(cv)) {
    return {
      valid: false,
      message: "Coeficiente de variação inválido.",
      baseLegal: "IN 65, art. 5º, II"
    };
  }

  if (cv > LIMITE_CV) {
    return {
      valid: false,
      message: "O coeficiente de variação é superior ao aceitável (50%).",
      baseLegal: "IN 65/2021, art. 5º, II"
    };
  }

  if (cv < 0) {
    return {
      valid: false,
      message: "O coeficiente de variação não pode ser negativo.",
      baseLegal: "IN 65/2021, art. 5º, II"
    };
  }

  return {
    valid: true,
    message: "Coeficiente de variação dentro do aceitável.",
    baseLegal: "IN 65/2021, art. 5º, II"
  };
}