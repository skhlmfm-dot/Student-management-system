import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { CustomScenario } from "./ScenarioCustomizer";
import { Play, Pause, RotateCcw, TrendingUp } from "lucide-react";

type StrategyType = "Fixed-time" | "Rule-based" | "RL-based";

interface DualIntersectionComparisonProps {
  scenario?: CustomScenario;
}

interface PerformanceSnapshot {
  time: number;
  strategy1_waiting: number;
  strategy1_queue: number;
  strategy1_throughput: number;
  strategy2_waiting: number;
  strategy2_queue: number;
  strategy2_throughput: number;
  strategy1_signal: "red" | "yellow" | "green";
  strategy2_signal: "red" | "yellow" | "green";
}

const getBaseMetrics = (strategy: StrategyType, scenario?: CustomScenario) => {
  const baseValues: Record<StrategyType, { waiting: number; queue: number; throughput: number }> = {
    "Fixed-time": { waiting: 47.5, queue: 15.25, throughput: 60 },
    "Rule-based": { waiting: 25.25, queue: 0.5, throughput: 85 },
    "RL-based": { waiting: 21.5, queue: 0.2, throughput: 95.5 },
  };

  let metrics = baseValues[strategy];

  if (scenario) {
    const avgFlow = (scenario.northFlow + scenario.eastFlow + scenario.southFlow + scenario.westFlow) / 4;
    const flowMultiplier = 0.5 + (avgFlow / 100) * 1.5;
    const incidentMultiplier = scenario.incidentActive ? 1 + scenario.incidentSeverity / 200 : 1;
    const peakMultiplier = scenario.peakHourActive ? 1 + scenario.peakHourIntensity / 200 : 1;
    const totalMultiplier = flowMultiplier * incidentMultiplier * peakMultiplier;

    if (strategy === "Fixed-time") {
      return {
        waiting: metrics.waiting * totalMultiplier,
        queue: metrics.queue * totalMultiplier,
        throughput: Math.max(10, metrics.throughput / totalMultiplier),
      };
    } else if (strategy === "Rule-based") {
      return {
        waiting: metrics.waiting * (totalMultiplier * 0.7),
        queue: metrics.queue * totalMultiplier,
        throughput: Math.max(30, metrics.throughput / (totalMultiplier * 0.6)),
      };
    } else {
      return {
        waiting: metrics.waiting * (totalMultiplier * 0.5),
        queue: metrics.queue * totalMultiplier,
        throughput: Math.max(50, metrics.throughput / (totalMultiplier * 0.4)),
      };
    }
  }

  return metrics;
};

const generatePerformanceTimeline = (
  strategy1: StrategyType,
  strategy2: StrategyType,
  scenario?: CustomScenario,
  duration: number = 60
): PerformanceSnapshot[] => {
  const data: PerformanceSnapshot[] = [];
  const metrics1 = getBaseMetrics(strategy1, scenario);
  const metrics2 = getBaseMetrics(strategy2, scenario);

  const signals = ["red", "yellow", "green"] as const;

  for (let t = 0; t <= duration; t += 2) {
    // Add some variation to simulate real traffic
    const noise1 = (Math.sin(t / 10) * 0.1 + Math.random() * 0.05) * metrics1.waiting;
    const noise2 = (Math.cos(t / 12) * 0.08 + Math.random() * 0.03) * metrics2.waiting;

    // Signal cycling (simplified)
    const signalIndex1 = Math.floor((t / 60) * 3) % 3;
    const signalIndex2 = Math.floor((t / 50) * 3) % 3;

    data.push({
      time: t,
      strategy1_waiting: Math.max(0, metrics1.waiting + noise1),
      strategy1_queue: Math.max(0, metrics1.queue * (1 + Math.sin(t / 15) * 0.3)),
      strategy1_throughput: Math.max(0, metrics1.throughput + Math.random() * 5),
      strategy2_waiting: Math.max(0, metrics2.waiting + noise2),
      strategy2_queue: Math.max(0, metrics2.queue * (1 + Math.sin(t / 12) * 0.2)),
      strategy2_throughput: Math.max(0, metrics2.throughput + Math.random() * 3),
      strategy1_signal: signals[signalIndex1],
      strategy2_signal: signals[signalIndex2],
    });
  }

  return data;
};

