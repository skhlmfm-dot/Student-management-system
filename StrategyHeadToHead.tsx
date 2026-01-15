import { useState, useMemo } from "react";
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
  Cell,
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
} from "recharts";
import { CustomScenario } from "./ScenarioCustomizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

type StrategyType = "Fixed-time" | "Rule-based" | "RL-based";

interface StrategyHeadToHeadProps {
  scenario?: CustomScenario;
}

interface StrategyMetrics {
  waitingTime: number;
  queueLength: number;
  throughput: number;
  efficiency: number;
  congestionEvents: number;
  averageDelay: number;
}

const calculateMetrics = (
  strategy: StrategyType,
  scenario?: CustomScenario
): StrategyMetrics => {
  if (!scenario) {
    const baseMetrics: Record<StrategyType, StrategyMetrics> = {
      "Fixed-time": {
        waitingTime: 47.5,
        queueLength: 15.25,
        throughput: 60,
        efficiency: 35,
        congestionEvents: 12,
        averageDelay: 45,
      },
      "Rule-based": {
        waitingTime: 25.25,
        queueLength: 0,
        throughput: 85,
        efficiency: 75,
        congestionEvents: 3,
        averageDelay: 22,
      },
      "RL-based": {
        waitingTime: 21.5,
        queueLength: 0,
        throughput: 95.5,
        efficiency: 95,
        congestionEvents: 0,
        averageDelay: 18,
      },
    };
    return baseMetrics[strategy];
  }

  // Calculate impact from scenario
  const avgFlow = (scenario.northFlow + scenario.eastFlow + scenario.southFlow + scenario.westFlow) / 4;
  const flowMultiplier = 0.5 + (avgFlow / 100) * 1.5;
  const incidentMultiplier = scenario.incidentActive ? 1 + scenario.incidentSeverity / 200 : 1;
  const peakMultiplier = scenario.peakHourActive ? 1 + scenario.peakHourIntensity / 200 : 1;
  const totalMultiplier = flowMultiplier * incidentMultiplier * peakMultiplier;

  const baseMetrics: Record<StrategyType, StrategyMetrics> = {
    "Fixed-time": {
      waitingTime: 47.5 * totalMultiplier,
      queueLength: 15.25 * totalMultiplier,
      throughput: Math.max(10, 60 / totalMultiplier),
      efficiency: Math.max(5, 35 / totalMultiplier),
      congestionEvents: Math.round(12 * totalMultiplier),
      averageDelay: 45 * totalMultiplier,
    },
    "Rule-based": {
      waitingTime: 25.25 * (totalMultiplier * 0.7),
      queueLength: 0.5 * totalMultiplier,
      throughput: Math.max(30, 85 / (totalMultiplier * 0.6)),
      efficiency: Math.max(40, 75 / (totalMultiplier * 0.5)),
      congestionEvents: Math.round(3 * totalMultiplier * 0.7),
      averageDelay: 22 * (totalMultiplier * 0.7),
    },
    "RL-based": {
      waitingTime: 21.5 * (totalMultiplier * 0.5),
      queueLength: 0.2 * totalMultiplier,
      throughput: Math.max(50, 95.5 / (totalMultiplier * 0.4)),
      efficiency: Math.max(70, 95 / (totalMultiplier * 0.3)),
      congestionEvents: Math.round(0.5 * totalMultiplier),
      averageDelay: 18 * (totalMultiplier * 0.5),
    },
  };

  return baseMetrics[strategy];
};

const calculateImprovement = (baseValue: number, compareValue: number, lowerIsBetter: boolean = true): number => {
  if (baseValue === 0) return 0;
  const improvement = ((baseValue - compareValue) / baseValue) * 100;
  return lowerIsBetter ? improvement : -improvement;
};

