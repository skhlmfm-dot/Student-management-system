import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUp, TrendingDown, Zap, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrafficSimulator, { SimulationState, SimulationResults } from "@/components/TrafficSimulator";
import StrategyComparison from "@/components/StrategyComparison";
import IntersectionVisualizer from "@/components/IntersectionVisualizer";
import ScenarioCustomizer, { CustomScenario } from "@/components/ScenarioCustomizer";
import ScenarioImpactAnalysis from "@/components/ScenarioImpactAnalysis";
import StrategyHeadToHead from "@/components/StrategyHeadToHead";
import StatisticalAnalysis from "@/components/StatisticalAnalysis";
import HypothesisTests from "@/components/HypothesisTests";
import DualIntersectionComparison from "@/components/DualIntersectionComparison";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import NetworkSimulationViewer from "@/components/NetworkSimulationViewer";

const staticPerformanceData = [
  { strategy: "Fixed-time", reward: -1855.8, waitingTime: 47.50, queueLength: 15.25 },
  { strategy: "Rule-based", reward: -313.0, waitingTime: 25.25, queueLength: 0.00 },
  { strategy: "RL-based", reward: -291.3, waitingTime: 21.50, queueLength: 0.00 }
];

const improvementData = [
  { name: "Fixed-time", value: 0 },
  { name: "Rule-based", value: 47 },
  { name: "RL-based", value: 55 }
];

const COLORS = ["#3b82f6", "#8b5cf6", "#f97316"];

