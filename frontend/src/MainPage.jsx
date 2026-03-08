import { useEffect, useMemo, useState, useRef } from "react";

const PATH_PALETTE = [
    { path: "#F59E0B", glow: "rgba(245,158,11,0.3)", badge: "rgba(120,53,15,0.5)", border: "#b45309", tag: "#FDE68A" },
    { path: "#60A5FA", glow: "rgba(96,165,250,0.3)", badge: "rgba(30,58,138,0.5)", border: "#1d4ed8", tag: "#BFDBFE" },
    { path: "#A78BFA", glow: "rgba(167,139,250,0.3)", badge: "rgba(88,28,135,0.5)", border: "#7c3aed", tag: "#DDD6FE" },
];

const RANK_LABELS = ["🥇 Best Path", "🥈 Second Path", "🥉 Third Path"];
const GENERATE_STATUS = { idle: "idle", growing: "growing", done: "done" };

function mapBackendPaths(topPaths) {
    const LABELS = ["Aggressive Growth", "Balanced Expansion", "Conservative Pivot"];

    return topPaths.map((path, i) => {
        const finalState = path.nodes[path.nodes.length - 1].state;

        const allMoveNames = [
            ...new Set(
                path.nodes.flatMap((node) => node.moves.map((m) => `${m.icon} ${m.name}`))
            ),
        ].join(", ");

        return {
            rank: i + 1,
            label: LABELS[i] ?? `Path ${i + 1}`,
            pathScore: Math.round(path.score),
            endNode: {
                score: Math.round(path.score),
                finalCash: `$${Math.round(finalState.cash).toLocaleString()}`,
                monthlyProfit: `$${Math.round(finalState.profit).toLocaleString()}/mo`,
                runway: finalState.runway < 999 ? `${finalState.runway.toFixed(1)} mo` : "∞",
                moves: allMoveNames || "No moves",
            },
        };
    });
}

