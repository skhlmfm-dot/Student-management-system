/**
 * Advanced Statistical Analysis Module
 * Provides comprehensive statistical analysis for traffic control strategies
 */

export interface StrategyMetrics {
  strategy: string;
  waitingTimes: number[];
  queueLengths: number[];
  rewards: number[];
  throughputs: number[];
}

export interface StatisticalResult {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface ConfidenceInterval {
  mean: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  marginOfError: number;
}

export interface HypothesisTestResult {
  testName: string;
  testStatistic: number;
  pValue: number;
  isSignificant: boolean;
  conclusion: string;
  confidenceLevel: number;
}

export interface CorrelationMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

/**
 * Calculate basic statistics for a dataset
 */
export function calculateBasicStats(data: number[]): StatisticalResult {
  if (data.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;

  // Mean
  const mean = data.reduce((a, b) => a + b, 0) / n;

  // Median
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  // Variance and Standard Deviation
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Min and Max
  const min = sorted[0];
  const max = sorted[n - 1];

  // Quartiles
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;

  // Skewness
  const skewness =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) /
    (n * Math.pow(stdDev, 3));

  // Kurtosis
  const kurtosis =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) /
      (n * Math.pow(stdDev, 4)) -
    3;

  return {
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    q1,
    q3,
    iqr,
    skewness,
    kurtosis,
  };
}

/**
 * Calculate percentile value
 */
function calculatePercentile(sortedData: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedData[lower];
  }

  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

/**
 * Calculate 95% Confidence Interval
 */
export function calculateConfidenceInterval(
  data: number[],
  confidenceLevel: number = 0.95
): ConfidenceInterval {
  const stats = calculateBasicStats(data);
  const n = data.length;
  const se = stats.stdDev / Math.sqrt(n);

  // Z-score for 95% confidence (1.96)
  const zScore = getZScore(confidenceLevel);
  const marginOfError = zScore * se;

  return {
    mean: stats.mean,
    lowerBound: stats.mean - marginOfError,
    upperBound: stats.mean + marginOfError,
    confidenceLevel,
    marginOfError,
  };
}

/**
 * Get Z-score for confidence level
 */
function getZScore(confidenceLevel: number): number {
  const zScores: { [key: number]: number } = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return zScores[confidenceLevel] || 1.96;
}

/**
 * Independent T-Test (comparing two strategies)
 */
export function independentTTest(
  data1: number[],
  data2: number[],
  confidenceLevel: number = 0.95
): HypothesisTestResult {
  const stats1 = calculateBasicStats(data1);
  const stats2 = calculateBasicStats(data2);

  const n1 = data1.length;
  const n2 = data2.length;

  // Pooled standard error
  const se = Math.sqrt(
    (stats1.variance / n1 + stats2.variance / n2)
  );

  // T-statistic
  const tStatistic = (stats1.mean - stats2.mean) / se;

  // Degrees of freedom (Welch's approximation)
  const df =
    Math.pow(stats1.variance / n1 + stats2.variance / n2, 2) /
    (Math.pow(stats1.variance / n1, 2) / (n1 - 1) +
      Math.pow(stats2.variance / n2, 2) / (n2 - 1));

  // P-value (two-tailed)
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

  const isSignificant = pValue < 1 - confidenceLevel;

  return {
    testName: "Independent T-Test",
    testStatistic: tStatistic,
    pValue,
    isSignificant,
    conclusion: isSignificant
      ? "The difference between strategies is statistically significant"
      : "No significant difference between strategies",
    confidenceLevel,
  };
}

/**
 * ANOVA Test (comparing multiple strategies)
 */
export function anovaTest(
  groups: number[][],
  confidenceLevel: number = 0.95
): HypothesisTestResult {
  const groupStats = groups.map(calculateBasicStats);
  const k = groups.length;
  const N = groups.reduce((sum, g) => sum + g.length, 0);

  // Grand mean
  const grandMean =
    groups.reduce((sum, g) => sum + g.reduce((a, b) => a + b, 0), 0) / N;

  // Between-group sum of squares
  let ssb = 0;
  groups.forEach((group, i) => {
    const groupMean = groupStats[i].mean;
    ssb += group.length * Math.pow(groupMean - grandMean, 2);
  });

  // Within-group sum of squares
  let ssw = 0;
  groups.forEach((group, i) => {
    const groupMean = groupStats[i].mean;
    group.forEach((value) => {
      ssw += Math.pow(value - groupMean, 2);
    });
  });

  // Mean squares
  const msb = ssb / (k - 1);
  const msw = ssw / (N - k);

  // F-statistic
  const fStatistic = msb / msw;

  // P-value (approximation)
  const pValue = 1 - fCDF(fStatistic, k - 1, N - k);

  const isSignificant = pValue < 1 - confidenceLevel;

  return {
    testName: "ANOVA Test",
    testStatistic: fStatistic,
    pValue,
    isSignificant,
    conclusion: isSignificant
      ? "Significant differences exist between strategies"
      : "No significant differences between strategies",
    confidenceLevel,
  };
}

