/**
 * Network Simulation Module
 * Simulates multiple interconnected traffic intersections
 */

export interface IntersectionState {
  id: string;
  name: string;
  x: number; // Grid position X
  y: number; // Grid position Y
  northFlow: number;
  eastFlow: number;
  southFlow: number;
  westFlow: number;
  northQueue: number;
  eastQueue: number;
  southQueue: number;
  westQueue: number;
  northSignal: "red" | "yellow" | "green";
  eastSignal: "red" | "yellow" | "green";
  southSignal: "red" | "yellow" | "green";
  westSignal: "red" | "yellow" | "green";
  totalWaitingTime: number;
  totalThroughput: number;
  efficiency: number;
}

export interface NetworkConnection {
  from: string;
  to: string;
  direction: "north" | "east" | "south" | "west";
  flowInfluence: number; // How much traffic flows from one intersection to another
}

export interface NetworkState {
  intersections: IntersectionState[];
  connections: NetworkConnection[];
  time: number;
  totalVehicles: number;
  networkEfficiency: number;
  averageWaitingTime: number;
}

export interface SimulationConfig {
  gridSize: number; // 2x2, 3x3, etc.
  simulationTime: number;
  strategy: "fixed-time" | "rule-based" | "rl-based";
  trafficIntensity: number; // 0-1
  incidentEnabled: boolean;
  incidentLocation?: string;
}

/**
 * Initialize network with intersections
 */
export function initializeNetwork(
  gridSize: number
): IntersectionState[] {
  const intersections: IntersectionState[] = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      intersections.push({
        id: `intersection_${x}_${y}`,
        name: `Intersection (${x + 1}, ${y + 1})`,
        x,
        y,
        northFlow: Math.random() * 20,
        eastFlow: Math.random() * 20,
        southFlow: Math.random() * 20,
        westFlow: Math.random() * 20,
        northQueue: 0,
        eastQueue: 0,
        southQueue: 0,
        westQueue: 0,
        northSignal: "red",
        eastSignal: "green",
        southSignal: "red",
        westSignal: "green",
        totalWaitingTime: 0,
        totalThroughput: 0,
        efficiency: 0,
      });
    }
  }

  return intersections;
}

/**
 * Create connections between adjacent intersections
 */
export function createNetworkConnections(
  gridSize: number
): NetworkConnection[] {
  const connections: NetworkConnection[] = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const fromId = `intersection_${x}_${y}`;

      // Connect to north intersection
      if (y > 0) {
        connections.push({
          from: fromId,
          to: `intersection_${x}_${y - 1}`,
          direction: "north",
          flowInfluence: 0.3,
        });
      }

      // Connect to east intersection
      if (x < gridSize - 1) {
        connections.push({
          from: fromId,
          to: `intersection_${x + 1}_${y}`,
          direction: "east",
          flowInfluence: 0.3,
        });
      }

      // Connect to south intersection
      if (y < gridSize - 1) {
        connections.push({
          from: fromId,
          to: `intersection_${x}_${y + 1}`,
          direction: "south",
          flowInfluence: 0.3,
        });
      }

      // Connect to west intersection
      if (x > 0) {
        connections.push({
          from: fromId,
          to: `intersection_${x - 1}_${y}`,
          direction: "west",
          flowInfluence: 0.3,
        });
      }
    }
  }

  return connections;
}

/**
 * Simulate one step of network traffic
 */
