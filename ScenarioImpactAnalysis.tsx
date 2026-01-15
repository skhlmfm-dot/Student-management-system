import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Area,
  AreaChart,
} from "recharts";
import { CustomScenario } from "./ScenarioCustomizer";

interface ScenarioImpactAnalysisProps {
  scenario?: CustomScenario;
}

// Calculate performance metrics based on scenario
const calculatePerformanceMetrics = (scenario?: CustomScenario) => {
  if (!scenario) {
    return {
      fixedTime: { waitingTime: 47.5, queueLength: 15.25, throughput: 60, efficiency: 35 },
      ruleBased: { waitingTime: 25.25, queueLength: 0, throughput: 85, efficiency: 75 },
      rlBased: { waitingTime: 21.5, queueLength: 0, throughput: 95.5, efficiency: 95 },
    };
  }

  // Calculate base impact from traffic flow
  const avgFlow = (scenario.northFlow + scenario.eastFlow + scenario.southFlow + scenario.westFlow) / 4;
  const flowMultiplier = 0.5 + (avgFlow / 100) * 1.5;

  // Calculate incident impact
  const incidentMultiplier = scenario.incidentActive ? 1 + scenario.incidentSeverity / 200 : 1;

  // Calculate peak hour impact
  const peakMultiplier = scenario.peakHourActive ? 1 + scenario.peakHourIntensity / 200 : 1;

  // Combined multiplier
  const totalMultiplier = flowMultiplier * incidentMultiplier * peakMultiplier;

  return {
    fixedTime: {
      waitingTime: Math.round(47.5 * totalMultiplier * 10) / 10,
      queueLength: Math.round(15.25 * totalMultiplier * 10) / 10,
      throughput: Math.max(10, Math.round(60 / totalMultiplier * 10) / 10),
      efficiency: Math.max(5, Math.round(35 / totalMultiplier * 10) / 10),
    },
    ruleBased: {
      waitingTime: Math.round(25.25 * (totalMultiplier * 0.7) * 10) / 10,
      queueLength: Math.round(0.5 * totalMultiplier * 10) / 10,
      throughput: Math.max(30, Math.round(85 / (totalMultiplier * 0.6) * 10) / 10),
      efficiency: Math.max(40, Math.round(75 / (totalMultiplier * 0.5) * 10) / 10),
    },
    rlBased: {
      waitingTime: Math.round(21.5 * (totalMultiplier * 0.5) * 10) / 10,
      queueLength: Math.round(0.2 * totalMultiplier * 10) / 10,
      throughput: Math.max(50, Math.round(95.5 / (totalMultiplier * 0.4) * 10) / 10),
      efficiency: Math.max(70, Math.round(95 / (totalMultiplier * 0.3) * 10) / 10),
    },
  };
};

