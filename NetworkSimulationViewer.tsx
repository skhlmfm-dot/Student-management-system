import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  initializeNetwork,
  createNetworkConnections,
  simulateNetworkStep,
  calculateNetworkStats,
  NetworkState,
  SimulationConfig,
} from "@/lib/networkSimulation";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function NetworkSimulationViewer() {
  const { t } = useLanguage();
  const [gridSize, setGridSize] = useState(2);
  const [strategy, setStrategy] = useState<"fixed-time" | "rule-based" | "rl-based">("rl-based");
  const [trafficIntensity, setTrafficIntensity] = useState(0.5);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<NetworkState[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const config: SimulationConfig = {
    gridSize,
    simulationTime: 100,
    strategy,
    trafficIntensity,
    incidentEnabled: false,
  };

  // Initialize simulation
  useEffect(() => {
    const intersections = initializeNetwork(gridSize);
    const connections = createNetworkConnections(gridSize);

    let state: NetworkState = {
      intersections,
      connections,
      time: 0,
      totalVehicles: 0,
      networkEfficiency: 0,
      averageWaitingTime: 0,
    };

    const history: NetworkState[] = [state];
    setSimulationHistory(history);
    setCurrentStep(0);
  }, [gridSize, strategy, trafficIntensity]);

  // Run simulation step
  useEffect(() => {
    if (!isRunning || simulationHistory.length === 0) return;

    const timer = setTimeout(() => {
      if (currentStep < config.simulationTime) {
        const lastState = simulationHistory[simulationHistory.length - 1];
        const newState = simulateNetworkStep(lastState, config, lastState.connections);
        setSimulationHistory([...simulationHistory, newState]);
        setCurrentStep(currentStep + 1);
      } else {
        setIsRunning(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isRunning, currentStep, simulationHistory, config]);

  const currentState = simulationHistory[currentStep];
  const stats = calculateNetworkStats(simulationHistory);

  // Prepare chart data
  const chartData = simulationHistory.map((state) => ({
    time: state.time,
    efficiency: (state.networkEfficiency * 100).toFixed(2),
    waitingTime: state.averageWaitingTime.toFixed(2),
    vehicles: state.totalVehicles,
  }));

  // Prepare intersection data
  const intersectionData = currentState?.intersections.map((intersection) => ({
    name: intersection.name,
    efficiency: (intersection.efficiency * 100).toFixed(2),
    throughput: intersection.totalThroughput,
    waitingTime: intersection.totalWaitingTime,
  })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Simulation Configuration</CardTitle>
          <CardDescription>
            Simulate multiple interconnected traffic intersections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grid Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Grid Size: {gridSize}x{gridSize}
              </label>
              <input
                type="range"
                min="2"
                max="4"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                disabled={isRunning}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {gridSize * gridSize} intersections
              </p>
            </div>

            {/* Traffic Intensity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Traffic Intensity: {(trafficIntensity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={trafficIntensity}
                onChange={(e) => setTrafficIntensity(Number(e.target.value))}
                disabled={isRunning}
                className="w-full"
              />
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                disabled={isRunning}
                className="w-full border rounded-lg p-2"
              >
                <option value="fixed-time">Fixed-Time</option>
                <option value="rule-based">Rule-Based</option>
                <option value="rl-based">RL-Based</option>
              </select>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setIsRunning(false);
                setCurrentStep(0);
                const intersections = initializeNetwork(gridSize);
                const connections = createNetworkConnections(gridSize);
                setSimulationHistory([
                  {
                    intersections,
                    connections,
                    time: 0,
                    totalVehicles: 0,
                    networkEfficiency: 0,
                    averageWaitingTime: 0,
                  },
                ]);
              }}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <div className="ml-auto text-sm font-medium">
              Step: {currentStep} / {config.simulationTime}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Visualization */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Network Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="intersections">Intersections</TabsTrigger>
        </TabsList>

        {/* Network Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Grid Visualization</CardTitle>
              <CardDescription>
                {gridSize}x{gridSize} intersection network with {currentState?.connections.length || 0} connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-8 rounded-lg">
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: "fit-content",
                    margin: "0 auto",
                  }}
                >
                  {currentState?.intersections.map((intersection) => (
                    <div
                      key={intersection.id}
                      className="w-24 h-24 bg-white border-2 rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                      title={intersection.name}
                    >
                      <div className="text-xs font-bold text-center">
                        ({intersection.x + 1}, {intersection.y + 1})
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Q: {(
                          intersection.northQueue +
                          intersection.eastQueue +
                          intersection.southQueue +
                          intersection.westQueue
                        ).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Eff: {(intersection.efficiency * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600">Network Efficiency</p>
                  <p className="text-2xl font-bold">
                    {(stats.avgEfficiency * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600">Avg Waiting Time</p>
                  <p className="text-2xl font-bold">
                    {stats.avgWaitingTime.toFixed(1)}s
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600">Avg Vehicles</p>
                  <p className="text-2xl font-bold">
                    {stats.avgVehicles.toFixed(0)}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600">Max Efficiency</p>
                  <p className="text-2xl font-bold">
                    {(stats.maxEfficiency * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance Over Time</CardTitle>
              <CardDescription>
                Efficiency and waiting time trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#3b82f6"
                    name="Efficiency (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="waitingTime"
                    stroke="#ef4444"
                    name="Waiting Time (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Count Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vehicles" fill="#10b981" name="Total Vehicles" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intersections */}
        <TabsContent value="intersections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intersection Performance</CardTitle>
              <CardDescription>
                Performance metrics for each intersection at step {currentStep}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intersectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency (%)" />
                  <Bar dataKey="throughput" fill="#10b981" name="Throughput" />
                </BarChart>
              </ResponsiveContainer>

              {/* Intersection Details */}
              <div className="mt-6 space-y-3">
                {intersectionData.map((intersection, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">{intersection.name}</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Efficiency:</span>
                        <span className="font-bold ml-1">{intersection.efficiency}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Throughput:</span>
                        <span className="font-bold ml-1">{intersection.throughput}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Waiting Time:</span>
                        <span className="font-bold ml-1">{intersection.waitingTime}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