export default function StrategyHeadToHead({ scenario }: StrategyHeadToHeadProps) {
  const [strategy1, setStrategy1] = useState<StrategyType>("Fixed-time");
  const [strategy2, setStrategy2] = useState<StrategyType>("RL-based");

  const metrics1 = useMemo(() => calculateMetrics(strategy1, scenario), [strategy1, scenario]);
  const metrics2 = useMemo(() => calculateMetrics(strategy2, scenario), [strategy2, scenario]);

  const strategies: StrategyType[] = ["Fixed-time", "Rule-based", "RL-based"];
  const otherStrategies = strategies.filter((s) => s !== strategy1);
  const otherStrategies2 = strategies.filter((s) => s !== strategy2);

  // Comparison data
  const comparisonData = [
    {
      metric: "Waiting Time (s)",
      [strategy1]: Math.round(metrics1.waitingTime * 10) / 10,
      [strategy2]: Math.round(metrics2.waitingTime * 10) / 10,
      improvement: calculateImprovement(metrics1.waitingTime, metrics2.waitingTime),
    },
    {
      metric: "Queue Length",
      [strategy1]: Math.round(metrics1.queueLength * 10) / 10,
      [strategy2]: Math.round(metrics2.queueLength * 10) / 10,
      improvement: calculateImprovement(metrics1.queueLength, metrics2.queueLength),
    },
    {
      metric: "Throughput",
      [strategy1]: Math.round(metrics1.throughput * 10) / 10,
      [strategy2]: Math.round(metrics2.throughput * 10) / 10,
      improvement: calculateImprovement(metrics1.throughput, metrics2.throughput, false),
    },
    {
      metric: "Efficiency (%)",
      [strategy1]: Math.round(metrics1.efficiency * 10) / 10,
      [strategy2]: Math.round(metrics2.efficiency * 10) / 10,
      improvement: calculateImprovement(metrics1.efficiency, metrics2.efficiency, false),
    },
    {
      metric: "Congestion Events",
      [strategy1]: metrics1.congestionEvents,
      [strategy2]: metrics2.congestionEvents,
      improvement: calculateImprovement(metrics1.congestionEvents, metrics2.congestionEvents),
    },
  ];

  // Performance trend data
  const trendData = Array.from({ length: 10 }, (_, i) => ({
    time: `${i * 10}s`,
    [strategy1]: Math.max(0, metrics1.waitingTime - (i * metrics1.waitingTime) / 10 + Math.random() * 5),
    [strategy2]: Math.max(0, metrics2.waitingTime - (i * metrics2.waitingTime) / 10 + Math.random() * 3),
  }));

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle>Select Strategies to Compare</CardTitle>
          <CardDescription>Choose two different strategies for head-to-head comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Strategy 1 Selection */}
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Strategy 1</label>
              <div className="space-y-2">
                {strategies.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrategy1(s)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                      strategy1 === s
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-blue-300 bg-white text-slate-900 hover:border-blue-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center gap-2 md:mt-6">
              <div className="text-2xl font-bold text-slate-400">VS</div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>

            {/* Strategy 2 Selection */}
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Strategy 2</label>
              <div className="space-y-2">
                {strategies.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrategy2(s)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                      strategy2 === s
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-orange-300 bg-white text-slate-900 hover:border-orange-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy 1 Card */}
        <Card className="shadow-md border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="text-blue-900">{strategy1}</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Waiting Time</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(metrics1.waitingTime * 10) / 10}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Queue Length</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(metrics1.queueLength * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Throughput</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(metrics1.throughput * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Efficiency</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(metrics1.efficiency * 10) / 10}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Congestion Events</span>
                <span className="text-lg font-bold text-blue-600">
                  {metrics1.congestionEvents}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy 2 Card */}
        <Card className="shadow-md border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <CardTitle className="text-orange-900">{strategy2}</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Waiting Time</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round(metrics2.waitingTime * 10) / 10}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Queue Length</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round(metrics2.queueLength * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Throughput</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round(metrics2.throughput * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Efficiency</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round(metrics2.efficiency * 10) / 10}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Congestion Events</span>
                <span className="text-lg font-bold text-orange-600">
                  {metrics2.congestionEvents}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Charts */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
          <TabsTrigger value="trend">Performance Trend</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
        </TabsList>

        {/* Metrics Comparison Tab */}
        <TabsContent value="metrics" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Side-by-Side Metrics Comparison</CardTitle>
              <CardDescription>
                Comparing {strategy1} vs {strategy2}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData}>
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

          {/* Improvement Indicators */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Performance Improvement Analysis</CardTitle>
              <CardDescription>
                How {strategy2} compares to {strategy1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{item.metric}</h4>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-blue-600">
                          {strategy1}: {item[strategy1 as keyof typeof item]}
                        </span>
                        <span className="text-orange-600">
                          {strategy2}: {item[strategy2 as keyof typeof item]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.improvement > 0 ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <Badge className="bg-green-600">+{Math.abs(Math.round(item.improvement))}%</Badge>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <Badge className="bg-red-600">{Math.round(item.improvement)}%</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Trend Tab */}
        <TabsContent value="trend" className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Waiting Time Performance Trend</CardTitle>
              <CardDescription>
                How waiting time evolves over time for both strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={strategy1}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={strategy2}
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Waiting Time */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Waiting Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">{strategy1}</span>
                    <span className="text-lg font-bold text-blue-700">
                      {Math.round(metrics1.waitingTime * 10) / 10}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-900">{strategy2}</span>
                    <span className="text-lg font-bold text-orange-700">
                      {Math.round(metrics2.waitingTime * 10) / 10}s
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      {strategy2} reduces waiting time by{" "}
                      <span className="font-bold text-green-600">
                        {Math.round(calculateImprovement(metrics1.waitingTime, metrics2.waitingTime))}%
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Queue Length */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Queue Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">{strategy1}</span>
                    <span className="text-lg font-bold text-blue-700">
                      {Math.round(metrics1.queueLength * 10) / 10}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-900">{strategy2}</span>
                    <span className="text-lg font-bold text-orange-700">
                      {Math.round(metrics2.queueLength * 10) / 10}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      {strategy2} reduces queue length by{" "}
                      <span className="font-bold text-green-600">
                        {Math.round(calculateImprovement(metrics1.queueLength, metrics2.queueLength))}%
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Throughput */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">{strategy1}</span>
                    <span className="text-lg font-bold text-blue-700">
                      {Math.round(metrics1.throughput * 10) / 10}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-900">{strategy2}</span>
                    <span className="text-lg font-bold text-orange-700">
                      {Math.round(metrics2.throughput * 10) / 10}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      {strategy2} increases throughput by{" "}
                      <span className="font-bold text-green-600">
                        {Math.round(calculateImprovement(metrics1.throughput, metrics2.throughput, false))}%
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Efficiency */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">{strategy1}</span>
                    <span className="text-lg font-bold text-blue-700">
                      {Math.round(metrics1.efficiency * 10) / 10}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-900">{strategy2}</span>
                    <span className="text-lg font-bold text-orange-700">
                      {Math.round(metrics2.efficiency * 10) / 10}%
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      {strategy2} improves efficiency by{" "}
                      <span className="font-bold text-green-600">
                        {Math.round(calculateImprovement(metrics1.efficiency, metrics2.efficiency, false))}%
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Winner Summary */}
      <Card className="shadow-md bg-gradient-to-r from-green-50 to-green-100 border-green-300">
        <CardHeader>
          <CardTitle className="text-green-900">Head-to-Head Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-semibold text-slate-900 mb-2">Better Waiting Time</h4>
              <p className="text-lg font-bold text-green-600">
                {metrics1.waitingTime < metrics2.waitingTime ? strategy1 : strategy2}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round(Math.abs(calculateImprovement(metrics1.waitingTime, metrics2.waitingTime)))}% difference
              </p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-semibold text-slate-900 mb-2">Better Queue Management</h4>
              <p className="text-lg font-bold text-green-600">
                {metrics1.queueLength < metrics2.queueLength ? strategy1 : strategy2}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round(Math.abs(calculateImprovement(metrics1.queueLength, metrics2.queueLength)))}% difference
              </p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-semibold text-slate-900 mb-2">Better Efficiency</h4>
              <p className="text-lg font-bold text-green-600">
                {metrics1.efficiency > metrics2.efficiency ? strategy1 : strategy2}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round(Math.abs(calculateImprovement(metrics1.efficiency, metrics2.efficiency, false)))}% difference
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