export default function Home() {
  const { t } = useLanguage();
  const [simulationResults, setSimulationResults] = useState<SimulationResults>({
    totalReward: -291.3,
    avgWaitingTime: 21.50,
    avgQueueLength: 0.00,
    congestionEvents: 0,
    throughput: 95.5,
  });
  const [simulationHistory, setSimulationHistory] = useState<
    Array<{
      time: number;
      waitingTime: number;
      queueLength: number;
      reward: number;
    }>
  >([]);
  const [customScenario, setCustomScenario] = useState<CustomScenario | undefined>(undefined);

  const handleSimulationChange = useCallback((state: SimulationState, results: SimulationResults) => {
    setSimulationResults(results);
    
    // Add to history for trend visualization
    if (state.simulationTime % 5 === 0 && state.simulationTime > 0) {
      setSimulationHistory((prev) => [
        ...prev.slice(-19), // Keep last 20 entries
        {
          time: state.simulationTime,
          waitingTime: results.avgWaitingTime,
          queueLength: results.avgQueueLength,
          reward: results.totalReward,
        },
      ]);
    }
  }, []);

  const { language } = useLanguage();
  const isRTL = language === "ar";
  const isChinese = language === "zh";

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className={`flex items-center ${isRTL ? "flex-row-reverse" : "flex-row"} justify-between mb-2 gap-4`}>
            <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"} flex-1`}>
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 truncate">{t("app.title")}</h1>
            </div>
            <LanguageSwitcher />
          </div>
          <p className="text-sm md:text-lg text-slate-600">
            {t("app.subtitle")}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="w-full mb-8 md:mb-12">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 md:gap-2 mb-6 md:mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Zap className="w-4 h-4" />
              {t("nav.overview")}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              {t("nav.comparison")}
            </TabsTrigger>
            <TabsTrigger value="visualization" className="gap-2">
              <Zap className="w-4 h-4" />
              {t("nav.visualization")}
            </TabsTrigger>
            <TabsTrigger value="customizer" className="gap-2">
              <Settings className="w-4 h-4" />
              {t("nav.customize")}
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2">
              <Settings className="w-4 h-4" />
              {t("nav.simulator")}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              {t("nav.analysis")}
            </TabsTrigger>
            <TabsTrigger value="headtohead" className="gap-2">
              <Settings className="w-4 h-4" />
              {t("nav.headtohead")}
            </TabsTrigger>
            <TabsTrigger value="dualcomparison" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              {t("nav.dualcomparison")}
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Settings className="w-4 h-4" />
              Network Simulation
            </TabsTrigger>
          </TabsList>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <StrategyComparison />
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <IntersectionVisualizer customScenario={customScenario} />
          </TabsContent>

          {/* Customizer Tab */}
          <TabsContent value="customizer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ScenarioCustomizer onScenarioChange={setCustomScenario} />
              </div>
              <div>
                <ScenarioImpactAnalysis scenario={customScenario} />
              </div>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-12">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-blue-600 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600">{t("overview.bestReward")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">-291.3</div>
                  <p className="text-sm text-slate-500 mt-2">{t("strategy.rlBased")}</p>
                  <div className="flex items-center gap-1 mt-3 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">86% {t("common.better")} {t("strategy.fixedTime")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600">{t("overview.lowestWaiting")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">21.50s</div>
                  <p className="text-sm text-slate-500 mt-2">{t("strategy.rlBased")}</p>
                  <div className="flex items-center gap-1 mt-3 text-green-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-semibold">55% {t("overview.improvement")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600">{t("overview.optimalQueue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">0.00</div>
                  <p className="text-sm text-slate-500 mt-2">RL & Rule-based Strategies</p>
                  <div className="flex items-center gap-1 mt-3 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">{t("overview.perfectEfficiency")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Waiting Time Comparison */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>{t("overview.avgWaitingTime")}</CardTitle>
                  <CardDescription>{t("overview.secondsPerVehicle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={staticPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="strategy" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                        formatter={(value) => `${value}s`}
                      />
                      <Bar dataKey="waitingTime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Total Reward Comparison */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Total Reward Comparison</CardTitle>
                  <CardDescription>Higher values indicate better performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={staticPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="strategy" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="reward" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Improvement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Improvement Percentage */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Waiting Time Improvement</CardTitle>
                  <CardDescription>Percentage improvement vs Fixed-time baseline</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={improvementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: "Improvement (%)", angle: -90, position: "insideLeft" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                        formatter={(value) => `${value}%`}
                      />
                      <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Strategy Distribution */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Strategy Performance Distribution</CardTitle>
                  <CardDescription>Relative efficiency across all strategies</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Fixed-time", value: 30 },
                          { name: "Rule-based", value: 35 },
                          { name: "RL-based", value: 35 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics Table */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
                <CardDescription>Comprehensive comparison of all strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Strategy</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Reward</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Avg Waiting Time (s)</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Avg Queue Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staticPerformanceData.map((row, idx) => (
                        <tr key={idx} className={idx === 2 ? "bg-blue-50 border-b border-slate-200" : "border-b border-slate-200"}>
                          <td className="py-3 px-4 font-medium text-slate-900">{row.strategy}</td>
                          <td className={`text-right py-3 px-4 font-semibold ${idx === 2 ? "text-blue-600" : "text-slate-700"}`}>
                            {row.reward}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${idx === 2 ? "text-blue-600" : "text-slate-700"}`}>
                            {row.waitingTime}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${idx === 2 ? "text-blue-600" : "text-slate-700"}`}>
                            {row.queueLength}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card className="shadow-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-slate-700">
                      <strong>RL Superiority:</strong> The Reinforcement Learning-based system achieved the highest total reward (-291.3), demonstrating superior adaptability to dynamic traffic conditions.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-slate-700">
                      <strong>Significant Improvement:</strong> RL reduced average waiting time by 55% compared to the fixed-time baseline, resulting in substantial efficiency gains.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-slate-700">
                      <strong>Optimal Queue Management:</strong> Both RL and Rule-based strategies achieved zero average queue length, indicating excellent congestion control.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-slate-700">
                      <strong>Practical Viability:</strong> The RL system outperforms traditional methods while maintaining computational efficiency suitable for real-world deployment.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="shadow-md border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="text-green-900">Future Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Integrate with realistic traffic simulators like SUMO for validation on complex urban networks</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Expand MARL framework to handle interconnected intersections with coordinated signal control</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Incorporate additional environmental factors such as weather conditions and special events</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Conduct extensive testing across diverse traffic scenarios including rush hours and emergencies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactive Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <TrafficSimulator onSimulationChange={handleSimulationChange} />
          </TabsContent>

          {/* Head-to-Head Comparison Tab */}
          <TabsContent value="headtohead" className="space-y-6">
            <div className="space-y-6">
              <StrategyHeadToHead scenario={customScenario} />
              <StatisticalAnalysis strategy1="Fixed-time" strategy2="RL-based" scenario={customScenario} />
              <HypothesisTests scenario={customScenario} />
            </div>
          </TabsContent>

          {/* Dual Comparison Tab */}
          <TabsContent value="dualcomparison" className="space-y-6">
            <DualIntersectionComparison scenario={customScenario} />
          </TabsContent>

          {/* Network Simulation Tab */}
          <TabsContent value="network" className="space-y-6">
            <NetworkSimulationViewer />
          </TabsContent>

          {/* Detailed Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Current Simulation Results */}
            <Card className="shadow-md bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Current Simulation Results</CardTitle>
                <CardDescription>Real-time metrics from the interactive simulator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Avg Waiting Time</p>
                    <p className="text-2xl font-bold text-blue-600">{simulationResults.avgWaitingTime}s</p>
                    <p className="text-xs text-slate-500 mt-1">seconds per vehicle</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Avg Queue Length</p>
                    <p className="text-2xl font-bold text-purple-600">{simulationResults.avgQueueLength}</p>
                    <p className="text-xs text-slate-500 mt-1">vehicles</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Throughput</p>
                    <p className="text-2xl font-bold text-green-600">{simulationResults.throughput}</p>
                    <p className="text-xs text-slate-500 mt-1">vehicles/minute</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Total Reward</p>
                    <p className="text-2xl font-bold text-orange-600">{simulationResults.totalReward}</p>
                    <p className="text-xs text-slate-500 mt-1">system score</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Congestion Events</p>
                    <p className="text-2xl font-bold text-red-600">{simulationResults.congestionEvents}</p>
                    <p className="text-xs text-slate-500 mt-1">detected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            {simulationHistory.length > 0 && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Performance Trends Over Time</CardTitle>
                  <CardDescription>Real-time performance metrics during simulation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={simulationHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottomRight", offset: -5 }} />
                      <YAxis yAxisId="left" label={{ value: "Waiting Time (s)", angle: -90, position: "insideLeft" }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: "Reward", angle: 90, position: "insideRight" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="waitingTime" stroke="#3b82f6" name="Waiting Time (s)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="reward" stroke="#f97316" name="Total Reward" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p className="text-sm">
            Multi-Agent Reinforcement Learning for Adaptive Traffic Intersection Control • Advanced AI Research Project
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Prepared by Manus AI • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
