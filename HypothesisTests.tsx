import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { CustomScenario } from "./ScenarioCustomizer";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

type StrategyType = "Fixed-time" | "Rule-based" | "RL-based";

interface HypothesisTestsProps {
  scenario?: CustomScenario;
}

interface TTestResult {
  t_statistic: number;
  p_value: number;
  degrees_freedom: number;
  significant: boolean;
  effect_size: number;
  interpretation: string;
}

interface ANOVAResult {
  f_statistic: number;
  p_value: number;
  df_between: number;
  df_within: number;
  significant: boolean;
  interpretation: string;
}

// Generate sample data for each strategy
const generateSampleData = (
  strategy: StrategyType,
  metric: string,
  scenario?: CustomScenario,
  samples: number = 100
): number[] => {
  const baseValues: Record<StrategyType, Record<string, number>> = {
    "Fixed-time": {
      waitingTime: 47.5,
      queueLength: 15.25,
      throughput: 60,
      efficiency: 35,
    },
    "Rule-based": {
      waitingTime: 25.25,
      queueLength: 0.5,
      throughput: 85,
      efficiency: 75,
    },
    "RL-based": {
      waitingTime: 21.5,
      queueLength: 0.2,
      throughput: 95.5,
      efficiency: 95,
    },
  };

  let baseValue = baseValues[strategy][metric] || 50;

  // Apply scenario multiplier
  if (scenario) {
    const avgFlow = (scenario.northFlow + scenario.eastFlow + scenario.southFlow + scenario.westFlow) / 4;
    const flowMultiplier = 0.5 + (avgFlow / 100) * 1.5;
    const incidentMultiplier = scenario.incidentActive ? 1 + scenario.incidentSeverity / 200 : 1;
    const peakMultiplier = scenario.peakHourActive ? 1 + scenario.peakHourIntensity / 200 : 1;

    if (metric === "waitingTime" || metric === "queueLength") {
      baseValue *= flowMultiplier * incidentMultiplier * peakMultiplier;
    } else {
      baseValue /= flowMultiplier * incidentMultiplier * peakMultiplier;
    }
  }

  // Generate normal distribution
  const varianceMultiplier: Record<StrategyType, number> = {
    "Fixed-time": 0.25,
    "Rule-based": 0.15,
    "RL-based": 0.08,
  };

  const variance = baseValue * varianceMultiplier[strategy];
  const data: number[] = [];

  for (let i = 0; i < samples; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(Math.max(0, baseValue + z * variance));
  }

  return data;
};

// Calculate mean
const mean = (data: number[]): number => data.reduce((a, b) => a + b, 0) / data.length;

// Calculate variance
const variance = (data: number[]): number => {
  const m = mean(data);
  return data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (data.length - 1);
};

// Perform independent samples t-test
const performTTest = (sample1: number[], sample2: number[]): TTestResult => {
  const n1 = sample1.length;
  const n2 = sample2.length;
  const m1 = mean(sample1);
  const m2 = mean(sample2);
  const v1 = variance(sample1);
  const v2 = variance(sample2);

  // Pooled standard error
  const se = Math.sqrt((v1 / n1) + (v2 / n2));
  const t_statistic = (m1 - m2) / se;

  // Degrees of freedom (Welch's approximation)
  const df = Math.pow((v1 / n1 + v2 / n2), 2) / (
    Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1)
  );

  // Approximate p-value using t-distribution (simplified)
  // For a two-tailed test
  const p_value = 2 * (1 - tDistributionCDF(Math.abs(t_statistic), df));

  // Cohen's d (effect size)
  const pooled_std = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const effect_size = Math.abs((m1 - m2) / pooled_std);

  const significant = p_value < 0.05;
  const interpretation = significant
    ? `The difference between the two strategies is statistically significant (p < 0.05). Effect size: ${
        effect_size < 0.2 ? "small" : effect_size < 0.5 ? "small to medium" : effect_size < 0.8 ? "medium" : "large"
      }`
    : `The difference between the two strategies is NOT statistically significant (p ≥ 0.05).`;

  return {
    t_statistic: Math.round(t_statistic * 1000) / 1000,
    p_value: Math.round(p_value * 10000) / 10000,
    degrees_freedom: Math.round(df),
    significant,
    effect_size: Math.round(effect_size * 1000) / 1000,
    interpretation,
  };
};