function buildTree() {
    const nodes = [];
    const edges = [];
    let nextFakeId = 200;
    const STEP = 140;

    nodes.push({ id: 0, depth: 0, x: 0, y: 0, score: 100, pathRank: -1, inBestPaths: true, isEndNode: false });

    const p0 = [
        { id: 1, depth: 1, x: -560, y: STEP * 1 },
        { id: 2, depth: 2, x: -590, y: STEP * 2 },
        { id: 3, depth: 3, x: -560, y: STEP * 3 },
        { id: 4, depth: 4, x: -540, y: STEP * 4 },
        { id: 5, depth: 5, x: -530, y: STEP * 5 },
    ];
    p0.forEach((n, i) => nodes.push({ ...n, score: [88, 76, 82, 79, 94][i], pathRank: 0, inBestPaths: true, isEndNode: i === 4 }));
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]].forEach(([f, t], i) =>
        edges.push({ from: f, to: t, score: [72, 68, 77, 81, 88][i], pathRank: 0 }));

    const p1 = [
        { id: 6, depth: 1, x: 0, y: STEP * 1 },
        { id: 7, depth: 2, x: 20, y: STEP * 2 },
        { id: 8, depth: 3, x: 10, y: STEP * 3 },
        { id: 9, depth: 4, x: 5, y: STEP * 4 },
        { id: 10, depth: 5, x: 0, y: STEP * 5 },
    ];
    p1.forEach((n, i) => nodes.push({ ...n, score: [73, 68, 71, 65, 81][i], pathRank: 1, inBestPaths: true, isEndNode: i === 4 }));
    [[0, 6], [6, 7], [7, 8], [8, 9], [9, 10]].forEach(([f, t], i) =>
        edges.push({ from: f, to: t, score: [65, 59, 63, 70, 74][i], pathRank: 1 }));

    const p2 = [
        { id: 11, depth: 1, x: 560, y: STEP * 1 },
        { id: 12, depth: 2, x: 590, y: STEP * 2 },
        { id: 13, depth: 3, x: 560, y: STEP * 3 },
        { id: 14, depth: 4, x: 540, y: STEP * 4 },
        { id: 15, depth: 5, x: 530, y: STEP * 5 },
    ];
    p2.forEach((n, i) => nodes.push({ ...n, score: [61, 58, 63, 55, 67][i], pathRank: 2, inBestPaths: true, isEndNode: i === 4 }));
    [[0, 11], [11, 12], [12, 13], [13, 14], [14, 15]].forEach(([f, t], i) =>
        edges.push({ from: f, to: t, score: [54, 48, 55, 51, 58][i], pathRank: 2 }));

    function fake(parentId, depth, x, y) {
        const id = nextFakeId++;
        nodes.push({ id, depth, x, y, score: Math.floor(Math.random() * 46) + 20, pathRank: -1, inBestPaths: false, isEndNode: false });
        edges.push({ from: parentId, to: id, score: Math.floor(Math.random() * 46) + 15, pathRank: -1 });
        return id;
    }

    const f1a = fake(0, 1, -840, STEP * 1); const f1b = fake(0, 1, -280, STEP * 1);
    const f1c = fake(0, 1, 280, STEP * 1); const f1d = fake(0, 1, 840, STEP * 1);

    const f2a = fake(1, 2, -760, STEP * 2); const f2b = fake(1, 2, -420, STEP * 2);
    const f2c = fake(f1a, 2, -980, STEP * 2); const f2d = fake(f1a, 2, -700, STEP * 2);
    const f2e = fake(f1b, 2, -320, STEP * 2); const f2f = fake(f1b, 2, -160, STEP * 2);
    const f2g = fake(6, 2, -120, STEP * 2); const f2h = fake(6, 2, 160, STEP * 2);
    const f2i = fake(f1c, 2, 200, STEP * 2); const f2j = fake(f1c, 2, 380, STEP * 2);
    const f2k = fake(11, 2, 720, STEP * 2); const f2l = fake(11, 2, 460, STEP * 2);
    const f2m = fake(f1d, 2, 860, STEP * 2); const f2n = fake(f1d, 2, 1020, STEP * 2);

    const f3a = fake(f2a, 3, -820, STEP * 3); const f3b = fake(f2a, 3, -700, STEP * 3);
    const f3c = fake(f2b, 3, -440, STEP * 3); const f3d = fake(f2b, 3, -360, STEP * 3);
    const f3e = fake(f2c, 3, -1020, STEP * 3); const f3f = fake(f2d, 3, -740, STEP * 3);
    const f3g = fake(f2e, 3, -300, STEP * 3); const f3h = fake(f2f, 3, -180, STEP * 3);
    const f3i = fake(f2g, 3, -130, STEP * 3); const f3j = fake(f2h, 3, 170, STEP * 3);
    const f3k = fake(f2i, 3, 220, STEP * 3); const f3l = fake(f2j, 3, 390, STEP * 3);
    const f3m = fake(f2k, 3, 730, STEP * 3); const f3n = fake(f2l, 3, 470, STEP * 3);
    const f3o = fake(f2m, 3, 880, STEP * 3); const f3p = fake(f2n, 3, 1040, STEP * 3);

    const f4a = fake(f3a, 4, -840, STEP * 4); const f4b = fake(f3b, 4, -700, STEP * 4);
    const f4c = fake(f3c, 4, -450, STEP * 4); const f4d = fake(f3d, 4, -360, STEP * 4);
    const f4e = fake(f3e, 4, -1030, STEP * 4); const f4f = fake(f3f, 4, -750, STEP * 4);
    const f4g = fake(f3g, 4, -310, STEP * 4); const f4h = fake(f3h, 4, -185, STEP * 4);
    const f4i = fake(f3i, 4, -135, STEP * 4); const f4j = fake(f3j, 4, 175, STEP * 4);
    const f4k = fake(f3k, 4, 230, STEP * 4); const f4l = fake(f3l, 4, 400, STEP * 4);
    const f4m = fake(f3m, 4, 740, STEP * 4); const f4n = fake(f3n, 4, 480, STEP * 4);
    const f4o = fake(f3o, 4, 890, STEP * 4); const f4p = fake(f3p, 4, 1050, STEP * 4);

    [f4a, f4b, f4c, f4d, f4e, f4f, f4g, f4h, f4i, f4j, f4k, f4l, f4m, f4n, f4o, f4p].forEach((pid) => {
        const px = nodes.find(n => n.id === pid)?.x ?? 0;
        fake(pid, 5, px - 30, STEP * 5);
        fake(pid, 5, px + 30, STEP * 5);
    });

    return { nodes, edges, endNodeIds: new Set([5, 10, 15]) };
}

