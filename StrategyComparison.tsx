import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from "recharts";

// Strategy data with comprehensive metrics
const strategyData = [
  {
    name: "Fixed-time",
    reward: -1855.8,
    waitingTime: 47.50,
    queueLength: 15.25,
    throughput: 60,
    congestionEvents: 8,
    efficiency: 35,
    adaptability: 10,
    color: "#3b82f6",
  },
  {
    name: "Rule-based",
    reward: -313.0,
    waitingTime: 25.25,
    queueLength: 0.00,
    throughput: 85,
    congestionEvents: 2,
    efficiency: 75,
    adaptability: 60,
    color: "#8b5cf6",
  },
  {
    name: "RL-based",
    reward: -291.3,
    waitingTime: 21.50,
    queueLength: 0.00,
    throughput: 95.5,
    congestionEvents: 0,
    efficiency: 95,
    adaptability: 95,
    color: "#f97316",
  },
];

// Radar chart data for multi-dimensional comparison
const radarData = [
  {
    metric: "Efficiency",
    "Fixed-time": 35,
    "Rule-based": 75,
    "RL-based": 95,
  },
  {
    metric: "Adaptability",
    "Fixed-time": 10,
    "Rule-based": 60,
    "RL-based": 95,
  },
  {
    metric: "Throughput",
    "Fixed-time": 60,
    "Rule-based": 85,
    "RL-based": 95.5,
  },
  {
    metric: "Congestion Mgmt",
    "Fixed-time": 20,
    "Rule-based": 90,
    "RL-based": 100,
  },
  {
    metric: "Response Time",
    "Fixed-time": 30,
    "Rule-based": 70,
    "RL-based": 90,
  },
];

// Comparison data for composed chart
const comparisonData = strategyData.map((strategy) => ({
  strategy: strategy.name,
  "Waiting Time": strategy.waitingTime,
  "Queue Length": strategy.queueLength * 10, // Scale for visibility
  Throughput: strategy.throughput,
  Efficiency: strategy.efficiency,
}));

// Scenario performance data
const scenarioPerformance = [
  {
    scenario: "Normal Traffic",
    "Fixed-time": 45,
    "Rule-based": 78,
    "RL-based": 92,
  },
  {
    scenario: "Rush Hour",
    "Fixed-time": 25,
    "Rule-based": 65,
    "RL-based": 88,
  },
  {
    scenario: "Incident",
    "Fixed-time": 20,
    "Rule-based": 60,
    "RL-based": 85,
  },
  {
    scenario: "Heavy + Incident",
    "Fixed-time": 15,
    "Rule-based": 50,
    "RL-based": 80,
  },
];

