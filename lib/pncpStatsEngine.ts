/**
 * Motor de análise estatística para pesquisa de preços PNCP (IN 65/2021).
 * Cálculos client-side: média, mediana, desvio padrão, CV, detecção de outliers (IQR).
 */

export interface StatsResult {
  mean: number;
  median: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  count: number;
  valid: boolean;
}

export interface IQROutlierResult {
  valuesWithoutOutliers: number[];
  outliers: number[];
  outlierIndices: number[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

export interface FullAnalysisResult {
  raw: StatsResult;
  cvCompliance: boolean;
  cvAlertMessage: string | null;
  iqr: IQROutlierResult | null;
  afterOutlierRemoval: StatsResult | null;
  referencePrice: number;
  hadOutliers: boolean;
}

/**
 * Média aritmética.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Mediana (valor central da amostra ordenada).
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Desvio padrão amostral (n-1).
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((acc, v) => acc + (v - m) ** 2, 0);
  const variance = sumSq / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Coeficiente de variação (CV) em percentual.
 * CV = (desvio padrão / média) * 100
 */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  if (m === 0) return 0;
  const sd = standardDeviation(values);
  return (sd / m) * 100;
}

/**
 * Calcula estatísticas resumidas para um conjunto de valores.
 */
export function computeStats(values: number[]): StatsResult {
  const n = values.length;
  const valid = n >= 3;
  return {
    mean: mean(values),
    median: median(values),
    standardDeviation: standardDeviation(values),
    coefficientOfVariation: coefficientOfVariation(values),
    count: n,
    valid,
  };
}

/**
 * Detecta outliers pelo método IQR (Interquartile Range).
 * Outlier: valor < Q1 - 1.5*IQR ou valor > Q3 + 1.5*IQR
 */
export function detectOutliersIQR(values: number[]): IQROutlierResult | null {
  if (values.length < 4) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices: number[] = [];
  const outliers: number[] = [];
  const valuesWithoutOutliers: number[] = [];

  values.forEach((v, i) => {
    if (v < lowerBound || v > upperBound) {
      outlierIndices.push(i);
      outliers.push(v);
    } else {
      valuesWithoutOutliers.push(v);
    }
  });

  if (outliers.length === 0) return null;

  return {
    valuesWithoutOutliers,
    outliers,
    outlierIndices,
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
  };
}

/**
 * Análise completa: estatísticas brutas, verificação CV (IN 65/2021),
 * detecção de outliers IQR e preço de referência após expurgo.
 */
export function runFullAnalysis(values: number[]): FullAnalysisResult {
  const raw = computeStats(values);
  const cvCompliance = raw.coefficientOfVariation <= 25;
  const cvAlertMessage =
    !cvCompliance && raw.count >= 3
      ? 'Os preços coletados são muito diferentes entre si. Recomenda-se remover valores extremos para obter um preço de referência mais confiável.'
      : null;

  const iqr = detectOutliersIQR(values);
  let afterOutlierRemoval: StatsResult | null = null;
  let referencePrice = raw.mean;
  const hadOutliers = iqr !== null && iqr.outliers.length > 0;

  if (hadOutliers && iqr && iqr.valuesWithoutOutliers.length >= 3) {
    afterOutlierRemoval = computeStats(iqr.valuesWithoutOutliers);
    referencePrice = afterOutlierRemoval.mean;
  }

  return {
    raw,
    cvCompliance,
    cvAlertMessage,
    iqr,
    afterOutlierRemoval,
    referencePrice,
    hadOutliers,
  };
}