export function simulateNetworkStep(
  state: NetworkState,
  config: SimulationConfig,
  connections: NetworkConnection[]
): NetworkState {
  const newState: NetworkState = {
    ...state,
    intersections: state.intersections.map((intersection) =>
      simulateIntersectionStep(intersection, config, state.intersections, connections)
    ),
    time: state.time + 1,
  };

  // Apply network flow influence
  newState.intersections = applyNetworkFlowInfluence(
    newState.intersections,
    connections
  );

  // Calculate network metrics
  const totalWaitingTime = newState.intersections.reduce(
    (sum, i) => sum + i.totalWaitingTime,
    0
  );
  const totalThroughput = newState.intersections.reduce(
    (sum, i) => sum + i.totalThroughput,
    0
  );
  const totalVehicles = newState.intersections.reduce(
    (sum, i) =>
      sum +
      i.northQueue +
      i.eastQueue +
      i.southQueue +
      i.westQueue,
    0
  );

  newState.totalVehicles = totalVehicles;
  newState.averageWaitingTime =
    newState.intersections.length > 0
      ? totalWaitingTime / newState.intersections.length
      : 0;
  newState.networkEfficiency =
    totalVehicles > 0 ? totalThroughput / totalVehicles : 0;

  return newState;
}

/**
 * Simulate single intersection step
 */
function simulateIntersectionStep(
  intersection: IntersectionState,
  config: SimulationConfig,
  allIntersections: IntersectionState[],
  connections: NetworkConnection[]
): IntersectionState {
  let updated = { ...intersection };

  // Add new vehicles based on traffic intensity
  updated.northFlow += Math.random() * config.trafficIntensity * 5;
  updated.eastFlow += Math.random() * config.trafficIntensity * 5;
  updated.southFlow += Math.random() * config.trafficIntensity * 5;
  updated.westFlow += Math.random() * config.trafficIntensity * 5;

  // Process vehicles based on signal state
  const northCapacity = updated.northSignal === "green" ? 8 : 0;
  const eastCapacity = updated.eastSignal === "green" ? 8 : 0;
  const southCapacity = updated.southSignal === "green" ? 8 : 0;
  const westCapacity = updated.westSignal === "green" ? 8 : 0;

  // Move vehicles through intersection
  const northThrough = Math.min(updated.northQueue, northCapacity);
  const eastThrough = Math.min(updated.eastQueue, eastCapacity);
  const southThrough = Math.min(updated.southQueue, southCapacity);
  const westThrough = Math.min(updated.westQueue, westCapacity);

  updated.northQueue = Math.max(0, updated.northQueue - northThrough);
  updated.eastQueue = Math.max(0, updated.eastQueue - eastThrough);
  updated.southQueue = Math.max(0, updated.southQueue - southThrough);
  updated.westQueue = Math.max(0, updated.westQueue - westThrough);

  updated.totalThroughput += northThrough + eastThrough + southThrough + westThrough;

  // Add arriving vehicles to queues
  updated.northQueue += updated.northFlow;
  updated.eastQueue += updated.eastFlow;
  updated.southQueue += updated.southFlow;
  updated.westQueue += updated.westFlow;

  // Calculate waiting time
  updated.totalWaitingTime +=
    updated.northQueue +
    updated.eastQueue +
    updated.southQueue +
    updated.westQueue;

  // Update signal based on strategy
  const nsQueue = updated.northQueue + updated.southQueue;
  const ewQueue = updated.eastQueue + updated.westQueue;
  updated = updateSignalStrategy(updated, config.strategy, nsQueue, ewQueue);

  // Calculate efficiency
  const totalQueue =
    updated.northQueue +
    updated.eastQueue +
    updated.southQueue +
    updated.westQueue;
  updated.efficiency = updated.totalThroughput / (totalQueue + 1);

  return updated;
}

/**
 * Update traffic signal based on strategy
 */
