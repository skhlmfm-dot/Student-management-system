import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface Vehicle {
  id: string;
  direction: "N" | "E" | "S" | "W";
  position: number; // 0-100, position in the lane
  speed: number;
}

interface IntersectionState {
  strategy: "Fixed-time" | "Rule-based" | "RL-based";
  northSignal: "red" | "green" | "yellow";
  eastSignal: "red" | "green" | "yellow";
  southSignal: "red" | "green" | "yellow";
  westSignal: "red" | "green" | "yellow";
  vehicles: Vehicle[];
  timestamp: number;
  queueLengths: { N: number; E: number; S: number; W: number };
  waitingTimes: { N: number; E: number; S: number; W: number };
}

// Simulated intersection states for each strategy
const generateIntersectionState = (
  strategy: "Fixed-time" | "Rule-based" | "RL-based",
  time: number,
  customScenario?: IntersectionVisualizerProps["customScenario"]
): IntersectionState => {
  let signals: Record<string, "red" | "green" | "yellow">;
  let vehicles: Vehicle[] = [];
  let queueLengths: Record<string, number>;
  let waitingTimes: Record<string, number>;

  const timeInCycle = time % 60; // 60-second cycle

  if (strategy === "Fixed-time") {
    // Fixed-time: 30s green for N-S, 30s green for E-W
    const isNSGreen = timeInCycle < 30;
    signals = {
      N: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      S: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      E: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      W: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
    };
    
    if (customScenario) {
      const baseQueue = 10;
      queueLengths = {
        N: Math.round((customScenario.northFlow / 100) * baseQueue * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1)),
        E: Math.round((customScenario.eastFlow / 100) * baseQueue * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1)),
        S: Math.round((customScenario.southFlow / 100) * baseQueue * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1)),
        W: Math.round((customScenario.westFlow / 100) * baseQueue * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1)),
      } as Record<string, number>;
      
      if (customScenario.incidentActive && customScenario.incidentLocation === "N") {
        queueLengths.N = Math.round(queueLengths.N * (1 + customScenario.incidentSeverity / 100));
      }
    } else {
      queueLengths = { N: 8, E: 12, S: 7, W: 10 } as Record<string, number>;
    }
    
    waitingTimes = { N: 45, E: 50, S: 42, W: 48 } as Record<string, number>;
  } else if (strategy === "Rule-based") {
    // Rule-based: Adaptive based on queue lengths
    let nQueue = 3 + Math.sin(time / 20) * 2;
    let eQueue = 4 + Math.cos(time / 15) * 2;
    let sQueue = 2 + Math.sin(time / 25) * 2;
    let wQueue = 3.5 + Math.cos(time / 18) * 2;

    if (customScenario) {
      const flowMultiplier = 0.1;
      nQueue = (customScenario.northFlow / 100) * 5 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      eQueue = (customScenario.eastFlow / 100) * 5 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      sQueue = (customScenario.southFlow / 100) * 5 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      wQueue = (customScenario.westFlow / 100) * 5 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      
      if (customScenario.incidentActive) {
        const incidentDir = customScenario.incidentLocation;
        const incidentImpact = 1 + customScenario.incidentSeverity / 100;
        if (incidentDir === "N") nQueue *= incidentImpact;
        if (incidentDir === "E") eQueue *= incidentImpact;
        if (incidentDir === "S") sQueue *= incidentImpact;
        if (incidentDir === "W") wQueue *= incidentImpact;
      }
    }

    const isNSGreen = nQueue > eQueue;

    signals = {
      N: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      S: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      E: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      W: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
    };
    queueLengths = { N: Math.round(nQueue), E: Math.round(eQueue), S: Math.round(sQueue), W: Math.round(wQueue) } as Record<string, number>;
    waitingTimes = { N: 20, E: 25, S: 18, W: 22 } as Record<string, number>;
  } else {
    // RL-based: Optimal adaptive control
    let nQueue = 2 + Math.sin(time / 22) * 1.5;
    let eQueue = 2.5 + Math.cos(time / 20) * 1.5;
    let sQueue = 1.5 + Math.sin(time / 25) * 1;
    let wQueue = 2 + Math.cos(time / 23) * 1.5;

    if (customScenario) {
      nQueue = (customScenario.northFlow / 100) * 4 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      eQueue = (customScenario.eastFlow / 100) * 4 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      sQueue = (customScenario.southFlow / 100) * 4 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      wQueue = (customScenario.westFlow / 100) * 4 * (customScenario.peakHourActive ? 1 + customScenario.peakHourIntensity / 100 : 1);
      
      if (customScenario.incidentActive) {
        const incidentDir = customScenario.incidentLocation;
        const incidentImpact = 1 + (customScenario.incidentSeverity / 100) * 0.5; // Less severe impact for RL
        if (incidentDir === "N") nQueue *= incidentImpact;
        if (incidentDir === "E") eQueue *= incidentImpact;
        if (incidentDir === "S") sQueue *= incidentImpact;
        if (incidentDir === "W") wQueue *= incidentImpact;
      }
    }

    const isNSGreen = nQueue > eQueue;

    signals = {
      N: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      S: isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      E: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
      W: !isNSGreen ? "green" : timeInCycle > 28 ? "yellow" : "red",
    };
    queueLengths = { N: Math.round(nQueue), E: Math.round(eQueue), S: Math.round(sQueue), W: Math.round(wQueue) } as Record<string, number>;
    waitingTimes = { N: 15, E: 18, S: 14, W: 16 } as Record<string, number>;
  }

  // Generate vehicles based on queue lengths with realistic motion
  const directions: Array<"N" | "E" | "S" | "W"> = ["N", "E", "S", "W"];
  let vehicleId = 0;

  directions.forEach((dir) => {
    const queueLength = queueLengths[dir];
    const signal = signals[dir];
    
    // Calculate speed based on signal state
    let baseSpeed = 0;
    let acceleration = 0;
    
    if (signal === "green") {
      baseSpeed = 1.2; // Fast movement when green
      acceleration = 0.05;
    } else if (signal === "yellow") {
      baseSpeed = 0.4; // Slow down when yellow
      acceleration = -0.1;
    } else {
      baseSpeed = 0; // Stop when red
      acceleration = 0;
    }
    
    for (let i = 0; i < queueLength; i++) {
      // Add realistic variation to vehicle speeds
      const speedVariation = (Math.random() - 0.5) * 0.3;
      const speed = Math.max(0, baseSpeed + speedVariation + acceleration * (time % 30));
      
      // Calculate position with smooth motion
      const distanceTraveled = signal === "green" ? (time * speed) % 120 : 0;
      const position = Math.max(0, 95 - i * 10 - distanceTraveled);
      
      vehicles.push({
        id: `${strategy}-${dir}-${vehicleId}`,
        direction: dir,
        position,
        speed: Math.max(0, speed),
      });
      vehicleId++;
    }
  });

  return {
    strategy,
    northSignal: signals.N as "red" | "green" | "yellow",
    eastSignal: signals.E as "red" | "green" | "yellow",
    southSignal: signals.S as "red" | "green" | "yellow",
    westSignal: signals.W as "red" | "green" | "yellow",
    vehicles,
    timestamp: time,
    queueLengths: queueLengths as { N: number; E: number; S: number; W: number },
    waitingTimes: waitingTimes as { N: number; E: number; S: number; W: number },
  };
};