function scoreColor(s) {
    if (s >= 75) return "#4ADE80";
    if (s >= 50) return "#FACC15";
    return "#F87171";
}

function EndNodeTooltip({ node, pathData, mousePos, containerRef }) {
    if (!node || !mousePos || !pathData) return null;

    const pos = mousePos;

    const pal = PATH_PALETTE[pathData.rank - 1];
    const en = pathData.endNode;
    const tooltipW = 260;
    const containerW = containerRef.current?.offsetWidth || 800;
    let tx = pos.x + 20;
    let ty = pos.y - 180;
    if (tx + tooltipW > containerW - 8) tx = pos.x - tooltipW - 20;
    if (ty < 8) ty = 8;

    const metrics = [
        { label: "Final Cash", value: en.finalCash, color: "#4ADE80" },
        { label: "Monthly Profit", value: en.monthlyProfit, color: en.monthlyProfit?.startsWith("$-") ? "#F87171" : "#60A5FA" },
        { label: "Runway", value: en.runway, color: "#A78BFA" },
        { label: "Moves Applied", value: en.moves, color: "#FACC15" },
    ];

    return (
        <div style={{
            position: "absolute", left: tx, top: ty, width: tooltipW,
            zIndex: 300, pointerEvents: "none",
            animation: "tooltipFade 0.16s ease-out forwards",
            fontFamily: "'Courier New', monospace",
        }}>
            <div style={{
                background: "rgba(4,10,22,0.98)",
                border: `1.5px solid ${pal.border}`,
                borderRadius: 16, padding: "16px 18px",
                boxShadow: `0 0 32px ${pal.glow}, 0 12px 40px rgba(0,0,0,0.85)`,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{
                        fontSize: 9, fontWeight: 700, color: pal.tag,
                        background: pal.badge, border: `1px solid ${pal.border}`,
                        borderRadius: 6, padding: "3px 8px", letterSpacing: "0.07em",
                        textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                        {RANK_LABELS[pathData.rank - 1]}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pathData.label}
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                        Simulation Score
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: scoreColor(en.score), textShadow: `0 0 20px ${scoreColor(en.score)}55` }}>
                            {en.score}
                        </span>
                        <span style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>/100</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ width: `${en.score}%`, height: "100%", background: scoreColor(en.score), borderRadius: 4, boxShadow: `0 0 8px ${scoreColor(en.score)}88` }} />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 10px" }}>
                    {metrics.map(({ label, value, color }) => (
                        <div key={label} style={{
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 8, padding: "8px 10px",
                            gridColumn: label === "Moves Applied" ? "1 / -1" : "auto",
                        }}>
                            <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                                {label}
                            </div>
                            <div style={{ fontSize: label === "Moves Applied" ? 10 : 12, fontWeight: 700, color, whiteSpace: label === "Moves Applied" ? "normal" : "nowrap", lineHeight: 1.4 }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>Path Score</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: pal.tag }}>{pathData.pathScore} pts</span>
                </div>
            </div>
        </div>
    );
}

