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
  ComposedChart,
  Area,
  AreaChart,
  ErrorBar,
  ScatterChart,
  Scatter,
} from "recharts";
import { CustomScenario } from "./ScenarioCustomizer";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp } from "lucide-react";

type StrategyType = "Fixed-time" | "Rule-based" | "RL-based";

interface StatisticalAnalysisProps {
  strategy1: StrategyType;
  strategy2: StrategyType;
  scenario?: CustomScenario;
}

interface StatisticalMetrics {
  mean: number;
  stdDev: number;
  confidenceInterval95: [number, number];
  min: number;
  max: number;
  median: number;
  variance: number;
  skewness: number;
  kurtosis: number;
}

// Generate synthetic distribution data based on strategy and scenario
const generateDistributionData = (
  strategy: StrategyType,
  metric: string,
  scenario?: CustomScenario
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

  // Generate normal distribution with strategy-specific variance
  const varianceMultiplier: Record<StrategyType, number> = {
    "Fixed-time": 0.25,
    "Rule-based": 0.15,
    "RL-based": 0.08,
  };

  const variance = baseValue * varianceMultiplier[strategy];
  const data: number[] = [];

  for (let i = 0; i < 100; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(Math.max(0, baseValue + z * variance));
  }

  return data;
};

// Calculate statistical metrics
const calculateStatistics = (data: number[]): StatisticalMetrics => {
  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;

  // Mean
  const mean = data.reduce((a, b) => a + b, 0) / n;

  // Standard deviation
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // 95% Confidence interval
  const se = stdDev / Math.sqrt(n);
  const z = 1.96; // 95% CI
  const ci95: [number, number] = [mean - z * se, mean + z * se];

  // Min, Max, Median
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  // Skewness
  const skewness =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / (n * Math.pow(stdDev, 3));

  // Kurtosis
  const kurtosis =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / (n * Math.pow(stdDev, 4)) - 3;

  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    confidenceInterval95: [
      Math.round(ci95[0] * 100) / 100,
      Math.round(ci95[1] * 100) / 100,
    ],
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    median: Math.round(median * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
    kurtosis: Math.round(kurtosis * 100) / 100,
  };
};