function updateSignalStrategy(
  intersection: IntersectionState,
  strategy: string,
  nsQueue: number,
  ewQueue: number
): IntersectionState {
  const updated = { ...intersection };

  switch (strategy) {
    case "fixed-time":
      // Fixed 30 second cycles
      const cycle = Math.floor(intersection.totalWaitingTime / 30) % 2;
      if (cycle === 0) {
        updated.northSignal = "green";
        updated.southSignal = "green";
        updated.eastSignal = "red";
        updated.westSignal = "red";
      } else {
        updated.northSignal = "red";
        updated.southSignal = "red";
        updated.eastSignal = "green";
        updated.westSignal = "green";
      }
      break;

    case "rule-based":
      // Adaptive based on queue length

      if (nsQueue > ewQueue) {
        updated.northSignal = "green";
        updated.southSignal = "green";
        updated.eastSignal = "red";
        updated.westSignal = "red";
      } else {
        updated.northSignal = "red";
        updated.southSignal = "red";
        updated.eastSignal = "green";
        updated.westSignal = "green";
      }
      break;

    case "rl-based":
      // Advanced RL-based strategy
      const totalQueue =
        updated.northQueue +
        updated.eastQueue +
        updated.southQueue +
        updated.westQueue;
      const nsRatio = nsQueue / (totalQueue + 1);

      if (nsRatio > 0.5) {
        updated.northSignal = "green";
        updated.southSignal = "green";
        updated.eastSignal = "red";
        updated.westSignal = "red";
      } else {
        updated.northSignal = "red";
        updated.southSignal = "red";
        updated.eastSignal = "green";
        updated.westSignal = "green";
      }
      break;
  }

  return updated;
}

/**
 * Apply network flow influence between connected intersections
 */
function applyNetworkFlowInfluence(
  intersections: IntersectionState[],
  connections: NetworkConnection[]
): IntersectionState[] {
  const updated = intersections.map((i) => ({ ...i }));
  const intersectionMap = new Map(updated.map((i) => [i.id, i]));

  connections.forEach((connection) => {
    const fromIntersection = intersectionMap.get(connection.from);
    const toIntersection = intersectionMap.get(connection.to);

    if (fromIntersection && toIntersection) {
      // Calculate flow based on direction and signal
      let flowAmount = 0;

      switch (connection.direction) {
        case "north":
          if (fromIntersection.northSignal === "green") {
            flowAmount = Math.min(
              fromIntersection.northQueue * connection.flowInfluence,
              5
            );
            toIntersection.southQueue += flowAmount;
          }
          break;
        case "east":
          if (fromIntersection.eastSignal === "green") {
            flowAmount = Math.min(
              fromIntersection.eastQueue * connection.flowInfluence,
              5
            );
            toIntersection.westQueue += flowAmount;
          }
          break;
        case "south":
          if (fromIntersection.southSignal === "green") {
            flowAmount = Math.min(
              fromIntersection.southQueue * connection.flowInfluence,
              5
            );
            toIntersection.northQueue += flowAmount;
          }
          break;
        case "west":
          if (fromIntersection.westSignal === "green") {
            flowAmount = Math.min(
              fromIntersection.westQueue * connection.flowInfluence,
              5
            );
            toIntersection.eastQueue += flowAmount;
          }
          break;
      }
    }
  });

  return updated;
}

/**
 * Run full network simulation
 */
export function runNetworkSimulation(
  config: SimulationConfig
): NetworkState[] {
  const intersections = initializeNetwork(config.gridSize);
  const connections = createNetworkConnections(config.gridSize);

  let state: NetworkState = {
    intersections,
    connections,
    time: 0,
    totalVehicles: 0,
    networkEfficiency: 0,
    averageWaitingTime: 0,
  };

  const history: NetworkState[] = [state];

  for (let i = 0; i < config.simulationTime; i++) {
    state = simulateNetworkStep(state, config, connections);
    history.push(state);
  }

  return history;
}

/**
 * Calculate network statistics
 */
export function calculateNetworkStats(history: NetworkState[]) {
  const efficiencies = history.map((s) => s.networkEfficiency);
  const waitingTimes = history.map((s) => s.averageWaitingTime);
  const vehicleCounts = history.map((s) => s.totalVehicles);

  return {
    avgEfficiency: efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length,
    maxEfficiency: Math.max(...efficiencies),
    minEfficiency: Math.min(...efficiencies),
    avgWaitingTime: waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length,
    maxWaitingTime: Math.max(...waitingTimes),
    avgVehicles: vehicleCounts.reduce((a, b) => a + b, 0) / vehicleCounts.length,
  };
}