export default function MainPage({ onGenerate }) {
    const [status, setStatus] = useState(GENERATE_STATUS.idle);
    const [visibleDepth, setVisibleDepth] = useState(0);
    const [scale, setScale] = useState(1);
    const [tree, setTree] = useState(null);
    const [showPaths, setShowPaths] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [backendPaths, setBackendPaths] = useState([]);
    const [pathsEvaluated, setPathsEvaluated] = useState(0);
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState(null);

    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const maxDepth = 5;

    const handleGenerate = async () => {
        setApiError(null);
        setLoading(true);
        setShowPaths(false);
        setHoveredNode(null);

        try {
            const data = await onGenerate();
            const mapped = mapBackendPaths(data.topPaths);
            setBackendPaths(mapped);
            setPathsEvaluated(data.pathsEvaluated);
            setTree(buildTree());
            setStatus(GENERATE_STATUS.growing);
            setVisibleDepth(0);
            setScale(1.15);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status !== GENERATE_STATUS.growing) return;
        if (visibleDepth >= maxDepth) {
            const t = setTimeout(() => {
                setStatus(GENERATE_STATUS.done);
                setTimeout(() => setShowPaths(true), 400);
            }, 250);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            setVisibleDepth(p => p + 1);
            setScale(p => Math.max(0.38, p - 0.14));
        }, 1000);
        return () => clearTimeout(t);
    }, [visibleDepth, status]);

    const nodes = tree?.nodes ?? [];
    const edges = tree?.edges ?? [];
    const endNodeIds = tree?.endNodeIds ?? new Set();

    const visibleNodes = useMemo(() => nodes.filter(n => n.depth <= visibleDepth), [nodes, visibleDepth]);
    const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
    const visibleEdges = useMemo(() => edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)), [edges, visibleNodeIds]);

    const hoveredPathData = useMemo(() => {
        if (!hoveredNode || !backendPaths.length) return null;
        const idx = [5, 10, 15].indexOf(hoveredNode.id);
        return idx === -1 ? null : backendPaths[idx];
    }, [hoveredNode, backendPaths]);

    const rootVisible = status !== GENERATE_STATUS.idle;

    const getNodeStyle = (node) => {
        const isRoot = node.depth === 0;
        const pal = node.pathRank >= 0 ? PATH_PALETTE[node.pathRank] : null;
        const isHov = hoveredNode?.id === node.id;
        if (isRoot) return { fill: "#1E3A5F", stroke: "#60A5FA", inner: "#DBEAFE" };
        if (pal) return { fill: isHov ? "#1a1035" : "#0d0a1f", stroke: isHov ? pal.tag : pal.path, inner: pal.path };
        return { fill: "#060b14", stroke: "#0f1a28", inner: "#0f1a28" };
    };

    return (
        <div
            className="min-h-screen text-white overflow-hidden relative"
            style={{ background: "radial-gradient(ellipse at 20% 20%, #0a1628 0%, #060d1a 60%, #000408 100%)", fontFamily: "'Courier New', monospace" }}
        >
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)`,
                backgroundSize: "40px 40px",
            }} />

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">

                <div className="mb-6 text-center">
                    <div className="inline-block mb-3 px-3 py-1 rounded border border-blue-800 bg-blue-950/40 text-blue-400 text-xs tracking-widest uppercase">
                        Strategic Decision Engine
                    </div>
                    <h1 className="text-4xl font-black tracking-tight" style={{
                        background: "linear-gradient(135deg,#fff 30%,#60a5fa 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em",
                    }}>
                        Move Tree Analysis
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 tracking-wide">
                        Top 3 strategic paths highlighted.{" "}
                        <span className="text-blue-400">Hover the glowing end node</span> of each path for full analysis.
                    </p>
                    {pathsEvaluated > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                            {pathsEvaluated.toLocaleString()} paths evaluated by simulation engine
                        </p>
                    )}
                </div>

                {apiError && (
                    <div className="mb-4 px-5 py-3 rounded-xl border border-red-800 bg-red-950/40 text-red-400 text-sm">
                        ⚠ {apiError} — make sure the backend is running on port 8080
                    </div>
                )}

                {showPaths && backendPaths.length > 0 && (
                    <div className="mb-4 flex gap-3 flex-wrap justify-center" style={{ animation: "slideDown 0.5s ease-out forwards" }}>
                        {backendPaths.map((bp, i) => {
                            const pal = PATH_PALETTE[i];
                            return (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: pal.badge, border: `1px solid ${pal.border}`,
                                    borderRadius: 10, padding: "6px 14px",
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: pal.path, boxShadow: `0 0 6px ${pal.path}` }} />
                                    <span style={{ fontSize: 11, color: pal.tag, fontWeight: 700, letterSpacing: "0.05em" }}>{RANK_LABELS[i]}</span>
                                    <span style={{ fontSize: 10, color: "#64748b" }}>{bp.label}</span>
                                    <span style={{ fontSize: 11, color: pal.tag, fontWeight: 800, marginLeft: 4 }}>{bp.pathScore} pts</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="relative h-[78vh] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl"
                    style={{ background: "rgba(6,13,26,0.85)", backdropFilter: "blur(12px)" }}
                    onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                >
                    <EndNodeTooltip node={hoveredNode} pathData={hoveredPathData} mousePos={mousePos} containerRef={containerRef} />

                    <div
                        className="absolute left-1/2 top-20 transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}
                    >
                        <svg ref={svgRef} width="2600" height="1800" viewBox="-1300 -40 2600 1800" className="overflow-visible">

                            {visibleEdges.map((edge, idx) => {
                                const from = nodes.find(n => n.id === edge.from);
                                const to = nodes.find(n => n.id === edge.to);
                                if (!from || !to) return null;

                                const midY = (from.y + to.y) / 2;
                                const d = `M ${from.x} ${from.y + 20} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 20}`;
                                const isNew = to.depth === visibleDepth;
                                const rank = edge.pathRank ?? -1;
                                const pal = rank >= 0 ? PATH_PALETTE[rank] : null;
                                const midX = (from.x + to.x) / 2;

                                return (
                                    <g key={`e-${idx}`}>
                                        {pal && <path d={d} fill="none" stroke={pal.glow} strokeWidth="8" strokeLinecap="round" />}
                                        <path
                                            d={d} fill="none"
                                            stroke={pal ? pal.path : "rgba(15,26,40,0.9)"}
                                            strokeWidth={pal ? "2.5" : "1"}
                                            strokeLinecap="round"
                                            className={isNew ? "animate-[draw_1.8s_ease-out_forwards]" : ""}
                                            pathLength="1" strokeDasharray="1"
                                            strokeDashoffset={isNew ? "1" : "0"}
                                        />
                                        {pal && (
                                            <>
                                                <rect x={midX - 13} y={midY - 17} width="26" height="14" rx="4"
                                                    fill="rgba(4,10,22,0.92)" stroke={pal.border} strokeWidth="1" />
                                                <text x={midX} y={midY - 6} textAnchor="middle" fontSize="8"
                                                    fontFamily="'Courier New', monospace" fontWeight="bold" fill={pal.path}>
                                                    {edge.score}
                                                </text>
                                            </>
                                        )}
                                    </g>
                                );
                            })}

                            {visibleNodes.map((node) => {
                                const isRoot = node.depth === 0; {/* ← fixed: declared here */ }
                                const colors = getNodeStyle(node);
                                const isEndNode = endNodeIds.has(node.id);
                                const inPath = node.inBestPaths;
                                const pal = node.pathRank >= 0 ? PATH_PALETTE[node.pathRank] : null;
                                const isHov = hoveredNode?.id === node.id;
                                const r = isRoot ? 32 : inPath ? 22 : 8;

                                return (
                                    <g
                                        key={`n-${node.id}`}
                                        className="animate-[pop_0.3s_ease-out_forwards] opacity-0"
                                        style={{ transformOrigin: `${node.x}px ${node.y}px`, cursor: isEndNode ? "pointer" : "default" }}
                                        onMouseEnter={() => isEndNode && setHoveredNode(node)}
                                        onMouseLeave={() => isEndNode && setHoveredNode(null)}
                                    >
                                        {isEndNode && <circle cx={node.x} cy={node.y} r={r + 22} fill="transparent" />}

                                        {isEndNode && pal && showPaths && (
                                            <circle cx={node.x} cy={node.y} r={r + 16} fill="none" stroke={pal.glow} strokeWidth="14" />
                                        )}

                                        {isHov && pal && (
                                            <circle cx={node.x} cy={node.y} r={r + 8} fill="none"
                                                stroke={pal.path} strokeWidth="3"
                                                style={{ animation: "pulseRing 1s ease-in-out infinite" }} />
                                        )}

                                        <circle cx={node.x} cy={node.y} r={r}
                                            fill={colors.fill} stroke={colors.stroke}
                                            strokeWidth={inPath ? (isHov ? 3 : 2) : 0.5}
                                            opacity={inPath || isRoot ? 1 : 0.18} />

                                        {(inPath || isRoot) && (
                                            <circle cx={node.x} cy={node.y} r={isRoot ? 13 : isEndNode ? 10 : 7}
                                                fill={colors.inner} opacity="0.9" />
                                        )}

                                        {isEndNode && showPaths && !isHov && pal && (
                                            <text x={node.x} y={node.y - r - 8} textAnchor="middle" fontSize="8"
                                                fontFamily="'Courier New', monospace" fill={pal.path} opacity="0.8">
                                                ▲ inspect
                                            </text>
                                        )}

                                        {inPath && (
                                            <>
                                                <rect x={node.x - 16} y={node.y + r + 4} width="32" height="14" rx="4"
                                                    fill="rgba(4,10,22,0.92)" stroke={pal ? pal.border : "#1e293b"} strokeWidth="1" />
                                                <text x={node.x} y={node.y + r + 14} textAnchor="middle" fontSize="9"
                                                    fontFamily="'Courier New', monospace" fontWeight="bold" fill={scoreColor(node.score)}>
                                                    {node.score}
                                                </text>
                                            </>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {!rootVisible && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="text-slate-600 text-xs tracking-widest uppercase mb-2">
                                {loading ? "Contacting simulation engine..." : "No analysis loaded"}
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="rounded-full border border-blue-400 bg-blue-600 px-10 py-5 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait"
                                style={{ letterSpacing: "0.08em" }}
                            >
                                {loading ? "SIMULATING…" : "RUN SIMULATION"}
                            </button>
                        </div>
                    )}

                    {rootVisible && (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="absolute left-1/2 top-20 h-[68px] w-[68px] -translate-x-1/2 rounded-full border-2 border-blue-300 bg-blue-700 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition hover:scale-105 hover:bg-blue-500 z-20 disabled:opacity-50"
                        >
                            {loading ? "…" : "ROOT"}
                        </button>
                    )}

                    <div className="absolute bottom-4 right-4 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs font-mono">
                        {status === GENERATE_STATUS.idle && <span className="text-slate-500">◌ Awaiting simulation</span>}
                        {status === GENERATE_STATUS.growing && <span className="text-blue-400">◉ Rendering tree... depth {visibleDepth}/{maxDepth}</span>}
                        {status === GENERATE_STATUS.done && <span className="text-green-400">✔ Analysis complete — hover end nodes</span>}
                    </div>

                    <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-slate-600">
                        <span>● Highlighted paths</span>
                        <span style={{ opacity: 0.4 }}>● Background branches</span>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pop {
        0%   { opacity: 0; transform: scale(0.2); }
        75%  { opacity: 1; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
        }
        @keyframes draw {
        from { stroke-dashoffset: 1; }
        to   { stroke-dashoffset: 0; }
        }
        @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tooltipFade {
        from { opacity: 0; transform: translateY(6px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
        0%, 100% { opacity: 0.4; }
        50%      { opacity: 1; }
        }
    `}</style>
        </div>
    );
}
