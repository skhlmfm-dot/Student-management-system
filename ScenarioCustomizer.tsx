import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save } from "lucide-react";

export interface CustomScenario {
  name: string;
  northFlow: number; // 0-100
  eastFlow: number; // 0-100
  southFlow: number; // 0-100
  westFlow: number; // 0-100
  incidentActive: boolean;
  incidentSeverity: number; // 0-100
  incidentLocation: "N" | "E" | "S" | "W";
  peakHourActive: boolean;
  peakHourIntensity: number; // 0-100
  congestionThreshold: number; // 0-100
}

interface ScenarioCustomizerProps {
  onScenarioChange: (scenario: CustomScenario) => void;
}

const defaultScenario: CustomScenario = {
  name: "Custom Scenario",
  northFlow: 50,
  eastFlow: 50,
  southFlow: 50,
  westFlow: 50,
  incidentActive: false,
  incidentSeverity: 50,
  incidentLocation: "N",
  peakHourActive: false,
  peakHourIntensity: 50,
  congestionThreshold: 70,
};

const presetScenarios: Record<string, CustomScenario> = {
  normal: {
    name: "Normal Traffic",
    northFlow: 40,
    eastFlow: 45,
    southFlow: 38,
    westFlow: 42,
    incidentActive: false,
    incidentSeverity: 0,
    incidentLocation: "N",
    peakHourActive: false,
    peakHourIntensity: 0,
    congestionThreshold: 70,
  },
  rushHour: {
    name: "Rush Hour",
    northFlow: 85,
    eastFlow: 90,
    southFlow: 80,
    westFlow: 88,
    incidentActive: false,
    incidentSeverity: 0,
    incidentLocation: "N",
    peakHourActive: true,
    peakHourIntensity: 80,
    congestionThreshold: 70,
  },
  incident: {
    name: "Incident on North",
    northFlow: 30,
    eastFlow: 60,
    southFlow: 50,
    westFlow: 65,
    incidentActive: true,
    incidentSeverity: 75,
    incidentLocation: "N",
    peakHourActive: false,
    peakHourIntensity: 0,
    congestionThreshold: 70,
  },
  heavyIncident: {
    name: "Heavy Traffic + Incident",
    northFlow: 25,
    eastFlow: 85,
    southFlow: 80,
    westFlow: 90,
    incidentActive: true,
    incidentSeverity: 90,
    incidentLocation: "E",
    peakHourActive: true,
    peakHourIntensity: 90,
    congestionThreshold: 70,
  },
};

