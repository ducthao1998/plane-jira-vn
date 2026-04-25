/**
 * DAPD Dashboard - Phan tich tac dong theo Task
 *
 * Goi DAPD Engine API: POST /api/dapd/ai/suggest-impact-by-task?taskId={id}
 * Hien thi ket qua phan tich AI cho cac task da seed
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
} from "lucide-react";
import { PageHead } from "@/components/core/page-title";

// ============================================================================
// Types
// ============================================================================

interface ImpactItem {
  entityType: "MICROSERVICE" | "SOURCE_FILE" | "FUNCTION";
  entityId: number;
  entityName: string;
  impactLevel: "DIRECT" | "INDIRECT";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

interface PipelineItem {
  microserviceId: number;
  microserviceName: string;
  suggestedTrigger: "AUTO" | "MANUAL";
  environment: string;
}

interface AnalysisResult {
  taskDescription: string;
  analysisMethod: string;
  suggestedImpacts: ImpactItem[];
  suggestedPipelines: PipelineItem[];
  riskAssessment: "LOW" | "MEDIUM" | "HIGH";
  requiresApproval: boolean;
}

interface TaskOption {
  id: number;
  name: string;
  type: "FEATURE" | "BUG_FIX" | "SECURITY";
  sprint: string;
}

// ============================================================================
// Constants
// ============================================================================

const TASKS: TaskOption[] = [
  { id: 1, name: "Implement transferInternational API", type: "FEATURE", sprint: "SPRINT-05" },
  { id: 2, name: "Validate IBAN quoc te", type: "FEATURE", sprint: "SPRINT-05" },
  { id: 3, name: "Frontend trang chuyen diem quoc te", type: "FEATURE", sprint: "SPRINT-05" },
  { id: 4, name: "Fix TransactionResponse mapping", type: "BUG_FIX", sprint: "SPRINT-05" },
  { id: 5, name: "Fix frontend Transaction page", type: "BUG_FIX", sprint: "SPRINT-05" },
  { id: 8, name: "Fix high vulnerability WalletClient", type: "SECURITY", sprint: "SPRINT-05" },
  { id: 9, name: "Fix backward compatibility IbanValidator", type: "BUG_FIX", sprint: "SPRINT-05" },
  { id: 10, name: "Fix SQL injection TransactionService", type: "SECURITY", sprint: "SPRINT-05" },
  { id: 11, name: "Fix XSS vulnerability CreateQRCode.js", type: "SECURITY", sprint: "SPRINT-06" },
];

// Demo data theo file API_SUGGEST_IMPACT_BY_TASK.md
const DEMO_DATA: Record<number, AnalysisResult> = {
  1: {
    taskDescription: "Them API POST /api/v1/payments/transfer-international trong PaymentController va PaymentService",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 4,
        entityName: "payment-management-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can them API va logic xu ly chuyen diem quoc te",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 21,
        entityName: "PaymentController",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can them API endpoint moi",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 23,
        entityName: "PaymentService",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can them logic xu ly chuyen diem quoc te",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 27,
        entityName: "ValidIban",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can annotation moi de validate IBAN",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 28,
        entityName: "IbanValidator",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can logic validate IBAN",
      },
      {
        entityType: "FUNCTION",
        entityId: 21,
        entityName: "PaymentService.transferFunds",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Can them xu ly chuyen diem quoc te",
      },
      {
        entityType: "MICROSERVICE",
        entityId: 6,
        entityName: "common-service",
        impactLevel: "INDIRECT",
        confidence: "HIGH",
        reason: "Can them validator IBAN vao thu vien chung",
      },
      {
        entityType: "MICROSERVICE",
        entityId: 2,
        entityName: "wallet-management-service",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Co the can cap nhat so du vi khi chuyen diem",
      },
      {
        entityType: "MICROSERVICE",
        entityId: 3,
        entityName: "transaction-management-service",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Can luu giao dich chuyen diem quoc te",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 24,
        entityName: "WalletClient",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Co the can goi wallet-service de cap nhat so du",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 25,
        entityName: "TransactionClient",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Can goi transaction-service de luu giao dich",
      },
      {
        entityType: "FUNCTION",
        entityId: 13,
        entityName: "WalletController.updateBalance",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Co the can goi cap nhat so du vi",
      },
      {
        entityType: "FUNCTION",
        entityId: 16,
        entityName: "TransactionController.create",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Co the can goi luu giao dich moi",
      },
    ],
    suggestedPipelines: [
      {
        microserviceId: 4,
        microserviceName: "payment-management-service",
        suggestedTrigger: "AUTO",
        environment: "DEV",
      },
      { microserviceId: 6, microserviceName: "common-service", suggestedTrigger: "MANUAL", environment: "DEV" },
      {
        microserviceId: 2,
        microserviceName: "wallet-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
      },
      {
        microserviceId: 3,
        microserviceName: "transaction-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
      },
    ],
    riskAssessment: "HIGH",
    requiresApproval: true,
  },
  2: {
    taskDescription: "Mo rong ValidIban annotation ho tro SWIFT/BIC code",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 6,
        entityName: "common-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sua annotation trong thu vien dung chung",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 27,
        entityName: "ValidIban",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Mo rong de support SWIFT/BIC",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 28,
        entityName: "IbanValidator",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Them logic validate SWIFT",
      },
    ],
    suggestedPipelines: [
      { microserviceId: 6, microserviceName: "common-service", suggestedTrigger: "MANUAL", environment: "DEV" },
    ],
    riskAssessment: "MEDIUM",
    requiresApproval: false,
  },
  3: {
    taskDescription: "Them tab International Transfer trong WalletToWallet.js",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 7,
        entityName: "frontend",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Them tab moi vao trang chuyen diem",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 29,
        entityName: "WalletToWallet.js",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Them UI tab International Transfer",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 38,
        entityName: "HttpService.js",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Can them API call moi cho transfer-international",
      },
    ],
    suggestedPipelines: [
      { microserviceId: 7, microserviceName: "frontend", suggestedTrigger: "AUTO", environment: "DEV" },
    ],
    riskAssessment: "LOW",
    requiresApproval: false,
  },
  4: {
    taskDescription: "Fix TransactionResponse tra ve fromWallet.user.firstName null",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 3,
        entityName: "transaction-management-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Fix join query trong service layer",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 18,
        entityName: "TransactionService",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sua join query de tra ve day du wallet+user",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 17,
        entityName: "Transaction",
        impactLevel: "INDIRECT",
        confidence: "MEDIUM",
        reason: "Kiem tra mapping entity",
      },
      {
        entityType: "FUNCTION",
        entityId: 14,
        entityName: "TransactionService.findById",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Tra ve TransactionResponse da fix",
      },
      {
        entityType: "FUNCTION",
        entityId: 15,
        entityName: "TransactionService.findAll",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Tra ve TransactionResponse da fix",
      },
    ],
    suggestedPipelines: [
      {
        microserviceId: 3,
        microserviceName: "transaction-management-service",
        suggestedTrigger: "AUTO",
        environment: "DEV",
      },
    ],
    riskAssessment: "MEDIUM",
    requiresApproval: false,
  },
  5: {
    taskDescription: "Fix Transaction.js khong hien thi ten vi do doc sai field",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 7,
        entityName: "frontend",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Fix field mapping trong trang transaction",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 30,
        entityName: "Transaction.js",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sua doc field tu response",
      },
    ],
    suggestedPipelines: [
      { microserviceId: 7, microserviceName: "frontend", suggestedTrigger: "AUTO", environment: "DEV" },
    ],
    riskAssessment: "LOW",
    requiresApproval: false,
  },
  8: {
    taskDescription: "Fix high vulnerability trong WalletClient dependency",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 4,
        entityName: "payment-management-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Update dependency co lo hong",
      },
      {
        entityType: "MICROSERVICE",
        entityId: 2,
        entityName: "wallet-management-service",
        impactLevel: "INDIRECT",
        confidence: "HIGH",
        reason: "Bi anh huong qua dependency chain",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 24,
        entityName: "WalletClient",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Library bi vulnerability",
      },
    ],
    suggestedPipelines: [
      {
        microserviceId: 4,
        microserviceName: "payment-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
      },
      {
        microserviceId: 2,
        microserviceName: "wallet-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
      },
    ],
    riskAssessment: "HIGH",
    requiresApproval: true,
  },
  9: {
    taskDescription: "Fix backward compatibility cua IbanValidator",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 6,
        entityName: "common-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Fix logic IbanValidator de tuong thich nguoc",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 28,
        entityName: "IbanValidator",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sua logic validate",
      },
    ],
    suggestedPipelines: [
      { microserviceId: 6, microserviceName: "common-service", suggestedTrigger: "MANUAL", environment: "DEV" },
    ],
    riskAssessment: "MEDIUM",
    requiresApproval: false,
  },
  10: {
    taskDescription: "Fix SQL injection risk trong TransactionService",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 3,
        entityName: "transaction-management-service",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Fix SQL injection trong query",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 18,
        entityName: "TransactionService",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Su dung prepared statement",
      },
      {
        entityType: "FUNCTION",
        entityId: 15,
        entityName: "TransactionService.findAll",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sua query co SQL injection",
      },
    ],
    suggestedPipelines: [
      {
        microserviceId: 3,
        microserviceName: "transaction-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
      },
    ],
    riskAssessment: "HIGH",
    requiresApproval: true,
  },
  11: {
    taskDescription: "Fix XSS vulnerability trong CreateQRCode.js",
    analysisMethod: "AWS Bedrock AI (Claude) + Layer S architecture context",
    suggestedImpacts: [
      {
        entityType: "MICROSERVICE",
        entityId: 7,
        entityName: "frontend",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Sanitize input de tranh XSS",
      },
      {
        entityType: "SOURCE_FILE",
        entityId: 35,
        entityName: "CreateQRCode.js",
        impactLevel: "DIRECT",
        confidence: "HIGH",
        reason: "Escape user input truoc khi render QR",
      },
    ],
    suggestedPipelines: [
      { microserviceId: 7, microserviceName: "frontend", suggestedTrigger: "MANUAL", environment: "DEV" },
    ],
    riskAssessment: "HIGH",
    requiresApproval: true,
  },
};

// ============================================================================
// Component
// ============================================================================

function DapdDashboardPage() {
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem("dapd_api_url") || "http://localhost:8090");
  const [useDemo, setUseDemo] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<string>("Chua kiem tra");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("dapd_api_url", apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    checkApiHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setResult(null);
  };

  const analyze = async () => {
    if (!selectedTaskId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    if (useDemo) {
      await new Promise((r) => setTimeout(r, 600));
      setResult(DEMO_DATA[selectedTaskId] || DEMO_DATA[1]);
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
      setResult(data);
    } catch (e) {
      const err = e as Error;
      setError(err.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const filterByType = (t: ImpactItem["entityType"]) =>
    (result?.suggestedImpacts || []).filter((i) => i.entityType === t);

  const filterByLevel = (l: ImpactItem["impactLevel"]) =>
    (result?.suggestedImpacts || []).filter((i) => i.impactLevel === l);

  const filterByConfidence = (c: ImpactItem["confidence"]) =>
    (result?.suggestedImpacts || []).filter((i) => i.confidence === c);

  const totalImpacts = result?.suggestedImpacts?.length || 0;
  const directCount = filterByLevel("DIRECT").length;
  const indirectCount = filterByLevel("INDIRECT").length;
  const directPct = totalImpacts ? (directCount / totalImpacts) * 100 : 0;
  const indirectPct = totalImpacts ? (indirectCount / totalImpacts) * 100 : 0;

  return (
    <>
      <PageHead title="DAPD Dashboard" />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Hero Header */}
        <div className="from-indigo-600 via-purple-600 to-pink-600 shadow-xl rounded-2xl bg-gradient-to-r p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-opacity-20 flex h-14 w-14 items-center justify-center rounded-xl bg-white backdrop-blur-sm">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">DAPD Impact Analysis Dashboard</h1>
                <p className="text-sm text-opacity-80 mt-1 text-white">
                  Phan tich tac dong xuyen layer cho ke hoach Agile (h: A &rarr; O)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-opacity-20 flex items-center gap-2 rounded-lg bg-white px-3 py-2 backdrop-blur-sm">
                <span
                  className={`h-2 w-2 rounded-full ${apiStatus === "API Online" ? "bg-green-400" : "bg-red-400"}`}
                />
                <span className="text-sm font-medium">{apiStatus}</span>
              </div>
              <button
                onClick={checkApiHealth}
                className="bg-opacity-20 hover:bg-opacity-30 rounded-lg bg-white p-2 transition"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-text-primary flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="font-bold">Cau hinh</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUseDemo(!useDemo);
                }}
                className={`text-xs ml-2 rounded-lg px-3 py-1 font-bold transition ${
                  useDemo ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                }`}
              >
                {useDemo ? "DEMO MODE" : "LIVE API"}
              </button>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${showConfig ? "rotate-180" : ""}`} />
          </button>
          {showConfig && (
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="dapd-api-url" className="text-sm text-text-secondary mb-1 block font-medium">
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
              <p className="text-xs text-text-tertiary">
                Bat <strong>Demo Mode</strong> de xem du lieu mau khi API chua chay.
              </p>
            </div>
          )}
        </div>

        {/* Task selector */}
        <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-5">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-bold">
            <Activity className="text-primary-base h-5 w-5" />
            Chon Task de phan tich
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TASKS.map((task) => {
              const selected = selectedTaskId === task.id;
              const typeColor =
                task.type === "FEATURE"
                  ? "bg-green-100 text-green-700"
                  : task.type === "BUG_FIX"
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700";
              return (
                <button
                  key={task.id}
                  onClick={() => handleSelect(task.id)}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    selected
                      ? "border-primary-base bg-primary-component-surface-light"
                      : "border-border-base hover:border-primary-base bg-layer-base"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className={`text-xs rounded-md px-2 py-0.5 font-bold ${typeColor}`}>{task.type}</span>
                    <span className="text-xs text-text-tertiary">#{task.id}</span>
                  </div>
                  <p className="text-sm text-text-primary mt-1 font-semibold">{task.name}</p>
                  <p className="text-xs text-text-tertiary mt-1">{task.sprint}</p>
                </button>
              );
            })}
          </div>
          <button
            onClick={analyze}
            disabled={!selectedTaskId || loading}
            className="from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Dang phan tich...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Phan tich tac dong (h: A &rarr; O)
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-red-500 rounded-lg border-l-4 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-semibold">Loi khi goi API</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <p className="text-xs text-text-tertiary mt-2">
                  Bat <strong>Demo Mode</strong> neu API chua chay.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="from-pink-500 to-red-500 shadow-lg rounded-2xl bg-gradient-to-br p-4 text-white">
                <p className="text-xs mb-1 font-medium opacity-80">RUI RO</p>
                <p className="text-2xl font-bold">{result.riskAssessment}</p>
                <p className="text-xs mt-1 opacity-80">
                  {result.requiresApproval ? "Can PM approve" : "Khong can approve"}
                </p>
              </div>
              <div className="from-blue-500 to-cyan-500 shadow-lg rounded-2xl bg-gradient-to-br p-4 text-white">
                <p className="text-xs mb-1 font-medium opacity-80">TONG IMPACTS</p>
                <p className="text-2xl font-bold">{totalImpacts}</p>
                <p className="text-xs mt-1 opacity-80">Thanh phan bi anh huong</p>
              </div>
              <div className="from-green-500 to-emerald-500 shadow-lg rounded-2xl bg-gradient-to-br p-4 text-white">
                <p className="text-xs mb-1 font-medium opacity-80">SERVICES</p>
                <p className="text-2xl font-bold">{filterByType("MICROSERVICE").length}</p>
                <p className="text-xs mt-1 opacity-80">Microservices</p>
              </div>
              <div className="from-orange-500 to-yellow-500 shadow-lg rounded-2xl bg-gradient-to-br p-4 text-white">
                <p className="text-xs mb-1 font-medium opacity-80">PIPELINES</p>
                <p className="text-2xl font-bold">{result.suggestedPipelines.length}</p>
                <p className="text-xs mt-1 opacity-80">Pipeline de xuat</p>
              </div>
            </div>

            {/* Task description */}
            <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-text-tertiary mb-1 font-medium">MO TA TASK</p>
                  <p className="text-base text-text-primary font-semibold">{result.taskDescription}</p>
                </div>
                <span
                  className={`text-xs rounded-lg px-3 py-1 font-bold ${
                    result.analysisMethod.includes("Bedrock")
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {result.analysisMethod.includes("Bedrock") ? "AI BEDROCK" : "RULE-BASED"}
                </span>
              </div>
              <p className="text-xs text-text-tertiary">{result.analysisMethod}</p>
            </div>

            {/* Impacts by type */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {(
                [
                  ["MICROSERVICE", Cpu, "blue"],
                  ["SOURCE_FILE", FileCode, "purple"],
                  ["FUNCTION", GitBranch, "pink"],
                ] as const
              ).map(([type, Icon, color]) => {
                const items = filterByType(type as ImpactItem["entityType"]);
                return (
                  <div key={type} className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-text-primary flex items-center gap-2 font-bold">
                        <Icon className={`h-5 w-5 text-${color}-500`} />
                        <span>{type}</span>
                      </h3>
                      <span className="text-sm text-text-tertiary font-bold">{items.length}</span>
                    </div>
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {items.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-6 text-center">Khong co</p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={`${item.entityType}-${item.entityId}-${item.entityName}`}
                            className="border-border-base hover:border-primary-base bg-layer-base rounded-lg border p-3 transition"
                          >
                            <p className="text-sm text-text-primary mb-1 font-semibold">{item.entityName}</p>
                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-xs rounded-md px-2 py-0.5 font-bold ${
                                  item.impactLevel === "DIRECT"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {item.impactLevel}
                              </span>
                              <span
                                className={`text-xs rounded-md px-2 py-0.5 font-bold ${
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
                            <p className="text-xs text-text-secondary leading-relaxed">{item.reason}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipelines */}
            <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-5">
              <h3 className="text-text-primary mb-4 flex items-center gap-2 font-bold">
                <Zap className="text-emerald-500 h-5 w-5" />
                Pipelines de xuat (g: S &rarr; P)
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {result.suggestedPipelines.map((p) => (
                  <div
                    key={`${p.microserviceId}-${p.microserviceName}-${p.environment}`}
                    className="border-border-base hover:shadow-md bg-layer-base rounded-xl border p-3 transition"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-text-primary font-bold">{p.microserviceName}</span>
                      <span
                        className={`text-xs rounded-md px-2 py-0.5 font-bold ${
                          p.suggestedTrigger === "AUTO"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {p.suggestedTrigger}
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary flex items-center gap-2">
                      <span>Env:</span>
                      <span className="rounded bg-layer-2 px-2 py-0.5 font-medium">{p.environment}</span>
                      <span className="ml-auto">ID: {p.microserviceId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-5">
              <h3 className="text-text-primary mb-4 flex items-center gap-2 font-bold">
                <AlertTriangle className="text-rose-500 h-5 w-5" />
                Bieu do tac dong (DIRECT vs INDIRECT)
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-text-primary font-medium">DIRECT (anh huong truc tiep)</span>
                    <span className="text-sm text-red-500 font-bold">{directCount}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-layer-2">
                    <div
                      className="from-red-500 to-orange-500 h-full bg-gradient-to-r transition-all duration-500"
                      style={{ width: `${directPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-text-primary font-medium">INDIRECT (anh huong gian tiep)</span>
                    <span className="text-sm text-yellow-500 font-bold">{indirectCount}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-layer-2">
                    <div
                      className="from-yellow-500 to-amber-400 h-full bg-gradient-to-r transition-all duration-500"
                      style={{ width: `${indirectPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="bg-green-50 border-green-200 rounded-lg border p-3 text-center">
                  <p className="text-xs text-green-700 mb-1 font-medium">HIGH</p>
                  <p className="text-2xl text-green-800 font-bold">{filterByConfidence("HIGH").length}</p>
                </div>
                <div className="bg-blue-50 border-blue-200 rounded-lg border p-3 text-center">
                  <p className="text-xs text-blue-700 mb-1 font-medium">MEDIUM</p>
                  <p className="text-2xl text-blue-800 font-bold">{filterByConfidence("MEDIUM").length}</p>
                </div>
                <div className="bg-gray-50 border-gray-200 rounded-lg border p-3 text-center">
                  <p className="text-xs text-gray-700 mb-1 font-medium">LOW</p>
                  <p className="text-2xl text-gray-800 font-bold">{filterByConfidence("LOW").length}</p>
                </div>
              </div>
            </div>

            {/* Raw JSON */}
            <details className="border-border-base rounded-2xl border bg-layer-1 p-4">
              <summary className="text-text-primary hover:text-primary-base cursor-pointer font-bold">
                Xem JSON raw
              </summary>
              <pre className="bg-layer-base text-text-primary text-xs border-border-base mt-3 overflow-x-auto rounded-lg border p-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div className="border-border-base shadow-sm rounded-2xl border bg-layer-1 p-12 text-center">
            <div className="bg-primary-component-surface-light mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <CheckCircle2 className="text-primary-base h-10 w-10" />
            </div>
            <p className="text-lg text-text-primary mb-1 font-bold">San sang phan tich</p>
            <p className="text-sm text-text-tertiary">
              Chon mot Task o tren va bam <strong>Phan tich tac dong</strong>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default observer(DapdDashboardPage);