// Perform one-way ANOVA
const performANOVA = (
  sample1: number[],
  sample2: number[],
  sample3: number[]
): ANOVAResult => {
  const samples = [sample1, sample2, sample3];
  const n = sample1.length + sample2.length + sample3.length;
  const k = 3; // number of groups

  // Grand mean
  const allData = [...sample1, ...sample2, ...sample3];
  const grandMean = mean(allData);

  // Between-group sum of squares
  const ss_between = samples.reduce((sum, sample) => {
    const m = mean(sample);
    return sum + sample.length * Math.pow(m - grandMean, 2);
  }, 0);

  // Within-group sum of squares
  const ss_within = samples.reduce((sum, sample) => {
    const m = mean(sample);
    return sum + sample.reduce((s, val) => s + Math.pow(val - m, 2), 0);
  }, 0);

  // Mean squares
  const df_between = k - 1;
  const df_within = n - k;
  const ms_between = ss_between / df_between;
  const ms_within = ss_within / df_within;

  // F-statistic
  const f_statistic = ms_between / ms_within;

  // Approximate p-value
  const p_value = 1 - fDistributionCDF(f_statistic, df_between, df_within);

  const significant = p_value < 0.05;
  const interpretation = significant
    ? `There is a statistically significant difference among the three strategies (p < 0.05).`
    : `There is NO statistically significant difference among the three strategies (p ≥ 0.05).`;

  return {
    f_statistic: Math.round(f_statistic * 1000) / 1000,
    p_value: Math.round(p_value * 10000) / 10000,
    df_between,
    df_within,
    significant,
    interpretation,
  };
};

// Error function for normal distribution
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

// Simplified t-distribution CDF approximation
const tDistributionCDF = (t: number, df: number): number => {
  // Simplified approximation - in production, use a proper statistical library
  const absT = Math.abs(t);
  if (df > 30) {
    // Approximate with normal distribution
    return 0.5 * (1 + erf(absT / Math.sqrt(2)));
  }
  // Very rough approximation for smaller df
  return 0.5 + 0.5 * Math.tanh(absT / Math.sqrt(df + 1));
};

// Simplified F-distribution CDF approximation
const fDistributionCDF = (f: number, df1: number, df2: number): number => {
  // Very simplified approximation
  if (f < 0) return 0;
  if (f === 0) return 0;
  // Rough approximation
  return 1 - Math.exp(-f * df1 / (df1 + df2));
};



