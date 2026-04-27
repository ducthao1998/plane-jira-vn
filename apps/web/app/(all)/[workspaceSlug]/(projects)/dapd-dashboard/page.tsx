/**
 * DAPD Dashboard - Phan tich tac dong xuyen layer (h, f, g, m, r)
 *
 * 5 Tab phu 5 phep bien doi:
 *   h(A→O): Impact Analysis
 *   f(O→S): Architecture Trace
 *   g(S→P): Pipeline Plan & Approve
 *   m(P→M): Pipeline Metrics
 *   r(M→A): Effort Feedback
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import {
  Zap,
  RefreshCw,
  AlertCircle,
  Cpu,
  FileCode,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Settings,
  ChevronDown,
  GitMerge,
  PlayCircle,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { PageHead } from "@/components/core/page-title";
import {
  TASKS,
  DEMO_IMPACT,
  DEMO_METRICS,
  DEMO_EFFORT,
  DEMO_TRACES,
  type AnalysisResult,
  type ImpactItem,
  type PipelineMetrics,
  type EffortAnalysis,
  type TraceRecord,
} from "./demo-data";

type TabKey = "impact" | "trace" | "pipeline" | "metrics" | "feedback";

const TABS: { key: TabKey; label: string; transform: string; icon: typeof Zap }[] = [
  { key: "impact", label: "Impact Analysis", transform: "h: A → O", icon: Zap },
  { key: "trace", label: "Architecture Trace", transform: "f: O → S", icon: GitMerge },
  { key: "pipeline", label: "Pipeline Plan", transform: "g: S → P", icon: PlayCircle },
  { key: "metrics", label: "Pipeline Metrics", transform: "m: P → M", icon: BarChart3 },
  { key: "feedback", label: "Effort Feedback", transform: "r: M → A", icon: TrendingUp },
];

function DapdDashboardPage() {
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem("dapd_api_url") || "http://localhost:8090");
  const [useDemo, setUseDemo] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<string>("Demo Mode");
  const [selectedTaskId, setSelectedTaskId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<TabKey>("impact");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [impactResult, setImpactResult] = useState<AnalysisResult | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [pmApprovals, setPmApprovals] = useState<Record<number, boolean>>({});

  useEffect(() => {
    localStorage.setItem("dapd_api_url", apiUrl);
  }, [apiUrl]);

  // Auto load demo data on mount
  useEffect(() => {
    if (useDemo) {
      setImpactResult(DEMO_IMPACT[selectedTaskId] || DEMO_IMPACT[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId, useDemo]);

  const checkApiHealth = async () => {
    setApiStatus("Dang kiem tra...");
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const resp = await fetch(`${apiUrl}/api/layer-p/projects`, {
        method: "GET",
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      setApiStatus(resp.ok ? "API Online" : `API Loi ${resp.status}`);
    } catch {
      setApiStatus("API Offline");
    }
  };

  const handleSelect = (id: number) => {
    setSelectedTaskId(id);
    setError(null);
    if (useDemo) {
      setImpactResult(DEMO_IMPACT[id] || null);
    } else {
      setImpactResult(null);
    }
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);

    if (useDemo) {
      await new Promise((r) => setTimeout(r, 600));
      setImpactResult(DEMO_IMPACT[selectedTaskId] || DEMO_IMPACT[1]);
      setLoading(false);
      return;
    }

    try {
      const url = `${apiUrl}/api/dapd/ai/suggest-impact-by-task?taskId=${selectedTaskId}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt.substring(0, 200)}`);
      }
      const data = (await resp.json()) as AnalysisResult;
      setImpactResult(data);
    } catch (e) {
      const err = e as Error;
      setError(err.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const togglePmApproval = (msId: number) => {
    setPmApprovals((s) => ({ ...s, [msId]: !s[msId] }));
  };

  const selectedTask = TASKS.find((t) => t.id === selectedTaskId);
  const metrics = DEMO_METRICS[selectedTaskId] || [];
  const effort = DEMO_EFFORT[selectedTaskId];
  const traces = DEMO_TRACES[selectedTaskId] || DEMO_TRACES[1];

  return (
    <>
      <PageHead title="DAPD Dashboard" />
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-6">
        {/* Hero Header */}
        <div className="from-indigo-600 via-purple-600 to-pink-600 shadow-xl rounded-2xl bg-gradient-to-r p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-opacity-20 flex h-12 w-12 items-center justify-center rounded-xl bg-white backdrop-blur-sm">
                <Zap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">DAPD Framework Dashboard</h1>
                <p className="text-xs md:text-sm text-opacity-80 mt-0.5 text-white">
                  5 phep bien doi: h(A→O) · f(O→S) · g(S→P) · m(P→M) · r(M→A)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-opacity-20 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 backdrop-blur-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === "API Online"
                      ? "bg-green-400"
                      : apiStatus === "Demo Mode"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                />
                <span className="text-xs font-medium">{apiStatus}</span>
              </div>
              <button
                onClick={checkApiHealth}
                className="bg-opacity-20 hover:bg-opacity-30 rounded-lg bg-white p-1.5 transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="border-border-base shadow-sm rounded-xl border bg-layer-1 p-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-text-primary flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h2 className="text-sm font-bold">Cau hinh</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUseDemo(!useDemo);
                  setApiStatus(useDemo ? "Chua kiem tra" : "Demo Mode");
                }}
                className={`text-xs ml-2 rounded-lg px-3 py-1 font-bold transition ${
                  useDemo ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                }`}
              >
                {useDemo ? "DEMO MODE" : "LIVE API"}
              </button>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showConfig ? "rotate-180" : ""}`} />
          </button>
          {showConfig && (
            <div className="mt-3">
              <label htmlFor="dapd-api-url" className="text-xs text-text-secondary mb-1 block font-medium">
                DAPD API URL
              </label>
              <input
                id="dapd-api-url"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="bg-layer-base border-border-base text-sm text-text-primary focus:border-primary-base w-full rounded-lg border px-3 py-2 focus:outline-none"
                placeholder="http://localhost:8090"
              />
            </div>
          )}
        </div>

        {/* Task selector + Tab Navigation */}
        <div className="border-border-base shadow-sm rounded-xl border bg-layer-1 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="text-primary-base h-4 w-4" />
            <h2 className="text-sm text-text-primary font-bold">Chon Task</h2>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {TASKS.map((task) => {
              const selected = selectedTaskId === task.id;
              const typeColor =
                task.type === "FEATURE"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : task.type === "BUG_FIX"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-orange-100 text-orange-700 border-orange-300";
              return (
                <button
                  key={task.id}
                  onClick={() => handleSelect(task.id)}
                  className={`min-w-[200px] flex-shrink-0 rounded-lg border-2 px-3 py-2 text-left transition ${
                    selected
                      ? "border-primary-base bg-primary-component-surface-light shadow-md"
                      : "border-border-base hover:border-primary-base bg-layer-base"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${typeColor}`}>
                      {task.type}
                    </span>
                    <span className="text-text-tertiary text-[10px]">#{task.id}</span>
                  </div>
                  <p className="text-xs text-text-primary line-clamp-2 font-semibold">{task.name}</p>
                  <p className="text-text-tertiary mt-0.5 text-[10px]">
                    {task.sprint} · {task.storyPoints} SP
                  </p>
                </button>
              );
            })}
          </div>

          {!useDemo && (
            <button
              onClick={analyze}
              disabled={loading}
              className="from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm shadow-md flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r py-2.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Dang phan tich...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Goi DAPD API: suggest-impact-by-task
                </>
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-red-500 rounded-lg border-l-4 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-500 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-semibold">Loi khi goi API</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-border-base shadow-sm overflow-hidden rounded-xl border bg-layer-1">
          <div className="border-border-base flex overflow-x-auto border-b">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 transition ${
                    active
                      ? "border-primary-base text-primary-base bg-primary-component-surface-light"
                      : "text-text-secondary hover:bg-layer-base border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-bold">{tab.label}</div>
                    <div className="text-text-tertiary font-mono text-[10px]">{tab.transform}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 md:p-5">
            {/* Selected Task Banner */}
            {selectedTask && (
              <div className="from-indigo-50 to-purple-50 border-indigo-200 mb-4 flex items-center gap-3 rounded-lg border bg-gradient-to-r p-3">
                <div className="bg-indigo-100 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <span className="text-sm text-indigo-700 font-bold">#{selectedTask.id}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate font-bold">{selectedTask.name}</p>
                  <p className="text-xs text-text-secondary">
                    {selectedTask.type} · {selectedTask.sprint} · {selectedTask.storyPoints} SP ·{" "}
                    {selectedTask.plannedDays} ngay
                  </p>
                </div>
              </div>
            )}

            {/* TAB 1: IMPACT */}
            {activeTab === "impact" && impactResult && <ImpactTab result={impactResult} />}

            {/* TAB 2: TRACE */}
            {activeTab === "trace" && <TraceTab traces={traces} />}

            {/* TAB 3: PIPELINE */}
            {activeTab === "pipeline" && impactResult && (
              <PipelineTab result={impactResult} pmApprovals={pmApprovals} onToggleApproval={togglePmApproval} />
            )}

            {/* TAB 4: METRICS */}
            {activeTab === "metrics" && <MetricsTab metrics={metrics} />}

            {/* TAB 5: FEEDBACK */}
            {activeTab === "feedback" && effort && selectedTask && (
              <FeedbackTab
                effort={effort}
                taskName={selectedTask.name}
                plannedDays={selectedTask.plannedDays}
                storyPoints={selectedTask.storyPoints}
              />
            )}

            {/* Empty states */}
            {activeTab === "metrics" && metrics.length === 0 && (
              <EmptyState message="Task nay chua co pipeline metrics. Chon task khac (S1, S3, S4, S5) de xem." />
            )}
            {activeTab === "feedback" && !effort && <EmptyState message="Task nay chua co du lieu effort analysis." />}
          </div>
        </div>
      </div>
    </>
  );
}

// ========================================================================
// TAB 1: Impact Analysis (h: A → O)
// ========================================================================
function ImpactTab({ result }: { result: AnalysisResult }) {
  const totalImpacts = result.suggestedImpacts.length;
  const directCount = result.suggestedImpacts.filter((i) => i.impactLevel === "DIRECT").length;
  const indirectCount = totalImpacts - directCount;
  const directPct = totalImpacts ? (directCount / totalImpacts) * 100 : 0;
  const indirectPct = totalImpacts ? (indirectCount / totalImpacts) * 100 : 0;
  const filterByType = (t: ImpactItem["entityType"]) => result.suggestedImpacts.filter((i) => i.entityType === t);
  const filterByConfidence = (c: ImpactItem["confidence"]) => result.suggestedImpacts.filter((i) => i.confidence === c);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="from-pink-500 to-red-500 shadow-md rounded-xl bg-gradient-to-br p-3 text-white">
          <p className="mb-1 text-[10px] font-medium opacity-80">RUI RO</p>
          <p className="text-xl font-bold">{result.riskAssessment}</p>
          <p className="mt-0.5 text-[10px] opacity-80">
            {result.requiresApproval ? "Can PM approve" : "Khong can approve"}
          </p>
        </div>
        <div className="from-blue-500 to-cyan-500 shadow-md rounded-xl bg-gradient-to-br p-3 text-white">
          <p className="mb-1 text-[10px] font-medium opacity-80">TONG IMPACTS</p>
          <p className="text-xl font-bold">{totalImpacts}</p>
          <p className="mt-0.5 text-[10px] opacity-80">Thanh phan bi anh huong</p>
        </div>
        <div className="from-green-500 to-emerald-500 shadow-md rounded-xl bg-gradient-to-br p-3 text-white">
          <p className="mb-1 text-[10px] font-medium opacity-80">SERVICES</p>
          <p className="text-xl font-bold">{filterByType("MICROSERVICE").length}</p>
          <p className="mt-0.5 text-[10px] opacity-80">Microservices</p>
        </div>
        <div className="from-orange-500 to-yellow-500 shadow-md rounded-xl bg-gradient-to-br p-3 text-white">
          <p className="mb-1 text-[10px] font-medium opacity-80">PIPELINES</p>
          <p className="text-xl font-bold">{result.suggestedPipelines.length}</p>
          <p className="mt-0.5 text-[10px] opacity-80">Pipeline de xuat</p>
        </div>
      </div>

      {/* Method banner */}
      <div className="bg-layer-base border-border-base flex items-center justify-between rounded-lg border p-3">
        <p className="text-xs text-text-secondary flex-1 truncate">{result.analysisMethod}</p>
        <span
          className={`ml-2 flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
            result.analysisMethod.includes("Bedrock") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {result.analysisMethod.includes("Bedrock") ? "AI BEDROCK" : "RULE-BASED"}
        </span>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(
          [
            ["MICROSERVICE", Cpu, "blue"],
            ["SOURCE_FILE", FileCode, "purple"],
            ["FUNCTION", GitBranch, "pink"],
          ] as const
        ).map(([type, Icon, color]) => {
          const items = filterByType(type as ImpactItem["entityType"]);
          return (
            <div key={type} className="bg-layer-base border-border-base rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm text-text-primary flex items-center gap-1.5 font-bold">
                  <Icon className={`h-4 w-4 text-${color}-500`} />
                  <span>{type}</span>
                </h3>
                <span className="text-xs text-text-tertiary font-bold">{items.length}</span>
              </div>
              <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-text-tertiary py-4 text-center text-[10px]">Khong co</p>
                ) : (
                  items.map((item) => (
                    <div
                      key={`${item.entityType}-${item.entityId}-${item.entityName}`}
                      className="border-border-base rounded-lg border bg-layer-1 p-2"
                    >
                      <p className="text-xs text-text-primary mb-1 font-semibold">{item.entityName}</p>
                      <div className="mb-1 flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            item.impactLevel === "DIRECT" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.impactLevel}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            item.confidence === "HIGH"
                              ? "bg-green-100 text-green-700"
                              : item.confidence === "MEDIUM"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </div>
                      <p className="text-text-secondary text-[10px] leading-snug">{item.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="bg-layer-base border-border-base rounded-xl border p-4">
          <h3 className="text-xs text-text-primary mb-3 flex items-center gap-1.5 font-bold">
            <AlertTriangle className="text-rose-500 h-4 w-4" />
            DIRECT vs INDIRECT
          </h3>
          <div className="space-y-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-text-primary">DIRECT</span>
                <span className="text-xs text-red-500 font-bold">{directCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer-2">
                <div
                  className="from-red-500 to-orange-500 h-full bg-gradient-to-r"
                  style={{ width: `${directPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-text-primary">INDIRECT</span>
                <span className="text-xs text-yellow-500 font-bold">{indirectCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer-2">
                <div
                  className="from-yellow-500 to-amber-400 h-full bg-gradient-to-r"
                  style={{ width: `${indirectPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-layer-base border-border-base rounded-xl border p-4">
          <h3 className="text-xs text-text-primary mb-3 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="text-green-500 h-4 w-4" />
            Confidence Distribution
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 border-green-200 rounded-lg border p-2 text-center">
              <p className="text-green-700 text-[10px] font-medium">HIGH</p>
              <p className="text-xl text-green-800 font-bold">{filterByConfidence("HIGH").length}</p>
            </div>
            <div className="bg-blue-50 border-blue-200 rounded-lg border p-2 text-center">
              <p className="text-blue-700 text-[10px] font-medium">MEDIUM</p>
              <p className="text-xl text-blue-800 font-bold">{filterByConfidence("MEDIUM").length}</p>
            </div>
            <div className="bg-gray-50 border-gray-200 rounded-lg border p-2 text-center">
              <p className="text-gray-700 text-[10px] font-medium">LOW</p>
              <p className="text-xl text-gray-800 font-bold">{filterByConfidence("LOW").length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================================
// TAB 2: Architecture Trace (f: O → S)
// ========================================================================
function TraceTab({ traces }: { traces: TraceRecord[] }) {
  const grouped: Record<string, TraceRecord[]> = {};
  traces.forEach((t) => {
    if (!grouped[t.toType]) grouped[t.toType] = [];
    grouped[t.toType].push(t);
  });

  return (
    <div className="space-y-4">
      <div className="from-purple-50 to-pink-50 border-purple-200 rounded-xl border bg-gradient-to-r p-4">
        <h3 className="text-sm text-purple-900 mb-1 flex items-center gap-2 font-bold">
          <GitMerge className="h-4 w-4" />
          Trace Records: Layer A → Layer S
        </h3>
        <p className="text-xs text-purple-700">
          Tu Planning Artifact, AI anh xa sang cac thanh phan kien truc thuc te (Microservice, Source File, Function,
          Pipeline). Tong: <strong>{traces.length} trace records</strong> trong group{" "}
          <strong>{traces[0]?.group}</strong>.
        </p>
      </div>

      {Object.entries(grouped).map(([entityType, records]) => (
        <div key={entityType} className="bg-layer-base border-border-base overflow-hidden rounded-xl border">
          <div className="from-indigo-100 to-purple-100 border-border-base flex items-center justify-between border-b bg-gradient-to-r px-4 py-2">
            <h4 className="text-sm text-indigo-900 font-bold">→ {entityType}</h4>
            <span className="text-xs text-indigo-700 font-bold">{records.length} records</span>
          </div>
          <div className="divide-border-base divide-y">
            {records.map((r) => (
              <div
                key={`${r.group}-${r.fromType}-${r.fromName}-${r.toType}-${r.toName}-${r.relationType}-${r.createdAt}`}
                className="flex items-center gap-3 p-3 transition hover:bg-layer-1"
              >
                <div className="bg-purple-100 text-purple-700 flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold">
                  {r.fromType}
                </div>
                <span className="text-xs text-text-primary font-medium">{r.fromName}</span>
                <div className="flex flex-1 items-center gap-1">
                  <div className="border-border-base flex-1 border-t-2 border-dashed" />
                  <span className="text-text-tertiary font-mono rounded bg-layer-2 px-2 py-0.5 text-[9px]">
                    {r.relationType}
                  </span>
                  <div className="border-border-base flex-1 border-t-2 border-dashed" />
                </div>
                <span className="text-xs text-text-primary font-bold">{r.toName}</span>
                <div className="bg-pink-100 text-pink-700 flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold">
                  {r.toType}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================================================
// TAB 3: Pipeline Plan (g: S → P)
// ========================================================================
function PipelineTab({
  result,
  pmApprovals,
  onToggleApproval,
}: {
  result: AnalysisResult;
  pmApprovals: Record<number, boolean>;
  onToggleApproval: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="from-emerald-50 to-teal-50 border-emerald-200 rounded-xl border bg-gradient-to-r p-4">
        <h3 className="text-sm text-emerald-900 mb-1 flex items-center gap-2 font-bold">
          <PlayCircle className="h-4 w-4" />
          Pipeline Plan
        </h3>
        <p className="text-xs text-emerald-700">
          AI de xuat <strong>{result.suggestedPipelines.length} pipeline</strong> can chay. Voi rui ro{" "}
          <strong>{result.riskAssessment}</strong>, {result.requiresApproval ? "PM PHAI approve" : "khong can approve"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {result.suggestedPipelines.map((p) => {
          const approved = pmApprovals[p.microserviceId] || p.approvalStatus === "APPROVED";
          const needsApproval = p.approvalStatus === "PENDING_APPROVAL";
          return (
            <div
              key={`${p.microserviceId}-${p.microserviceName}`}
              className={`rounded-xl border-2 p-4 transition ${
                approved
                  ? "border-green-300 bg-green-50"
                  : needsApproval
                    ? "border-orange-300 bg-orange-50"
                    : "border-border-base bg-layer-base"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-text-primary font-bold">{p.microserviceName}</p>
                  <p className="text-text-tertiary mt-0.5 text-[10px]">
                    {p.pipelineCode || "TBD"} · {p.environment}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    p.suggestedTrigger === "AUTO" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {p.suggestedTrigger}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs flex items-center justify-between">
                  <span className="text-text-secondary">Approval Status:</span>
                  <span
                    className={`font-bold ${
                      approved ? "text-green-600" : needsApproval ? "text-orange-600" : "text-text-tertiary"
                    }`}
                  >
                    {approved ? "APPROVED" : p.approvalStatus || "NOT_REQUIRED"}
                  </span>
                </div>
                {p.approvedBy && (
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-text-secondary">Approved by:</span>
                    <span className="text-text-primary font-bold">{p.approvedBy}</span>
                  </div>
                )}

                {needsApproval && (
                  <button
                    onClick={() => onToggleApproval(p.microserviceId)}
                    className={`text-xs w-full rounded-lg py-2 font-bold transition ${
                      approved
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 bg-gradient-to-r text-white"
                    }`}
                  >
                    {approved ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckCircle className="h-3 w-3" />
                        DA APPROVE - Click de huy
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <PlayCircle className="h-3 w-3" />
                        APPROVE & RUN PIPELINE
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================================================
// TAB 4: Pipeline Metrics (m: P → M)
// ========================================================================
function MetricsTab({ metrics }: { metrics: PipelineMetrics[] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="from-cyan-50 to-blue-50 border-cyan-200 rounded-xl border bg-gradient-to-r p-4">
        <h3 className="text-sm text-cyan-900 mb-1 flex items-center gap-2 font-bold">
          <BarChart3 className="h-4 w-4" />
          Pipeline Metrics
        </h3>
        <p className="text-xs text-cyan-700">
          Du lieu thuc te tu CI/CD pipeline da chay. <strong>{metrics.length} pipeline runs</strong> · Tong{" "}
          <strong>{metrics.reduce((s, m) => s + m.totalDurationMin, 0)} phut</strong>.
        </p>
      </div>

      {metrics.map((m) => (
        <div
          key={m.pipelineCode}
          className="bg-layer-base border-border-base shadow-sm overflow-hidden rounded-xl border"
        >
          <div
            className={`flex items-center justify-between px-4 py-3 ${
              m.status === "SUCCESS"
                ? "from-green-50 to-emerald-50 bg-gradient-to-r"
                : "from-red-50 to-pink-50 bg-gradient-to-r"
            } border-border-base border-b`}
          >
            <div className="flex items-center gap-2">
              {m.status === "SUCCESS" ? (
                <CheckCircle className="text-green-600 h-5 w-5" />
              ) : (
                <XCircle className="text-red-600 h-5 w-5" />
              )}
              <div>
                <p className="text-sm text-text-primary font-bold">{m.pipelineCode}</p>
                <p className="text-text-tertiary text-[10px]">{m.microservice}</p>
              </div>
            </div>
            <div className="text-xs flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="text-text-tertiary h-3 w-3" />
                <span className="font-bold">{m.totalDurationMin} phut</span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  m.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {m.status}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="border-border-base grid grid-cols-2 gap-2 border-b p-3 md:grid-cols-4">
            <Kpi label="Tests" value={`${m.testsPassed}/${m.testsTotal}`} subValue="100% pass" color="green" />
            <Kpi label="Line Coverage" value={`${m.lineCoverage}%`} color="blue" />
            <Kpi label="Branch Coverage" value={`${m.branchCoverage}%`} color="purple" />
            <Kpi
              label="Vulnerabilities"
              value={`${m.vulnerabilities.critical + m.vulnerabilities.high}`}
              subValue={`${m.vulnerabilities.critical} crit · ${m.vulnerabilities.high} high`}
              color={m.vulnerabilities.critical > 0 ? "red" : m.vulnerabilities.high > 0 ? "orange" : "green"}
            />
          </div>

          {/* Steps */}
          <div className="p-3">
            <p className="text-text-tertiary mb-2 text-[10px] font-bold uppercase">Pipeline Steps</p>
            <div className="space-y-1.5">
              {m.steps.map((s) => (
                <div
                  key={s.name}
                  className="border-border-base flex items-center gap-3 rounded-lg border bg-layer-1 p-2"
                >
                  <div className="flex-shrink-0">
                    {s.status === "PASSED" ? (
                      <CheckCircle className="text-green-500 h-4 w-4" />
                    ) : (
                      <XCircle className="text-red-500 h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary font-bold">{s.name}</p>
                    {s.detail && <p className="text-text-secondary text-[10px]">{s.detail}</p>}
                  </div>
                  <span className="font-mono text-text-tertiary flex-shrink-0 rounded bg-layer-2 px-2 py-0.5 text-[10px]">
                    {s.type}
                  </span>
                  <span className="text-xs text-text-primary flex-shrink-0 font-bold">{s.durationSec}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================================================
// TAB 5: Effort Feedback (r: M → A)
// ========================================================================
function FeedbackTab({
  effort,
  taskName,
  plannedDays,
  storyPoints,
}: {
  effort: EffortAnalysis;
  taskName: string;
  plannedDays: number;
  storyPoints: number;
}) {
  return (
    <div className="space-y-4">
      <div className="from-amber-50 to-orange-50 border-amber-200 rounded-xl border bg-gradient-to-r p-4">
        <h3 className="text-sm text-amber-900 mb-1 flex items-center gap-2 font-bold">
          <TrendingUp className="h-4 w-4" />
          Effort Feedback Loop (M → A)
        </h3>
        <p className="text-xs text-amber-700">
          Framework tong hop metrics + PM phan tich. Du lieu giup PM dieu chinh estimate cho sprint sau.
        </p>
      </div>

      {/* Comparison: Planned vs Actual */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="from-blue-500 to-indigo-600 shadow-lg rounded-xl bg-gradient-to-br p-4 text-white">
          <p className="text-xs mb-1 font-medium opacity-80">PLANNED</p>
          <p className="text-3xl font-bold">{plannedDays}</p>
          <p className="text-xs opacity-80">ngay (estimate ban dau)</p>
          <div className="border-opacity-20 mt-3 border-t border-white pt-3">
            <p className="text-xs">
              Story Points: <strong>{storyPoints} SP</strong>
            </p>
          </div>
        </div>
        <div className="from-green-500 to-emerald-600 shadow-lg rounded-xl bg-gradient-to-br p-4 text-white">
          <p className="text-xs mb-1 font-medium opacity-80">ACTUAL PIPELINE</p>
          <p className="text-3xl font-bold">{effort.actualPipelineMin}</p>
          <p className="text-xs opacity-80">phut (build + deploy)</p>
          <div className="border-opacity-20 mt-3 border-t border-white pt-3">
            <p className="text-xs">
              Services: <strong>{effort.affectedServices}</strong> · Pipeline runs:{" "}
              <strong>{effort.pipelineRuns}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Bottleneck */}
      <div className="bg-layer-base border-border-base rounded-xl border p-4">
        <h4 className="text-sm text-text-primary mb-2 flex items-center gap-2 font-bold">
          <ShieldAlert className="text-red-500 h-4 w-4" />
          Bottleneck phat hien
        </h4>
        <p className="text-xs text-text-secondary bg-red-50 border-red-500 rounded border-l-4 p-3 leading-relaxed">
          {effort.bottleneck}
        </p>
      </div>

      {/* PM Action */}
      <div className="from-indigo-50 to-purple-50 border-indigo-200 rounded-xl border bg-gradient-to-br p-4">
        <h4 className="text-sm text-indigo-900 mb-2 flex items-center gap-2 font-bold">
          <TrendingUp className="h-4 w-4" />
          PM Action - Dieu chinh Sprint Sau
        </h4>
        <p className="text-xs text-indigo-800 leading-relaxed">{effort.pmAction}</p>
      </div>

      {/* Source */}
      <div className="text-center">
        <p className="text-text-tertiary text-[10px] italic">
          Du lieu effort cua task: <strong>{taskName}</strong>
        </p>
      </div>
    </div>
  );
}

// ========================================================================
// Helpers
// ========================================================================
function Kpi({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  color: "green" | "blue" | "purple" | "red" | "orange";
}) {
  const bgColor = {
    green: "bg-green-50 border-green-200 text-green-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    red: "bg-red-50 border-red-200 text-red-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
  }[color];
  return (
    <div className={`${bgColor} rounded-lg border p-2 text-center`}>
      <p className="mb-0.5 text-[10px] font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {subValue && <p className="mt-0.5 text-[9px] opacity-70">{subValue}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <AlertCircle className="text-text-tertiary mx-auto mb-2 h-10 w-10" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

export default observer(DapdDashboardPage);