const TrafficSignal = ({ status }: { status: "red" | "yellow" | "green" }) => {
  const colors = {
    red: "bg-red-500",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
  };

  return (
    <div className="flex gap-2">
      <div className={`w-4 h-4 rounded-full ${colors[status]} shadow-lg`} />
      <span className="text-sm font-semibold capitalize text-slate-700">{status}</span>
    </div>
  );
};

export default function DualIntersectionComparison({ scenario }: DualIntersectionComparisonProps) {
  const [strategy1, setStrategy1] = useState<StrategyType>("Fixed-time");
  const [strategy2, setStrategy2] = useState<StrategyType>("RL-based");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [metric, setMetric] = useState<"waiting" | "queue" | "throughput">("waiting");

  const strategies: StrategyType[] = ["Fixed-time", "Rule-based", "RL-based"];
  const otherStrategies = strategies.filter((s) => s !== strategy1);
  const otherStrategies2 = strategies.filter((s) => s !== strategy2);

  // Generate timeline data
  const timeline = useMemo(
    () => generatePerformanceTimeline(strategy1, strategy2, scenario, duration),
    [strategy1, strategy2, scenario, duration]
  );

  // Get current snapshot
  const currentSnapshot = useMemo(() => {
    return timeline.find((s) => s.time >= currentTime) || timeline[timeline.length - 1];
  }, [timeline, currentTime]);

  // Animate playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const metricLabels = {
    waiting: "Waiting Time (s)",
    queue: "Queue Length",
    throughput: "Throughput (vehicles/min)",
  };

  // Prepare chart data
  const chartData = timeline.map((snapshot) => ({
    time: snapshot.time,
    [`${strategy1} ${metricLabels[metric]}`]: Math.round(
      snapshot[`strategy1_${metric}` as keyof PerformanceSnapshot] as number * 100
    ) / 100,
    [`${strategy2} ${metricLabels[metric]}`]: Math.round(
      snapshot[`strategy2_${metric}` as keyof PerformanceSnapshot] as number * 100
    ) / 100,
  }));

  // Calculate cumulative metrics
  const cumulativeMetrics = useMemo(() => {
    const s1Waiting = timeline.reduce((sum, s) => sum + s.strategy1_waiting, 0) / timeline.length;
    const s2Waiting = timeline.reduce((sum, s) => sum + s.strategy2_waiting, 0) / timeline.length;
    const s1Queue = timeline.reduce((sum, s) => sum + s.strategy1_queue, 0) / timeline.length;
    const s2Queue = timeline.reduce((sum, s) => sum + s.strategy2_queue, 0) / timeline.length;
    const s1Throughput = timeline.reduce((sum, s) => sum + s.strategy1_throughput, 0) / timeline.length;
    const s2Throughput = timeline.reduce((sum, s) => sum + s.strategy2_throughput, 0) / timeline.length;

    return {
      s1Waiting: Math.round(s1Waiting * 100) / 100,
      s2Waiting: Math.round(s2Waiting * 100) / 100,
      s1Queue: Math.round(s1Queue * 100) / 100,
      s2Queue: Math.round(s2Queue * 100) / 100,
      s1Throughput: Math.round(s1Throughput * 100) / 100,
      s2Throughput: Math.round(s2Throughput * 100) / 100,
    };
  }, [timeline]);

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle>Dual Intersection Comparison</CardTitle>
          <CardDescription>
            Watch two strategies operate simultaneously under the same traffic conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy 1 Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Strategy 1</label>
              <Select value={strategy1} onValueChange={(value) => setStrategy1(value as StrategyType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strategy 2 Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Strategy 2</label>
              <Select value={strategy2} onValueChange={(value) => setStrategy2(value as StrategyType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy 1 Status */}
        <Card className="shadow-md border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="text-blue-900">{strategy1}</CardTitle>
            <CardDescription>Current Status (t = {currentSnapshot?.time}s)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-slate-700">Signal Status</span>
                <TrafficSignal status={currentSnapshot?.strategy1_signal || "red"} />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-slate-700">Waiting Time</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round((currentSnapshot?.strategy1_waiting || 0) * 10) / 10}s
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-slate-700">Queue Length</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round((currentSnapshot?.strategy1_queue || 0) * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-slate-700">Throughput</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round((currentSnapshot?.strategy1_throughput || 0) * 10) / 10}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy 2 Status */}
        <Card className="shadow-md border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <CardTitle className="text-orange-900">{strategy2}</CardTitle>
            <CardDescription>Current Status (t = {currentSnapshot?.time}s)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm font-medium text-slate-700">Signal Status</span>
                <TrafficSignal status={currentSnapshot?.strategy2_signal || "red"} />
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm font-medium text-slate-700">Waiting Time</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round((currentSnapshot?.strategy2_waiting || 0) * 10) / 10}s
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm font-medium text-slate-700">Queue Length</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round((currentSnapshot?.strategy2_queue || 0) * 10) / 10}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm font-medium text-slate-700">Throughput</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round((currentSnapshot?.strategy2_throughput || 0) * 10) / 10}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playback Controls */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Simulation Playback</CardTitle>
          <CardDescription>Watch the strategies perform in real-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metric Selection */}
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold text-slate-700">Metric:</label>
            <Select value={metric} onValueChange={(value) => setMetric(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiting">Waiting Time</SelectItem>
                <SelectItem value="queue">Queue Length</SelectItem>
                <SelectItem value="throughput">Throughput</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: metricLabels[metric], angle: -90, position: "insideLeft" }} />
              <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey={`${strategy1} ${metricLabels[metric]}`}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={`${strategy2} ${metricLabels[metric]}`}
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Playback Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-2"
                variant={isPlaying ? "destructive" : "default"}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            {/* Timeline Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Time: {currentTime}s</span>
                <span>Duration: {duration}s</span>
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={(value) => setCurrentTime(value[0])}
                max={duration}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Performance Summary */}
      <Card className="shadow-md bg-gradient-to-r from-green-50 to-green-100 border-green-300">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Cumulative Performance Summary
          </CardTitle>
          <CardDescription>Average metrics over the entire simulation period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Waiting Time */}
            <div className="p-4 bg-white rounded-lg border border-green-300">
              <h4 className="font-semibold text-slate-900 mb-3">Average Waiting Time</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-slate-600">{strategy1}</span>
                  <span className="font-bold text-blue-700">{cumulativeMetrics.s1Waiting}s</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm text-slate-600">{strategy2}</span>
                  <span className="font-bold text-orange-700">{cumulativeMetrics.s2Waiting}s</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    {strategy2} is{" "}
                    <span className="font-bold text-green-600">
                      {Math.round(((cumulativeMetrics.s1Waiting - cumulativeMetrics.s2Waiting) / cumulativeMetrics.s1Waiting) * 100)}%
                    </span>{" "}
                    faster
                  </p>
                </div>
              </div>
            </div>

            {/* Queue Length */}
            <div className="p-4 bg-white rounded-lg border border-green-300">
              <h4 className="font-semibold text-slate-900 mb-3">Average Queue Length</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-slate-600">{strategy1}</span>
                  <span className="font-bold text-blue-700">{cumulativeMetrics.s1Queue}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm text-slate-600">{strategy2}</span>
                  <span className="font-bold text-orange-700">{cumulativeMetrics.s2Queue}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    {strategy2} reduces queues by{" "}
                    <span className="font-bold text-green-600">
                      {Math.round(((cumulativeMetrics.s1Queue - cumulativeMetrics.s2Queue) / cumulativeMetrics.s1Queue) * 100)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Throughput */}
            <div className="p-4 bg-white rounded-lg border border-green-300">
              <h4 className="font-semibold text-slate-900 mb-3">Average Throughput</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-slate-600">{strategy1}</span>
                  <span className="font-bold text-blue-700">{cumulativeMetrics.s1Throughput}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm text-slate-600">{strategy2}</span>
                  <span className="font-bold text-orange-700">{cumulativeMetrics.s2Throughput}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    {strategy2} improves throughput by{" "}
                    <span className="font-bold text-green-600">
                      {Math.round(((cumulativeMetrics.s2Throughput - cumulativeMetrics.s1Throughput) / cumulativeMetrics.s1Throughput) * 100)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
