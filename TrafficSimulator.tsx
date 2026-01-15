import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, RotateCcw } from "lucide-react";

export interface SimulationState {
  northTraffic: number;
  eastTraffic: number;
  southTraffic: number;
  westTraffic: number;
  incidentActive: boolean;
  rushHour: boolean;
  simulationTime: number;
  isRunning: boolean;
}

export interface SimulationResults {
  totalReward: number;
  avgWaitingTime: number;
  avgQueueLength: number;
  congestionEvents: number;
  throughput: number;
}

interface TrafficSimulatorProps {
  onSimulationChange: (state: SimulationState, results: SimulationResults) => void;
}

export default function TrafficSimulator({ onSimulationChange }: TrafficSimulatorProps) {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    northTraffic: 50,
    eastTraffic: 50,
    southTraffic: 50,
    westTraffic: 50,
    incidentActive: false,
    rushHour: false,
    simulationTime: 0,
    isRunning: false,
  });

  const [results, setResults] = useState<SimulationResults>({
    totalReward: -291.3,
    avgWaitingTime: 21.50,
    avgQueueLength: 0.00,
    congestionEvents: 0,
    throughput: 95.5,
  });

  // Memoize the callback to prevent unnecessary updates
  const calculateResults = useCallback((state: SimulationState): SimulationResults => {
    const avgTraffic =
      (state.northTraffic + state.eastTraffic + state.southTraffic + state.westTraffic) / 4;

    // Base calculation
    let waitingTime = 21.5 + (avgTraffic - 50) * 0.3;
    let queueLength = Math.max(0, (avgTraffic - 50) * 0.2);
    let reward = -291.3 - (avgTraffic - 50) * 2;

    // Apply rush hour multiplier
    if (state.rushHour) {
      waitingTime *= 1.3;
      queueLength *= 1.4;
      reward *= 1.1;
    }

    // Apply incident impact
    if (state.incidentActive) {
      waitingTime *= 1.5;
      queueLength *= 1.6;
      reward *= 1.2;
    }

    // Calculate congestion events
    const congestionEvents = Math.floor(
      (avgTraffic > 70 ? 1 : 0) + (state.rushHour ? 2 : 0) + (state.incidentActive ? 3 : 0)
    );

    // Calculate throughput (vehicles per minute)
    const throughput = Math.max(50, 100 - avgTraffic * 0.3 - (state.incidentActive ? 20 : 0));

    return {
      totalReward: Math.round(reward * 10) / 10,
      avgWaitingTime: Math.round(waitingTime * 100) / 100,
      avgQueueLength: Math.round(queueLength * 100) / 100,
      congestionEvents,
      throughput: Math.round(throughput * 10) / 10,
    };
  }, []);

  // Simulate traffic dynamics
  useEffect(() => {
    if (!simulationState.isRunning) return;

    const interval = setInterval(() => {
      setSimulationState((prev) => ({
        ...prev,
        simulationTime: prev.simulationTime + 1,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [simulationState.isRunning]);

  // Calculate results and notify parent when state changes
  useEffect(() => {
    const newResults = calculateResults(simulationState);
    setResults(newResults);
    
    // Call the parent callback with the new state and results
    onSimulationChange(simulationState, newResults);
  }, [
    simulationState.northTraffic,
    simulationState.eastTraffic,
    simulationState.southTraffic,
    simulationState.westTraffic,
    simulationState.rushHour,
    simulationState.incidentActive,
    simulationState.simulationTime,
    calculateResults,
    onSimulationChange,
  ]);

  const handlePlayPause = () => {
    setSimulationState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));
  };

  const handleReset = () => {
    setSimulationState({
      northTraffic: 50,
      eastTraffic: 50,
      southTraffic: 50,
      westTraffic: 50,
      incidentActive: false,
      rushHour: false,
      simulationTime: 0,
      isRunning: false,
    });
  };

  const handlePreset = (preset: string) => {
    switch (preset) {
      case "normal":
        setSimulationState((prev) => ({
          ...prev,
          northTraffic: 50,
          eastTraffic: 50,
          southTraffic: 50,
          westTraffic: 50,
          rushHour: false,
          incidentActive: false,
        }));
        break;
      case "rush":
        setSimulationState((prev) => ({
          ...prev,
          northTraffic: 80,
          eastTraffic: 75,
          southTraffic: 80,
          westTraffic: 75,
          rushHour: true,
          incidentActive: false,
        }));
        break;
      case "incident":
        setSimulationState((prev) => ({
          ...prev,
          northTraffic: 70,
          eastTraffic: 65,
          southTraffic: 70,
          westTraffic: 60,
          rushHour: false,
          incidentActive: true,
        }));
        break;
      case "heavy":
        setSimulationState((prev) => ({
          ...prev,
          northTraffic: 90,
          eastTraffic: 85,
          southTraffic: 90,
          westTraffic: 85,
          rushHour: true,
          incidentActive: true,
        }));
        break;
    }
  };

  const directions = [
    { key: "northTraffic", label: "North", color: "bg-blue-500" },
    { key: "eastTraffic", label: "East", color: "bg-purple-500" },
    { key: "southTraffic", label: "South", color: "bg-orange-500" },
    { key: "westTraffic", label: "West", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Traffic Scenario Control</CardTitle>
          <CardDescription>Adjust traffic conditions and observe system performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Scenarios */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("normal")}
                className="text-xs"
              >
                Normal Traffic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("rush")}
                className="text-xs"
              >
                Rush Hour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("incident")}
                className="text-xs"
              >
                Incident
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("heavy")}
                className="text-xs"
              >
                Heavy + Incident
              </Button>
            </div>
          </div>

          {/* Traffic Direction Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Traffic Density by Direction (%)</h3>
            {directions.map(({ key, label, color }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-600">{label}</label>
                  <span className={`text-lg font-bold ${color.replace("bg-", "text-")} px-3 py-1 rounded`}>
                    {simulationState[key as keyof SimulationState] as number}%
                  </span>
                </div>
                <Slider
                  value={[simulationState[key as keyof SimulationState] as number]}
                  onValueChange={(value) =>
                    setSimulationState((prev) => ({
                      ...prev,
                      [key]: value[0],
                    }))
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {/* Special Events */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Special Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="rushHour"
                  checked={simulationState.rushHour}
                  onChange={(e) =>
                    setSimulationState((prev) => ({
                      ...prev,
                      rushHour: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="rushHour" className="cursor-pointer text-sm font-medium text-slate-700">
                  Rush Hour Mode
                </label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="incident"
                  checked={simulationState.incidentActive}
                  onChange={(e) =>
                    setSimulationState((prev) => ({
                      ...prev,
                      incidentActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="incident" className="cursor-pointer text-sm font-medium text-slate-700">
                  Active Incident
                </label>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePlayPause}
              className="flex-1 gap-2"
              variant={simulationState.isRunning ? "destructive" : "default"}
            >
              {simulationState.isRunning ? (
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
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* Simulation Time */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Simulation Time:</span>{" "}
              <span className="font-bold text-blue-600">{simulationState.simulationTime}s</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Results */}
      <Card className="shadow-md bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Real-time Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Avg Waiting Time</p>
              <p className="text-2xl font-bold text-blue-600">{results.avgWaitingTime}s</p>
              <p className="text-xs text-slate-500 mt-1">seconds per vehicle</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Avg Queue Length</p>
              <p className="text-2xl font-bold text-purple-600">{results.avgQueueLength}</p>
              <p className="text-xs text-slate-500 mt-1">vehicles</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Throughput</p>
              <p className="text-2xl font-bold text-green-600">{results.throughput}</p>
              <p className="text-xs text-slate-500 mt-1">vehicles/minute</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Total Reward</p>
              <p className="text-2xl font-bold text-orange-600">{results.totalReward}</p>
              <p className="text-xs text-slate-500 mt-1">system score</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Congestion Events</p>
              <p className="text-2xl font-bold text-red-600">{results.congestionEvents}</p>
              <p className="text-xs text-slate-500 mt-1">detected</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Status</p>
              <p className={`text-2xl font-bold ${simulationState.isRunning ? "text-green-600" : "text-slate-400"}`}>
                {simulationState.isRunning ? "Running" : "Paused"}
              </p>
              <p className="text-xs text-slate-500 mt-1">simulation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-sm">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="guide" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guide">Guide</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            </TabsList>
            <TabsContent value="guide" className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>1. Adjust Traffic Density:</strong> Use the sliders to set traffic volume for each direction (0-100%).
              </p>
              <p>
                <strong>2. Enable Special Events:</strong> Check "Rush Hour Mode" or "Active Incident" to simulate challenging conditions.
              </p>
              <p>
                <strong>3. Use Quick Presets:</strong> Click preset buttons to quickly load common traffic scenarios.
              </p>
              <p>
                <strong>4. Play Simulation:</strong> Click "Play" to start the simulation and watch metrics update in real-time.
              </p>
              <p>
                <strong>5. Monitor Performance:</strong> Observe how the RL system adapts to changing traffic conditions.
              </p>
            </TabsContent>
            <TabsContent value="scenarios" className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Normal Traffic</p>
                <p>Balanced traffic flow across all directions. Good baseline for comparison.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Rush Hour</p>
                <p>High traffic density (75-80%) with rush hour mode enabled. Tests system under peak load.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Incident</p>
                <p>Moderate traffic with an active incident. Observes how the system handles disruptions.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Heavy + Incident</p>
                <p>Extreme conditions with high traffic and active incident. Tests system resilience.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
