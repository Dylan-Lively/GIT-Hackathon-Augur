const BASE_URL = "http://localhost:5173";

export const simulationService = {
  async generate(payload) {
    const { preset, moves, ...stateFields } = payload;

    // Build SimulationRequest matching backend model exactly
    const body = {
      preset,
      horizon:   12,
      maxCombos: 3,
      beamWidth: 5,
      scoringWeights: {
        cashWeight:    0.4,
        profitWeight:  0.4,
        growthWeight:  0.1,
        riskTolerance: 0.1,
      },
      initialState: buildInitialState(preset, stateFields),
    };

    const res = await fetch(`${BASE_URL}/simulate`, {   // â† /simulate not /generate
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${err ? ": " + err : ""} â€” make sure the backend is running on port 8080`);
    }

    const raw = await res.json();
    return transformResult(raw);
  },
};

// â”€â”€â”€ Build typed initialState â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildInitialState(preset, fields) {
  const n = (k) => (fields[k] === "" || fields[k] == null) ? 0 : Number(fields[k]);

  if (preset === "coffee_shop") {
    return {
      type:            "coffee_shop",   // matches @JsonSubTypes name
      cash:            n("cash"),
      monthsElapsed:   0,
      baristas:        n("baristas"),
      hoursOpen:       n("hoursOpen"),
      avgOrderValue:   n("avgOrderValue"),
      marketingSpend:  n("marketingSpend"),
      rent:            n("rent"),
      baristaWage:     n("baristaWage"),
      baseFootTraffic: n("baseFootTraffic"),
      utilityCapacity: n("utilityCapacity"),
    };
  }

  if (preset === "retail_chain") {
    return {
      type:                  "retail_chain",
      cash:                  n("cash"),
      monthsElapsed:         0,
      locations:             n("locations"),
      distributionCenters:   n("distributionCenters"),
      employeesPerLocation:  n("employeesPerLocation"),
      avgBasketSize:         n("avgBasketSize"),
      marketingSpend:        n("marketingSpend"),
      rentPerLocation:       n("rentPerLocation"),
      wagePerEmployee:       n("wagePerEmployee"),
      brandStrength:         n("brandStrength"),
      inventoryTurnover:     n("inventoryTurnover"),
      supplyChainEfficiency: n("supplyChainEfficiency"),
    };
  }

  return { ...fields };
}

// â”€â”€â”€ Transform SimulationResult â†’ tree structure for MainPage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Backend returns:
//   { pathsEvaluated: int, topPaths: Path[] }
//   Path: { id, score, nodes: Node[] }
//   Node: { moves: Move[], state: GameState }
//
// We build a branching tree where each top path is a branch from root.

function transformResult(raw) {
  const paths = raw.topPaths ?? [];
  if (!paths.length) throw new Error("Simulation returned no paths");

  // Root = initial state from first node of first path (before any moves)
  const rootState = paths[0]?.nodes?.[0]?.state ?? {};

  // Move labels = the move applied to reach each depth (from node.moves[0].name)
  const maxDepth  = Math.max(...paths.map(p => p.nodes.length));
  const moveLabels = [];
  for (let d = 0; d < maxDepth; d++) {
    const name = paths[0].nodes[d]?.moves?.[0]?.name ?? `Step ${d + 1}`;
    moveLabels.push(name);
  }

  const VARIANT_NAMES = ["Conservative", "Balanced", "Aggressive"];

  const root = {
    id:       "root",
    depth:    0,
    scores:   stateToScores(rootState),
    total:    Math.round(rootState.cash ?? 0),
    children: [],
    isLeaf:   false,
  };

  // Each path becomes its own branch (linear chain of nodes off root)
  paths.forEach((path, pi) => {
    let parent = root;
    path.nodes.forEach((node, di) => {
      const state  = node.state ?? {};
      const isLeaf = di === path.nodes.length - 1;
      const child  = {
        id:          `p${pi}-d${di}`,
        depth:       di + 1,
        scores:      stateToScores(state),
        total:       Math.round(state.cash ?? 0),
        children:    [],
        isLeaf,
        appliedMove: node.moves?.[0]?.name ?? moveLabels[di] ?? "",
        variantName: VARIANT_NAMES[pi % 3],
        variantIdx:  pi % 3,
        rawScore:    path.score,
      };
      parent.children.push(child);
      parent = child;
    });
  });

  // Mark best child at each branching point
  function markBest(node) {
    if (!node.children.length) return;
    const bestTotal = Math.max(...node.children.map(c => c.total));
    node.children.forEach(c => { c.isBestChild = c.total === bestTotal; markBest(c); });
  }
  markBest(root);

  // Best path = paths[0] (backend already sorted by score descending)
  const bestPathIds = new Set(["root"]);
  paths[0].nodes.forEach((_, di) => bestPathIds.add(`p0-d${di}`));

  const allNodes = flatNodes(root);
  const bestLeaf = allNodes.find(n => n.isLeaf && bestPathIds.has(n.id));

  return { tree: root, bestPathIds, bestLeaf, moves: moveLabels, pathsEvaluated: raw.pathsEvaluated };
}

function stateToScores(s) {
  return {
    cash:          s.cash           ?? 0,
    profit:        s.profit         ?? 0,
    revenue:       s.revenue        ?? s.totalRevenue ?? 0,
    customers:     s.customersServed ?? s.footTrafficPerLocation ?? 0,
    operatingCosts: s.operatingCosts ?? 0,
    runway:        s.runway         ?? 0,
    baristas:      s.baristas       ?? s.employeesPerLocation ?? 0,
    marketing:     s.marketingSpend ?? 0,
  };
}

function flatNodes(n, acc = []) {
  acc.push(n);
  n.children.forEach(c => flatNodes(c, acc));
  return acc;
}