export default function ScenarioCustomizer({ onScenarioChange }: ScenarioCustomizerProps) {
  const [scenario, setScenario] = useState<CustomScenario>(defaultScenario);
  const [savedScenarios, setSavedScenarios] = useState<Record<string, CustomScenario>>({});

  const handleScenarioChange = (updates: Partial<CustomScenario>) => {
    const newScenario = { ...scenario, ...updates };
    setScenario(newScenario);
    onScenarioChange(newScenario);
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = presetScenarios[presetKey];
    setScenario(preset);
    onScenarioChange(preset);
  };

  const handleSaveScenario = () => {
    const saveName = `Custom_${Date.now()}`;
    setSavedScenarios((prev) => ({
      ...prev,
      [saveName]: scenario,
    }));
  };

  const handleLoadScenario = (scenarioKey: string) => {
    const loaded = savedScenarios[scenarioKey];
    setScenario(loaded);
    onScenarioChange(loaded);
  };

  const handleReset = () => {
    setScenario(defaultScenario);
    onScenarioChange(defaultScenario);
  };

  const getTotalFlow = () => {
    return (
      scenario.northFlow +
      scenario.eastFlow +
      scenario.southFlow +
      scenario.westFlow
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">Preset Scenarios</TabsTrigger>
          <TabsTrigger value="custom">Custom Settings</TabsTrigger>
          <TabsTrigger value="saved">Saved Scenarios</TabsTrigger>
        </TabsList>

        {/* Preset Scenarios Tab */}
        <TabsContent value="presets" className="space-y-4 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Preset Scenarios</CardTitle>
              <CardDescription>
                Select a predefined scenario to quickly test different traffic conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(presetScenarios).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    scenario.name === preset.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{preset.name}</h3>
                    {scenario.name === preset.name && (
                      <Badge className="bg-blue-600">Active</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                    <div>N: {preset.northFlow}%</div>
                    <div>E: {preset.eastFlow}%</div>
                    <div>S: {preset.southFlow}%</div>
                    <div>W: {preset.westFlow}%</div>
                  </div>
                  {preset.incidentActive && (
                    <div className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ Incident: {preset.incidentLocation} ({preset.incidentSeverity}%)
                    </div>
                  )}
                  {preset.peakHourActive && (
                    <div className="text-xs text-orange-600 mt-2 font-medium">
                      📈 Peak Hour: {preset.peakHourIntensity}%
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Settings Tab */}
        <TabsContent value="custom" className="space-y-6 mt-6">
          {/* Traffic Flow Control */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Traffic Flow Control</CardTitle>
              <CardDescription>
                Adjust vehicle flow for each direction (0-100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* North Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    North Direction
                  </label>
                  <span className="text-lg font-bold text-blue-600">
                    {scenario.northFlow}%
                  </span>
                </div>
                <Slider
                  value={[scenario.northFlow]}
                  onValueChange={(value) =>
                    handleScenarioChange({ northFlow: value[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* East Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    East Direction
                  </label>
                  <span className="text-lg font-bold text-purple-600">
                    {scenario.eastFlow}%
                  </span>
                </div>
                <Slider
                  value={[scenario.eastFlow]}
                  onValueChange={(value) =>
                    handleScenarioChange({ eastFlow: value[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* South Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    South Direction
                  </label>
                  <span className="text-lg font-bold text-orange-600">
                    {scenario.southFlow}%
                  </span>
                </div>
                <Slider
                  value={[scenario.southFlow]}
                  onValueChange={(value) =>
                    handleScenarioChange({ southFlow: value[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* West Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    West Direction
                  </label>
                  <span className="text-lg font-bold text-pink-600">
                    {scenario.westFlow}%
                  </span>
                </div>
                <Slider
                  value={[scenario.westFlow]}
                  onValueChange={(value) =>
                    handleScenarioChange({ westFlow: value[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Total Flow Indicator */}
              <div className="bg-slate-100 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Total Traffic Flow
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {getTotalFlow()}%
                  </span>
                </div>
                <div className="w-full bg-slate-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(getTotalFlow() / 4, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Control */}
          <Card className="shadow-md border-red-200">
            <CardHeader>
              <CardTitle className="text-red-900">Incident Control</CardTitle>
              <CardDescription>
                Simulate traffic incidents and disruptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="incident-toggle"
                  checked={scenario.incidentActive}
                  onChange={(e) =>
                    handleScenarioChange({ incidentActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="incident-toggle"
                  className="text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  Enable Incident Simulation
                </label>
              </div>

              {scenario.incidentActive && (
                <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-200">
                  {/* Incident Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Incident Location
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["N", "E", "S", "W"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() =>
                            handleScenarioChange({ incidentLocation: dir })
                          }
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            scenario.incidentLocation === dir
                              ? "bg-red-600 text-white"
                              : "bg-white border border-red-300 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Incident Severity */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Incident Severity
                      </label>
                      <span className="text-lg font-bold text-red-600">
                        {scenario.incidentSeverity}%
                      </span>
                    </div>
                    <Slider
                      value={[scenario.incidentSeverity]}
                      onValueChange={(value) =>
                        handleScenarioChange({ incidentSeverity: value[0] })
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Hour Control */}
          <Card className="shadow-md border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Peak Hour Control</CardTitle>
              <CardDescription>
                Simulate rush hour traffic conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="peak-toggle"
                  checked={scenario.peakHourActive}
                  onChange={(e) =>
                    handleScenarioChange({ peakHourActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="peak-toggle"
                  className="text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  Enable Peak Hour Mode
                </label>
              </div>

              {scenario.peakHourActive && (
                <div className="space-y-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Peak Hour Intensity
                    </label>
                    <span className="text-lg font-bold text-orange-600">
                      {scenario.peakHourIntensity}%
                    </span>
                  </div>
                  <Slider
                    value={[scenario.peakHourIntensity]}
                    onValueChange={(value) =>
                      handleScenarioChange({ peakHourIntensity: value[0] })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune congestion detection threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Congestion Threshold
                </label>
                <span className="text-lg font-bold text-slate-900">
                  {scenario.congestionThreshold}%
                </span>
              </div>
              <Slider
                value={[scenario.congestionThreshold]}
                onValueChange={(value) =>
                  handleScenarioChange({ congestionThreshold: value[0] })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-slate-600 mt-2">
                Queue length above this threshold triggers congestion alerts
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveScenario}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Scenario
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </TabsContent>

        {/* Saved Scenarios Tab */}
        <TabsContent value="saved" className="space-y-4 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Saved Custom Scenarios</CardTitle>
              <CardDescription>
                {Object.keys(savedScenarios).length === 0
                  ? "No saved scenarios yet. Create one in the Custom Settings tab."
                  : `You have ${Object.keys(savedScenarios).length} saved scenario(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(savedScenarios).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No saved scenarios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(savedScenarios).map(([key, saved]) => (
                    <button
                      key={key}
                      onClick={() => handleLoadScenario(key)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        scenario === saved
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {new Date(parseInt(key.split("_")[1])).toLocaleString()}
                        </h3>
                        {scenario === saved && (
                          <Badge className="bg-blue-600">Active</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                        <div>N: {saved.northFlow}%</div>
                        <div>E: {saved.eastFlow}%</div>
                        <div>S: {saved.southFlow}%</div>
                        <div>W: {saved.westFlow}%</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