export default function ScenarioImpactAnalysis({ scenario }: ScenarioImpactAnalysisProps) {
  const metrics = useMemo(() => calculatePerformanceMetrics(scenario), [scenario]);

  // Data for comparison chart
  const comparisonData = [
    {
      metric: "Waiting Time (s)",
      "Fixed-time": metrics.fixedTime.waitingTime,
      "Rule-based": metrics.ruleBased.waitingTime,
      "RL-based": metrics.rlBased.waitingTime,
    },
    {
      metric: "Queue Length",
      "Fixed-time": metrics.fixedTime.queueLength,
      "Rule-based": metrics.ruleBased.queueLength,
      "RL-based": metrics.rlBased.queueLength,
    },
    {
      metric: "Throughput",
      "Fixed-time": metrics.fixedTime.throughput,
      "Rule-based": metrics.ruleBased.throughput,
      "RL-based": metrics.rlBased.throughput,
    },
    {
      metric: "Efficiency (%)",
      "Fixed-time": metrics.fixedTime.efficiency,
      "Rule-based": metrics.ruleBased.efficiency,
      "RL-based": metrics.rlBased.efficiency,
    },
  ];

  // Data for radar chart
  const radarData = [
    {
      metric: "Waiting Time",
      "Fixed-time": Math.min(100, (metrics.fixedTime.waitingTime / 50) * 100),
      "Rule-based": Math.min(100, (metrics.ruleBased.waitingTime / 50) * 100),
      "RL-based": Math.min(100, (metrics.rlBased.waitingTime / 50) * 100),
    },
    {
      metric: "Queue Mgmt",
      "Fixed-time": Math.max(0, 100 - metrics.fixedTime.queueLength * 5),
      "Rule-based": Math.max(0, 100 - metrics.ruleBased.queueLength * 5),
      "RL-based": Math.max(0, 100 - metrics.rlBased.queueLength * 5),
    },
    {
      metric: "Throughput",
      "Fixed-time": (metrics.fixedTime.throughput / 100) * 100,
      "Rule-based": (metrics.ruleBased.throughput / 100) * 100,
      "RL-based": (metrics.rlBased.throughput / 100) * 100,
    },
    {
      metric: "Efficiency",
      "Fixed-time": metrics.fixedTime.efficiency,
      "Rule-based": metrics.ruleBased.efficiency,
      "RL-based": metrics.rlBased.efficiency,
    },
  ];

  // Calculate improvements
  const improvements = {
    waitingTime: Math.round(
      ((metrics.fixedTime.waitingTime - metrics.rlBased.waitingTime) /
        metrics.fixedTime.waitingTime) *
        100
    ),
    queueLength: Math.round(
      ((metrics.fixedTime.queueLength - metrics.rlBased.queueLength) /
        (metrics.fixedTime.queueLength || 1)) *
        100
    ),
    throughput: Math.round(
      ((metrics.rlBased.throughput - metrics.fixedTime.throughput) /
        metrics.fixedTime.throughput) *
        100
    ),
    efficiency: Math.round(
      ((metrics.rlBased.efficiency - metrics.fixedTime.efficiency) /
        metrics.fixedTime.efficiency) *
        100
    ),
  };

  return (
    <div className="space-y-6">
      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">Waiting Time Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {improvements.waitingTime}%
            </div>
            <p className="text-xs text-blue-600 mt-1">RL vs Fixed-time</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-900">Queue Reduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {improvements.queueLength}%
            </div>
            <p className="text-xs text-green-600 mt-1">RL vs Fixed-time</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-900">Throughput Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              +{improvements.throughput}%
            </div>
            <p className="text-xs text-purple-600 mt-1">RL vs Fixed-time</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-900">Efficiency Boost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              +{improvements.efficiency}%
            </div>
            <p className="text-xs text-orange-600 mt-1">RL vs Fixed-time</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Real-time Performance Metrics Comparison</CardTitle>
          <CardDescription>
            Impact of current scenario on all three control strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="Fixed-time" fill="#3b82f6" />
              <Bar dataKey="Rule-based" fill="#8b5cf6" />
              <Bar dataKey="RL-based" fill="#f97316" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar Chart for Multi-dimensional Analysis */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Multi-Dimensional Performance Analysis</CardTitle>
          <CardDescription>
            Comprehensive view of strategy performance under current scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Fixed-time"
                dataKey="Fixed-time"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
              />
              <Radar
                name="Rule-based"
                dataKey="Rule-based"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.15}
              />
              <Radar
                name="RL-based"
                dataKey="RL-based"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.15}
              />
              <Legend />
              <Tooltip
                contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Metric Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waiting Time Detail */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Waiting Time Analysis</CardTitle>
            <CardDescription>Average seconds per vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    strategy: "Fixed-time",
                    value: metrics.fixedTime.waitingTime,
                    fill: "#3b82f6",
                  },
                  {
                    strategy: "Rule-based",
                    value: metrics.ruleBased.waitingTime,
                    fill: "#8b5cf6",
                  },
                  {
                    strategy: "RL-based",
                    value: metrics.rlBased.waitingTime,
                    fill: "#f97316",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  formatter={(value) => `${value}s`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: "#3b82f6" },
                    { fill: "#8b5cf6" },
                    { fill: "#f97316" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Queue Length Detail */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Queue Length Analysis</CardTitle>
            <CardDescription>Average vehicles in queue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    strategy: "Fixed-time",
                    value: metrics.fixedTime.queueLength,
                    fill: "#3b82f6",
                  },
                  {
                    strategy: "Rule-based",
                    value: metrics.ruleBased.queueLength,
                    fill: "#8b5cf6",
                  },
                  {
                    strategy: "RL-based",
                    value: metrics.rlBased.queueLength,
                    fill: "#f97316",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: "#3b82f6" },
                    { fill: "#8b5cf6" },
                    { fill: "#f97316" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Throughput Detail */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Throughput Analysis</CardTitle>
            <CardDescription>Vehicles processed per minute</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    strategy: "Fixed-time",
                    value: metrics.fixedTime.throughput,
                    fill: "#3b82f6",
                  },
                  {
                    strategy: "Rule-based",
                    value: metrics.ruleBased.throughput,
                    fill: "#8b5cf6",
                  },
                  {
                    strategy: "RL-based",
                    value: metrics.rlBased.throughput,
                    fill: "#f97316",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  formatter={(value) => `${value} veh/min`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: "#3b82f6" },
                    { fill: "#8b5cf6" },
                    { fill: "#f97316" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Detail */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Efficiency Analysis</CardTitle>
            <CardDescription>System efficiency percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    strategy: "Fixed-time",
                    value: metrics.fixedTime.efficiency,
                    fill: "#3b82f6",
                  },
                  {
                    strategy: "Rule-based",
                    value: metrics.ruleBased.efficiency,
                    fill: "#8b5cf6",
                  },
                  {
                    strategy: "RL-based",
                    value: metrics.rlBased.efficiency,
                    fill: "#f97316",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="strategy" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: "#3b82f6" },
                    { fill: "#8b5cf6" },
                    { fill: "#f97316" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Impact Summary */}
      {scenario && (
        <Card className="shadow-md bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300">
          <CardHeader>
            <CardTitle>Current Scenario Impact Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600">North Flow:</span>
                <span className="ml-2 font-bold text-slate-900">{scenario.northFlow}%</span>
              </div>
              <div>
                <span className="text-slate-600">East Flow:</span>
                <span className="ml-2 font-bold text-slate-900">{scenario.eastFlow}%</span>
              </div>
              <div>
                <span className="text-slate-600">South Flow:</span>
                <span className="ml-2 font-bold text-slate-900">{scenario.southFlow}%</span>
              </div>
              <div>
                <span className="text-slate-600">West Flow:</span>
                <span className="ml-2 font-bold text-slate-900">{scenario.westFlow}%</span>
              </div>
              {scenario.incidentActive && (
                <div className="text-red-600 font-medium">
                  ⚠️ Incident: {scenario.incidentLocation} ({scenario.incidentSeverity}%)
                </div>
              )}
              {scenario.peakHourActive && (
                <div className="text-orange-600 font-medium">
                  📈 Peak Hour: {scenario.peakHourIntensity}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