/**
 * Chi-Square Test for independence
 */
export function chiSquareTest(
  observed: number[][],
  confidenceLevel: number = 0.95
): HypothesisTestResult {
  // Calculate expected frequencies
  const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = observed[0].map((_, i) =>
    observed.reduce((sum, row) => sum + row[i], 0)
  );
  const total = rowTotals.reduce((a, b) => a + b, 0);

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[i].length; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / total;
      chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
    }
  }

  const df = (observed.length - 1) * (observed[0].length - 1);
  const pValue = 1 - chiSquareCDF(chiSquare, df);

  const isSignificant = pValue < 1 - confidenceLevel;

  return {
    testName: "Chi-Square Test",
    testStatistic: chiSquare,
    pValue,
    isSignificant,
    conclusion: isSignificant
      ? "Significant association exists"
      : "No significant association",
    confidenceLevel,
  };
}

/**
 * Calculate Pearson Correlation Coefficient
 */
export function pearsonCorrelation(data1: number[], data2: number[]): number {
  const n = Math.min(data1.length, data2.length);
  const mean1 = data1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = data2.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += Math.pow(diff1, 2);
    denominator2 += Math.pow(diff2, 2);
  }

  return numerator / Math.sqrt(denominator1 * denominator2);
}

/**
 * Calculate correlation matrix for multiple variables
 */
export function calculateCorrelationMatrix(
  metrics: StrategyMetrics
): CorrelationMatrix {
  const correlations: CorrelationMatrix = {};

  const datasets = {
    waitingTimes: metrics.waitingTimes,
    queueLengths: metrics.queueLengths,
    rewards: metrics.rewards,
    throughputs: metrics.throughputs,
  };

  const keys = Object.keys(datasets);

  for (let i = 0; i < keys.length; i++) {
    correlations[keys[i]] = {};
    for (let j = 0; j < keys.length; j++) {
      if (i === j) {
        correlations[keys[i]][keys[j]] = 1;
      } else {
        correlations[keys[i]][keys[j]] = pearsonCorrelation(
          datasets[keys[i] as keyof typeof datasets],
          datasets[keys[j] as keyof typeof datasets]
        );
      }
    }
  }

  return correlations;
}

/**
 * Approximate t-distribution CDF
 */
function tCDF(t: number, df: number): number {
  // Approximation using incomplete beta function
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5) / 2;
}

/**
 * Approximate F-distribution CDF
 */
function fCDF(f: number, df1: number, df2: number): number {
  const x = (df1 * f) / (df1 * f + df2);
  return incompleteBeta(x, df1 / 2, df2 / 2);
}

/**
 * Approximate Chi-Square CDF
 */
function chiSquareCDF(x: number, df: number): number {
  return incompleteBeta(x / 2, df / 2, 0.5);
}

/**
 * Incomplete Beta Function (approximation)
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return x < 0 ? 0 : 1;

  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x));

  let f = 1,
    c = 1,
    d = 0;
  let i = 0;

  while (Math.abs(f - d) > 1e-10 && i < 100) {
    d = f;
    const m = i / 2;
    let numerator = (m * (b - m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    f = 1 + numerator / f;
    numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m + 1) * (a + 2 * m + 2));
    f = 1 + numerator / f;
    i++;
  }

  return front / a / f;
}

/**
 * Generate summary report
 */
export function generateStatisticalSummary(metrics: StrategyMetrics) {
  const waitingTimeStats = calculateBasicStats(metrics.waitingTimes);
  const queueLengthStats = calculateBasicStats(metrics.queueLengths);
  const rewardStats = calculateBasicStats(metrics.rewards);
  const throughputStats = calculateBasicStats(metrics.throughputs);

  const waitingTimeCI = calculateConfidenceInterval(metrics.waitingTimes);
  const queueLengthCI = calculateConfidenceInterval(metrics.queueLengths);
  const rewardCI = calculateConfidenceInterval(metrics.rewards);
  const throughputCI = calculateConfidenceInterval(metrics.throughputs);

  return {
    strategy: metrics.strategy,
    waitingTime: {
      stats: waitingTimeStats,
      confidenceInterval: waitingTimeCI,
    },
    queueLength: {
      stats: queueLengthStats,
      confidenceInterval: queueLengthCI,
    },
    reward: {
      stats: rewardStats,
      confidenceInterval: rewardCI,
    },
    throughput: {
      stats: throughputStats,
      confidenceInterval: throughputCI,
    },
  };
}