export default function StrategyComparison() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Comparison Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            {t("nav.overview")}
          </TabsTrigger>
          <TabsTrigger value="radar" className="text-xs md:text-sm">
            {t("nav.multiMetric")}
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="text-xs md:text-sm">
            {t("nav.scenarios")}
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs md:text-sm">
            {t("nav.details")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Main Metrics */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Waiting Time Comparison */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("chart.avgWaitingTime")}</CardTitle>
              <CardDescription>{t("overview.secondsPerVehicle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>

                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                    formatter={(value) => `${value}s`}
                  />
                  <Bar dataKey="waitingTime" radius={[8, 8, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Queue Length Comparison */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("chart.queueLength")}</CardTitle>
              <CardDescription>{t("comparison.detailedMetrics")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>

                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="queueLength" radius={[8, 8, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Throughput Comparison */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("chart.throughput")}</CardTitle>
              <CardDescription>{t("chart.throughput")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>

                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="throughput" radius={[8, 8, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Total Reward Comparison */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("chart.totalReward")}</CardTitle>
              <CardDescription>{t("overview.higherValues")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>

                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="reward" radius={[8, 8, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar Tab - Multi-Dimensional Comparison */}
        <TabsContent value="radar" className="space-y-6 mt-6">
          {/* Multi-Metric Radar Chart */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Multi-Dimensional Performance Analysis</CardTitle>
              <CardDescription>Comprehensive comparison across all key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Fixed-time" dataKey="Fixed-time" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  <Radar name="Rule-based" dataKey="Rule-based" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                  <Radar name="RL-based" dataKey="RL-based" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Efficiency vs Adaptability Scatter */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Efficiency vs Adaptability</CardTitle>
              <CardDescription>Trade-off analysis between system efficiency and adaptability</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>

                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="efficiency" name="Efficiency" label={{ value: "Efficiency", position: "insideBottomRight", offset: -5 }} />
                  <YAxis dataKey="adaptability" name="Adaptability" label={{ value: "Adaptability", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                    formatter={(value) => `${value}%`}
                  />
                  {strategyData.map((entry, index) => (
                    <Scatter key={`scatter-${index}`} name={entry.name} data={[entry]} fill={entry.color} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab - Performance Under Different Conditions */}
        <TabsContent value="scenarios" className="space-y-6 mt-6">
          {/* Scenario Performance Comparison */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Performance Across Traffic Scenarios</CardTitle>
              <CardDescription>System performance under different traffic conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={scenarioPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="scenario" />
                  <YAxis label={{ value: "Performance Score", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Fixed-time" stroke="#3b82f6" strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="Rule-based" stroke="#8b5cf6" strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="RL-based" stroke="#f97316" strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scenario Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarioPerformance.map((scenario, idx) => (
              <Card key={idx} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm">{scenario.scenario}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[scenario]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="scenario" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="Fixed-time" fill="#3b82f6" />
                      <Bar dataKey="Rule-based" fill="#8b5cf6" />
                      <Bar dataKey="RL-based" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Details Tab - Comprehensive Metrics Table */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Comprehensive Performance Metrics</CardTitle>
              <CardDescription>Detailed comparison of all strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Metric</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Fixed-time</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Rule-based</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">RL-based</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Total Reward", key: "reward", unit: "", format: (v: number) => v.toFixed(1) },
                      { label: "Avg Waiting Time (s)", key: "waitingTime", unit: "s", format: (v: number) => v.toFixed(2) },
                      { label: "Avg Queue Length", key: "queueLength", unit: "", format: (v: number) => v.toFixed(2) },
                      { label: "Throughput (veh/min)", key: "throughput", unit: "", format: (v: number) => v.toFixed(1) },
                      { label: "Congestion Events", key: "congestionEvents", unit: "", format: (v: number) => v.toString() },
                      { label: "Efficiency (%)", key: "efficiency", unit: "%", format: (v: number) => v.toString() },
                      { label: "Adaptability (%)", key: "adaptability", unit: "%", format: (v: number) => v.toString() },
                    ].map((metric, idx) => {
                      const values = strategyData.map((s) => s[metric.key as keyof typeof s]);
                      const bestIdx = metric.key === "reward" ? values.indexOf(Math.max(...(values as number[]))) : values.indexOf(Math.max(...(values as number[])));

                      return (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="py-3 px-4 font-medium text-slate-900">{metric.label}</td>
                          {strategyData.map((strategy, sidx) => (
                            <td
                              key={sidx}
                              className={`text-right py-3 px-4 font-semibold ${
                                sidx === bestIdx ? "bg-green-50 text-green-700" : "text-slate-700"
                              }`}
                            >
                              {metric.format(strategy[metric.key as keyof typeof strategy] as number)}
                            </td>
                          ))}
                          <td className="text-right py-3 px-4 font-semibold text-slate-700">{strategyData[bestIdx].name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Key Findings */}
          <Card className="shadow-md bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Key Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <span className="text-orange-600 font-bold">✓</span>
                <span>
                  <strong>RL Dominance:</strong> The RL-based strategy outperforms both alternatives across all key metrics, achieving 55% improvement in waiting time.
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-orange-600 font-bold">✓</span>
                <span>
                  <strong>Perfect Queue Management:</strong> Both RL and Rule-based strategies eliminate average queue length, while Fixed-time accumulates 15.25 vehicles.
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-orange-600 font-bold">✓</span>
                <span>
                  <strong>Adaptability Advantage:</strong> RL achieves 95% adaptability score, enabling real-time response to changing traffic conditions.
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-orange-600 font-bold">✓</span>
                <span>
                  <strong>Scenario Resilience:</strong> RL maintains superior performance even under extreme conditions (heavy traffic + incident), with 80% efficiency.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