interface IntersectionVisualizerProps {
  strategy: "Fixed-time" | "Rule-based" | "RL-based";
  animationTime: number;
  customScenario?: {
    northFlow: number;
    eastFlow: number;
    southFlow: number;
    westFlow: number;
    incidentActive: boolean;
    incidentSeverity: number;
    incidentLocation: "N" | "E" | "S" | "W";
    peakHourActive: boolean;
    peakHourIntensity: number;
  };
}

function IntersectionVisualizerComponent({ strategy, animationTime, customScenario }: IntersectionVisualizerProps) {
  const { t } = useLanguage();
  const state = generateIntersectionState(strategy, animationTime, customScenario);

  const getSignalColor = (signal: "red" | "green" | "yellow") => {
    switch (signal) {
      case "red":
        return "#ef4444";
      case "green":
        return "#22c55e";
      case "yellow":
        return "#eab308";
    }
  };

  const getDirectionLabel = (dir: "N" | "E" | "S" | "W") => {
    const labels = { N: "North", E: "East", S: "South", W: "West" };
    return labels[dir];
  };

  const getSignal = (dir: "N" | "E" | "S" | "W") => {
    const signals: Record<string, "red" | "green" | "yellow"> = {
      N: state.northSignal,
      E: state.eastSignal,
      S: state.southSignal,
      W: state.westSignal,
    };
    return signals[dir];
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Intersection SVG */}
      <div className="bg-white rounded-lg border border-slate-200 p-2 md:p-4 flex justify-center overflow-x-auto">
        <svg width="400" height="400" viewBox="0 0 500 500" className="max-w-full md:w-full" style={{minWidth: '300px'}}>
          {/* Road Background */}
          <rect x="0" y="0" width="500" height="500" fill="#f5f5f5" />

          {/* Horizontal Road */}
          <rect x="0" y="200" width="500" height="100" fill="#333333" />

          {/* Vertical Road */}
          <rect x="200" y="0" width="100" height="500" fill="#333333" />

          {/* Road Lane Markings */}
          <line x1="0" y1="225" x2="500" y2="225" stroke="#ffff00" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="225" y1="0" x2="225" y2="500" stroke="#ffff00" strokeWidth="2" strokeDasharray="10,10" />

          {/* Traffic Lights - North */}
          <g>
            <rect x="220" y="80" width="60" height="80" fill="#222222" rx="5" />
            <circle cx="250" cy="100" r="12" fill={getSignalColor(state.northSignal)} />
            <circle cx="250" cy="130" r="12" fill={state.northSignal === "yellow" ? "#eab308" : "#444444"} />
            <circle cx="250" cy="160" r="12" fill={state.northSignal === "red" ? "#ef4444" : "#444444"} />
          </g>

          {/* Traffic Lights - East */}
          <g>
            <rect x="340" y="220" width="80" height="60" fill="#222222" rx="5" />
            <circle cx="360" cy="250" r="12" fill={getSignalColor(state.eastSignal)} />
            <circle cx="390" cy="250" r="12" fill={state.eastSignal === "yellow" ? "#eab308" : "#444444"} />
            <circle cx="420" cy="250" r="12" fill={state.eastSignal === "red" ? "#ef4444" : "#444444"} />
          </g>

          {/* Traffic Lights - South */}
          <g>
            <rect x="220" y="340" width="60" height="80" fill="#222222" rx="5" />
            <circle cx="250" cy="360" r="12" fill={getSignalColor(state.southSignal)} />
            <circle cx="250" cy="390" r="12" fill={state.southSignal === "yellow" ? "#eab308" : "#444444"} />
            <circle cx="250" cy="420" r="12" fill={state.southSignal === "red" ? "#ef4444" : "#444444"} />
          </g>

          {/* Traffic Lights - West */}
          <g>
            <rect x="80" y="220" width="80" height="60" fill="#222222" rx="5" />
            <circle cx="100" cy="250" r="12" fill={getSignalColor(state.westSignal)} />
            <circle cx="130" cy="250" r="12" fill={state.westSignal === "yellow" ? "#eab308" : "#444444"} />
            <circle cx="160" cy="250" r="12" fill={state.westSignal === "red" ? "#ef4444" : "#444444"} />
          </g>

          {/* Vehicles - North Lane */}
          {state.vehicles
            .filter((v) => v.direction === "N")
            .map((vehicle) => {
              const yPos = 250 - vehicle.position * 2;
              const opacity = vehicle.speed > 0 ? 1 : 0.7;
              return (
                <g key={vehicle.id} opacity={opacity}>
                  <rect
                    x={220}
                    y={yPos}
                    width="30"
                    height="15"
                    fill="#3b82f6"
                    rx="3"
                    style={{
                      transition: `y ${0.1}s linear`,
                      filter: vehicle.speed > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }}
                  />
                  {/* Vehicle indicator light */}
                  <circle cx="235" cy={yPos + 7.5} r="2" fill={vehicle.speed > 0.5 ? '#10b981' : '#ef4444'} />
                </g>
              );
            })}

          {/* Vehicles - East Lane */}
          {state.vehicles
            .filter((v) => v.direction === "E")
            .map((vehicle) => {
              const xPos = 250 + vehicle.position * 2;
              const opacity = vehicle.speed > 0 ? 1 : 0.7;
              return (
                <g key={vehicle.id} opacity={opacity}>
                  <rect
                    x={xPos}
                    y={220}
                    width="15"
                    height="30"
                    fill="#8b5cf6"
                    rx="3"
                    style={{
                      transition: `x ${0.1}s linear`,
                      filter: vehicle.speed > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }}
                  />
                  <circle cx={xPos + 7.5} cy="235" r="2" fill={vehicle.speed > 0.5 ? '#10b981' : '#ef4444'} />
                </g>
              );
            })}

          {/* Vehicles - South Lane */}
          {state.vehicles
            .filter((v) => v.direction === "S")
            .map((vehicle) => {
              const yPos = 250 + vehicle.position * 2;
              const opacity = vehicle.speed > 0 ? 1 : 0.7;
              return (
                <g key={vehicle.id} opacity={opacity}>
                  <rect
                    x={220}
                    y={yPos}
                    width="30"
                    height="15"
                    fill="#f97316"
                    rx="3"
                    style={{
                      transition: `y ${0.1}s linear`,
                      filter: vehicle.speed > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }}
                  />
                  <circle cx="235" cy={yPos + 7.5} r="2" fill={vehicle.speed > 0.5 ? '#10b981' : '#ef4444'} />
                </g>
              );
            })}

          {/* Vehicles - West Lane */}
          {state.vehicles
            .filter((v) => v.direction === "W")
            .map((vehicle) => {
              const xPos = 250 - vehicle.position * 2;
              const opacity = vehicle.speed > 0 ? 1 : 0.7;
              return (
                <g key={vehicle.id} opacity={opacity}>
                  <rect
                    x={xPos}
                    y={220}
                    width="15"
                    height="30"
                    fill="#06b6d4"
                    rx="3"
                    style={{
                      transition: `x ${0.1}s linear`,
                      filter: vehicle.speed > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }}
                  />
                  <circle cx={xPos + 7.5} cy="235" r="2" fill={vehicle.speed > 0.5 ? '#10b981' : '#ef4444'} />
                </g>
              );
            })}
        </svg>
      </div>

      {/* Signal Status and Queue Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {(["N", "E", "S", "W"] as const).map((dir) => (
          <div key={dir} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-sm font-semibold text-slate-700 mb-2">{getDirectionLabel(dir)}</div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-slate-300"
                style={{ backgroundColor: getSignalColor(getSignal(dir)) }}
              />
              <span className="text-xs font-medium text-slate-600 capitalize">{getSignal(dir)}</span>
            </div>
            <div className="text-xs text-slate-600">
              <div>{t("chart.queueLength")}: {state.queueLengths[dir]} {t("common.vehicles")}</div>
              <div>{t("viz.waitingTime")}: {state.waitingTimes[dir]}s</div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 md:p-4 border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div>
            <div className="text-xs text-slate-600 font-medium">{t("chart.queueLength")}</div>
            <div className="text-lg font-bold text-slate-900">
              {Object.values(state.queueLengths).reduce((a, b) => a + b, 0)} {t("common.vehicles")}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 font-medium">{t("chart.avgWaitingTime")}</div>
            <div className="text-lg font-bold text-slate-900">
              {(Object.values(state.waitingTimes).reduce((a, b) => a + b, 0) / 4).toFixed(1)}s
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 font-medium">{t("chart.queueLength")}</div>
            <div className="text-lg font-bold text-slate-900">
              {Math.max(...Object.values(state.queueLengths))} {t("common.vehicles")}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 font-medium">{t("chart.strategy")}</div>
            <div className="text-lg font-bold text-slate-900">{strategy}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IntersectionVisualizerExportProps {
  customScenario?: IntersectionVisualizerProps["customScenario"];
}

export default function IntersectionVisualizer({ customScenario }: IntersectionVisualizerExportProps = {}) {
  const { t } = useLanguage();
  const [animationTime, setAnimationTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setAnimationTime((prev) => (prev + 0.5) % 120);
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{t("visualization.title")}</CardTitle>
          <CardDescription>
            {t("visualization.title")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="RL-based" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="Fixed-time">{t("strategy.fixedTime")}</TabsTrigger>
              <TabsTrigger value="Rule-based">{t("strategy.ruleBased")}</TabsTrigger>
              <TabsTrigger value="RL-based">{t("strategy.rlBased")}</TabsTrigger>
            </TabsList>

            {(["Fixed-time", "Rule-based", "RL-based"] as const).map((strategy) => (
              <TabsContent key={strategy} value={strategy} className="space-y-4">
                <IntersectionVisualizerComponent strategy={strategy} animationTime={animationTime} customScenario={customScenario} />
              </TabsContent>
            ))}
          </Tabs>

          {/* Animation Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {isAnimating ? t("viz.pause") : t("viz.play")}
            </button>
            <button
              onClick={() => setAnimationTime(0)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Reset
            </button>
            <div className="text-sm text-slate-600 font-medium">Time: {animationTime.toFixed(1)}s</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