export default function HypothesisTests({ scenario }: HypothesisTestsProps) {
  const metrics = ["waitingTime", "queueLength", "throughput", "efficiency"];
  const metricLabels: Record<string, string> = {
    waitingTime: "Waiting Time (s)",
    queueLength: "Queue Length",
    throughput: "Throughput",
    efficiency: "Efficiency (%)",
  };

  // Generate data and perform tests
  const testResults = useMemo(() => {
    const results: Record<string, any> = {};

    metrics.forEach((metric) => {
      // Generate samples
      const fixedData = generateSampleData("Fixed-time", metric, scenario);
      const ruleData = generateSampleData("Rule-based", metric, scenario);
      const rlData = generateSampleData("RL-based", metric, scenario);

      // Perform t-tests
      results[metric] = {
        ttest_fixed_vs_rule: performTTest(fixedData, ruleData),
        ttest_fixed_vs_rl: performTTest(fixedData, rlData),
        ttest_rule_vs_rl: performTTest(ruleData, rlData),
        anova: performANOVA(fixedData, ruleData, rlData),
      };
    });

    return results;
  }, [scenario]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ttest">T-Tests</TabsTrigger>
          <TabsTrigger value="anova">ANOVA</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="shadow-md bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hypothesis Testing Overview
              </CardTitle>
              <CardDescription>Statistical tests to determine if differences are significant</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-3">
              <p>
                <strong>Null Hypothesis (H₀):</strong> There is no significant difference between the
                strategies.
              </p>
              <p>
                <strong>Alternative Hypothesis (H₁):</strong> There is a significant difference
                between the strategies.
              </p>
              <p>
                <strong>Significance Level (α):</strong> 0.05 (5%) - We reject H₀ if p-value &lt;
                0.05
              </p>
              <p>
                <strong>Interpretation:</strong> If p-value &lt; 0.05, the difference is
                statistically significant.
              </p>
            </CardContent>
          </Card>

          {/* Summary of All Tests */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
              <CardDescription>Overview of all hypothesis tests across metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric} className="border-b border-slate-200 pb-4 last:border-0">
                    <h4 className="font-semibold text-slate-900 mb-3">{metricLabels[metric]}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ANOVA Result */}
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-slate-900">One-Way ANOVA</h5>
                          {testResults[metric].anova.significant ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">F-statistic:</span>
                            <span className="font-bold">{testResults[metric].anova.f_statistic}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">p-value:</span>
                            <span className="font-bold">{testResults[metric].anova.p_value}</span>
                          </div>
                          <div className="mt-2">
                            <Badge
                              className={
                                testResults[metric].anova.significant
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }
                            >
                              {testResults[metric].anova.significant
                                ? "Significant"
                                : "Not Significant"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* T-test Results Summary */}
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h5 className="font-medium text-slate-900 mb-2">Pairwise T-Tests</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Fixed vs Rule:</span>
                            <Badge
                              className={
                                testResults[metric].ttest_fixed_vs_rule.significant
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                              }
                            >
                              {testResults[metric].ttest_fixed_vs_rule.significant
                                ? "Sig"
                                : "NS"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Fixed vs RL:</span>
                            <Badge
                              className={
                                testResults[metric].ttest_fixed_vs_rl.significant
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                              }
                            >
                              {testResults[metric].ttest_fixed_vs_rl.significant
                                ? "Sig"
                                : "NS"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Rule vs RL:</span>
                            <Badge
                              className={
                                testResults[metric].ttest_rule_vs_rl.significant
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                              }
                            >
                              {testResults[metric].ttest_rule_vs_rl.significant
                                ? "Sig"
                                : "NS"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* T-Tests Tab */}
        <TabsContent value="ttest" className="space-y-6 mt-6">
          {metrics.map((metric) => (
            <Card key={metric} className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{metricLabels[metric]} - Independent Samples T-Tests</CardTitle>
                <CardDescription>
                  Comparing pairs of strategies to determine if differences are significant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Fixed vs Rule */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-3">Fixed-time vs Rule-based</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">t-statistic:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rule.t_statistic}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">p-value:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rule.p_value}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">df:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rule.degrees_freedom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Effect Size:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rule.effect_size}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <Badge
                          className={
                            testResults[metric].ttest_fixed_vs_rule.significant
                              ? "bg-green-600"
                              : "bg-red-600"
                          }
                        >
                          {testResults[metric].ttest_fixed_vs_rule.significant
                            ? "Significant"
                            : "Not Significant"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {testResults[metric].ttest_fixed_vs_rule.interpretation}
                      </p>
                    </div>
                  </div>

                  {/* Fixed vs RL */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-900 mb-3">Fixed-time vs RL-based</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">t-statistic:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rl.t_statistic}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">p-value:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rl.p_value}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">df:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rl.degrees_freedom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Effect Size:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_fixed_vs_rl.effect_size}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-300">
                        <Badge
                          className={
                            testResults[metric].ttest_fixed_vs_rl.significant
                              ? "bg-green-600"
                              : "bg-red-600"
                          }
                        >
                          {testResults[metric].ttest_fixed_vs_rl.significant
                            ? "Significant"
                            : "Not Significant"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {testResults[metric].ttest_fixed_vs_rl.interpretation}
                      </p>
                    </div>
                  </div>

                  {/* Rule vs RL */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h5 className="font-semibold text-orange-900 mb-3">Rule-based vs RL-based</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">t-statistic:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_rule_vs_rl.t_statistic}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">p-value:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_rule_vs_rl.p_value}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">df:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_rule_vs_rl.degrees_freedom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Effect Size:</span>
                        <span className="font-bold">
                          {testResults[metric].ttest_rule_vs_rl.effect_size}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-orange-300">
                        <Badge
                          className={
                            testResults[metric].ttest_rule_vs_rl.significant
                              ? "bg-green-600"
                              : "bg-red-600"
                          }
                        >
                          {testResults[metric].ttest_rule_vs_rl.significant
                            ? "Significant"
                            : "Not Significant"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {testResults[metric].ttest_rule_vs_rl.interpretation}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* T-Test Guide */}
          <Card className="shadow-md bg-slate-50 border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">T-Test Interpretation Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <p>
                <strong>t-statistic:</strong> Measures how many standard errors the difference between
                means is. Larger absolute values indicate bigger differences.
              </p>
              <p>
                <strong>p-value:</strong> Probability of observing this difference by chance. If p
                &lt; 0.05, the difference is statistically significant.
              </p>
              <p>
                <strong>Effect Size (Cohen's d):</strong> Magnitude of the difference. 0.2 = small,
                0.5 = medium, 0.8 = large.
              </p>
              <p>
                <strong>Degrees of Freedom:</strong> Sample size parameter affecting the distribution
                of the test statistic.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANOVA Tab */}
        <TabsContent value="anova" className="space-y-6 mt-6">
          {metrics.map((metric) => (
            <Card key={metric} className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{metricLabels[metric]} - One-Way ANOVA</CardTitle>
                <CardDescription>
                  Testing if there are significant differences among all three strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ANOVA Results */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-300">
                    <h5 className="font-semibold text-blue-900 mb-4">ANOVA Results</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-white rounded border border-blue-200">
                        <span className="text-slate-600">F-statistic:</span>
                        <span className="font-bold text-blue-700">
                          {testResults[metric].anova.f_statistic}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-white rounded border border-blue-200">
                        <span className="text-slate-600">p-value:</span>
                        <span className="font-bold text-blue-700">
                          {testResults[metric].anova.p_value}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-white rounded border border-blue-200">
                        <span className="text-slate-600">df (between):</span>
                        <span className="font-bold text-blue-700">
                          {testResults[metric].anova.df_between}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-white rounded border border-blue-200">
                        <span className="text-slate-600">df (within):</span>
                        <span className="font-bold text-blue-700">
                          {testResults[metric].anova.df_within}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-300">
                        <Badge
                          className={
                            testResults[metric].anova.significant
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }
                        >
                          {testResults[metric].anova.significant
                            ? "Significant (p < 0.05)"
                            : "Not Significant (p ≥ 0.05)"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-300">
                    <h5 className="font-semibold text-purple-900 mb-4">Interpretation</h5>
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded border border-purple-200">
                        <p className="text-sm text-slate-700">
                          {testResults[metric].anova.interpretation}
                        </p>
                      </div>
                      {testResults[metric].anova.significant && (
                        <div className="p-4 bg-green-50 rounded border border-green-300">
                          <p className="text-sm text-green-900">
                            <strong>Next Step:</strong> Perform post-hoc tests (e.g., Tukey HSD) to
                            identify which pairs differ significantly.
                          </p>
                        </div>
                      )}
                      <div className="p-4 bg-slate-100 rounded border border-slate-300">
                        <p className="text-xs text-slate-700">
                          <strong>Note:</strong> ANOVA assumes equal variances across groups. If this
                          assumption is violated, consider using Kruskal-Wallis test instead.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* ANOVA Guide */}
          <Card className="shadow-md bg-slate-50 border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">ANOVA Interpretation Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <p>
                <strong>F-statistic:</strong> Ratio of between-group variance to within-group
                variance. Larger values indicate greater differences among groups.
              </p>
              <p>
                <strong>p-value:</strong> If p &lt; 0.05, at least one group mean differs
                significantly from the others.
              </p>
              <p>
                <strong>Null Hypothesis:</strong> All three strategy means are equal.
              </p>
              <p>
                <strong>Assumptions:</strong> Normality, homogeneity of variance, independence of
                observations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