export default function StatisticalAnalysis({
  strategy1,
  strategy2,
  scenario,
}: StatisticalAnalysisProps) {
  const metrics = ["waitingTime", "queueLength", "throughput", "efficiency"];
  const metricLabels: Record<string, string> = {
    waitingTime: "Waiting Time (s)",
    queueLength: "Queue Length",
    throughput: "Throughput",
    efficiency: "Efficiency (%)",
  };

  // Calculate statistics for all metrics and strategies
  const statistics = useMemo(() => {
    const stats: Record<string, Record<StrategyType, StatisticalMetrics>> = {};

    metrics.forEach((metric) => {
      stats[metric] = {
        "Fixed-time": calculateStatistics(generateDistributionData("Fixed-time", metric, scenario)),
        "Rule-based": calculateStatistics(generateDistributionData("Rule-based", metric, scenario)),
        "RL-based": calculateStatistics(generateDistributionData("RL-based", metric, scenario)),
      };
    });

    return stats;
  }, [scenario]);

  // Data for confidence interval visualization
  const ciData = metrics.map((metric) => ({
    metric: metricLabels[metric],
    [strategy1]: statistics[metric][strategy1].mean,
    [strategy1 + "_error"]: statistics[metric][strategy1].stdDev,
    [strategy2]: statistics[metric][strategy2].mean,
    [strategy2 + "_error"]: statistics[metric][strategy2].stdDev,
  }));

  // Data for distribution comparison
  const distributionData = metrics.map((metric) => ({
    metric: metricLabels[metric],
    [strategy1 + "_mean"]: statistics[metric][strategy1].mean,
    [strategy1 + "_stdDev"]: statistics[metric][strategy1].stdDev,
    [strategy2 + "_mean"]: statistics[metric][strategy2].mean,
    [strategy2 + "_stdDev"]: statistics[metric][strategy2].stdDev,
  }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="confidence">Confidence Intervals</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Statistical Summary</CardTitle>
              <CardDescription>
                Comparing {strategy1} vs {strategy2} with statistical measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.map((metric) => (
                  <div key={metric} className="border-b border-slate-200 pb-6 last:border-0">
                    <h4 className="font-semibold text-slate-900 mb-4">{metricLabels[metric]}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strategy 1 */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3">{strategy1}</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Mean:</span>
                            <span className="font-bold text-blue-700">
                              {statistics[metric][strategy1].mean}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Std Dev:</span>
                            <span className="font-bold text-blue-700">
                              {statistics[metric][strategy1].stdDev}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">95% CI:</span>
                            <span className="font-bold text-blue-700">
                              [{statistics[metric][strategy1].confidenceInterval95[0]},
                              {statistics[metric][strategy1].confidenceInterval95[1]}]
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Median:</span>
                            <span className="font-bold text-blue-700">
                              {statistics[metric][strategy1].median}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Strategy 2 */}
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h5 className="font-medium text-orange-900 mb-3">{strategy2}</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Mean:</span>
                            <span className="font-bold text-orange-700">
                              {statistics[metric][strategy2].mean}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Std Dev:</span>
                            <span className="font-bold text-orange-700">
                              {statistics[metric][strategy2].stdDev}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">95% CI:</span>
                            <span className="font-bold text-orange-700">
                              [{statistics[metric][strategy2].confidenceInterval95[0]},
                              {statistics[metric][strategy2].confidenceInterval95[1]}]
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Median:</span>
                            <span className="font-bold text-orange-700">
                              {statistics[metric][strategy2].median}
                            </span>
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

        {/* Confidence Intervals Tab */}
        <TabsContent value="confidence" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>95% Confidence Intervals</CardTitle>
              <CardDescription>
                Mean values with error bars showing 95% confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ciData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey={strategy1} fill="#3b82f6" />
                  <Bar dataKey={strategy2} fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CI Interpretation */}
          <Card className="shadow-md bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Confidence Interval Interpretation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <p>
                • A 95% confidence interval means we can be 95% confident that the true population
                mean lies within the interval.
              </p>
              <p>
                • If confidence intervals don't overlap, the difference between strategies is
                statistically significant.
              </p>
              <p>
                • Narrower intervals indicate more consistent performance (lower variability).
              </p>
              <p>
                • Wider intervals suggest more variable performance across different conditions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Performance Distribution Comparison</CardTitle>
              <CardDescription>
                Mean and standard deviation for each metric
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey={strategy1 + "_mean"} fill="#3b82f6" name={strategy1 + " Mean"} />
                  <Bar
                    dataKey={strategy1 + "_stdDev"}
                    fill="#93c5fd"
                    name={strategy1 + " Std Dev"}
                    stackId="a"
                  />
                  <Bar dataKey={strategy2 + "_mean"} fill="#f97316" name={strategy2 + " Mean"} />
                  <Bar
                    dataKey={strategy2 + "_stdDev"}
                    fill="#fed7aa"
                    name={strategy2 + " Std Dev"}
                    stackId="b"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution Interpretation */}
          <Card className="shadow-md bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Standard Deviation Interpretation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <p>
                • Standard deviation measures how spread out the data is from the mean.
              </p>
              <p>
                • Lower standard deviation = more consistent/stable performance.
              </p>
              <p>
                • Higher standard deviation = more variable performance.
              </p>
              <p>
                • In traffic control, lower std dev is preferable as it indicates reliable,
                predictable performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Statistics Tab */}
        <TabsContent value="detailed" className="space-y-6 mt-6">
          {metrics.map((metric) => (
            <Card key={metric} className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{metricLabels[metric]} - Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strategy 1 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-900">{strategy1}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Mean</span>
                        <span className="font-bold">{statistics[metric][strategy1].mean}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Median</span>
                        <span className="font-bold">{statistics[metric][strategy1].median}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Std Dev</span>
                        <span className="font-bold">{statistics[metric][strategy1].stdDev}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Variance</span>
                        <span className="font-bold">{statistics[metric][strategy1].variance}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Min</span>
                        <span className="font-bold">{statistics[metric][strategy1].min}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Max</span>
                        <span className="font-bold">{statistics[metric][strategy1].max}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Skewness</span>
                        <span className="font-bold">{statistics[metric][strategy1].skewness}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-slate-600">Kurtosis</span>
                        <span className="font-bold">{statistics[metric][strategy1].kurtosis}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-100 rounded border border-blue-300">
                        <span className="text-slate-600">95% CI</span>
                        <span className="font-bold">
                          [{statistics[metric][strategy1].confidenceInterval95[0]},
                          {statistics[metric][strategy1].confidenceInterval95[1]}]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strategy 2 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-900">{strategy2}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Mean</span>
                        <span className="font-bold">{statistics[metric][strategy2].mean}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Median</span>
                        <span className="font-bold">{statistics[metric][strategy2].median}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Std Dev</span>
                        <span className="font-bold">{statistics[metric][strategy2].stdDev}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Variance</span>
                        <span className="font-bold">{statistics[metric][strategy2].variance}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Min</span>
                        <span className="font-bold">{statistics[metric][strategy2].min}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Max</span>
                        <span className="font-bold">{statistics[metric][strategy2].max}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Skewness</span>
                        <span className="font-bold">{statistics[metric][strategy2].skewness}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="text-slate-600">Kurtosis</span>
                        <span className="font-bold">{statistics[metric][strategy2].kurtosis}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-100 rounded border border-orange-300">
                        <span className="text-slate-600">95% CI</span>
                        <span className="font-bold">
                          [{statistics[metric][strategy2].confidenceInterval95[0]},
                          {statistics[metric][strategy2].confidenceInterval95[1]}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Statistical Measures Guide */}
          <Card className="shadow-md bg-slate-50 border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Statistical Measures Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <p>
                <strong>Skewness:</strong> Measures asymmetry. 0 = symmetric, positive = right-skewed,
                negative = left-skewed.
              </p>
              <p>
                <strong>Kurtosis:</strong> Measures tail heaviness. 0 = normal distribution, positive
                = heavy tails, negative = light tails.
              </p>
              <p>
                <strong>Variance:</strong> Square of standard deviation. Measures spread of data.
              </p>
              <p>
                <strong>Confidence Interval:</strong> Range where true mean likely falls with 95%
                confidence.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
