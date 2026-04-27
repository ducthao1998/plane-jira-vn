/**
 * Demo data cho DAPD Dashboard - 5 phep bien doi h/f/g/m/r
 * Theo Paper Outline + API_SUGGEST_IMPACT_BY_TASK.md
 */

export interface ImpactItem {
  entityType: "MICROSERVICE" | "SOURCE_FILE" | "FUNCTION";
  entityId: number;
  entityName: string;
  impactLevel: "DIRECT" | "INDIRECT";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

export interface PipelineItem {
  microserviceId: number;
  microserviceName: string;
  suggestedTrigger: "AUTO" | "MANUAL";
  environment: string;
  approvalStatus?: "NOT_REQUIRED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  pipelineCode?: string;
}

export interface AnalysisResult {
  taskDescription: string;
  analysisMethod: string;
  suggestedImpacts: ImpactItem[];
  suggestedPipelines: PipelineItem[];
  riskAssessment: "LOW" | "MEDIUM" | "HIGH";
  requiresApproval: boolean;
}

export interface PipelineStep {
  name: string;
  type: string;
  durationSec: number;
  status: "PASSED" | "FAILED" | "RUNNING";
  detail?: string;
}

export interface PipelineMetrics {
  pipelineCode: string;
  microservice: string;
  steps: PipelineStep[];
  totalDurationMin: number;
  testsPassed: number;
  testsTotal: number;
  lineCoverage: number;
  branchCoverage: number;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  status: "SUCCESS" | "FAILED" | "RUNNING";
}

export interface EffortAnalysis {
  plannedDays: number;
  actualPipelineMin: number;
  affectedServices: number;
  pipelineRuns: number;
  bottleneck: string;
  pmAction: string;
}

export interface TraceRecord {
  group: string;
  fromType: string;
  fromName: string;
  toType: string;
  toName: string;
  relationType: string;
  createdAt: string;
}

export interface TaskOption {
  id: number;
  name: string;
  type: "FEATURE" | "BUG_FIX" | "SECURITY";
  sprint: string;
  storyPoints: number;
  plannedDays: number;
}

export const TASKS: TaskOption[] = [
  {
    id: 1,
    name: "Implement transferInternational API",
    type: "FEATURE",
    sprint: "SPRINT-05",
    storyPoints: 8,
    plannedDays: 10,
  },
  { id: 2, name: "Validate IBAN quoc te", type: "FEATURE", sprint: "SPRINT-05", storyPoints: 5, plannedDays: 10 },
  {
    id: 3,
    name: "Frontend trang chuyen diem quoc te",
    type: "FEATURE",
    sprint: "SPRINT-05",
    storyPoints: 5,
    plannedDays: 8,
  },
  {
    id: 4,
    name: "Fix TransactionResponse mapping",
    type: "BUG_FIX",
    sprint: "SPRINT-05",
    storyPoints: 3,
    plannedDays: 3,
  },
  {
    id: 5,
    name: "Fix frontend Transaction page",
    type: "BUG_FIX",
    sprint: "SPRINT-05",
    storyPoints: 3,
    plannedDays: 3,
  },
  {
    id: 8,
    name: "Fix high vulnerability WalletClient",
    type: "SECURITY",
    sprint: "SPRINT-05",
    storyPoints: 5,
    plannedDays: 5,
  },
  {
    id: 9,
    name: "Fix backward compatibility IbanValidator",
    type: "BUG_FIX",
    sprint: "SPRINT-05",
    storyPoints: 3,
    plannedDays: 4,
  },
  {
    id: 10,
    name: "Fix SQL injection TransactionService",
    type: "SECURITY",
    sprint: "SPRINT-05",
    storyPoints: 5,
    plannedDays: 5,
  },
  {
    id: 11,
    name: "Fix XSS vulnerability CreateQRCode.js",
    type: "SECURITY",
    sprint: "SPRINT-06",
    storyPoints: 3,
    plannedDays: 4,
  },
];

// =========================================================================
// h(A→O): Suggest Impact Analysis
// =========================================================================
export const DEMO_IMPACT: Record<number, AnalysisResult> = {
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
        approvalStatus: "PENDING_APPROVAL",
        pipelineCode: "BUILD-101",
      },
      {
        microserviceId: 6,
        microserviceName: "common-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "PENDING_APPROVAL",
        pipelineCode: "MANUAL-BUILD",
      },
      {
        microserviceId: 2,
        microserviceName: "wallet-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "PENDING_APPROVAL",
      },
      {
        microserviceId: 3,
        microserviceName: "transaction-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "PENDING_APPROVAL",
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
      {
        microserviceId: 6,
        microserviceName: "common-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "APPROVED",
        approvedBy: "thailq",
      },
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
        reason: "Can them API call moi",
      },
    ],
    suggestedPipelines: [
      {
        microserviceId: 7,
        microserviceName: "frontend",
        suggestedTrigger: "AUTO",
        environment: "DEV",
        approvalStatus: "NOT_REQUIRED",
        pipelineCode: "frontend-build-67",
      },
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
        reason: "Sua join query",
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
        approvalStatus: "APPROVED",
        approvedBy: "thailq",
        pipelineCode: "BUILD-88",
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
        reason: "Fix field mapping",
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
      {
        microserviceId: 7,
        microserviceName: "frontend",
        suggestedTrigger: "AUTO",
        environment: "DEV",
        approvalStatus: "NOT_REQUIRED",
        pipelineCode: "frontend-build-67",
      },
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
        approvalStatus: "PENDING_APPROVAL",
      },
      {
        microserviceId: 2,
        microserviceName: "wallet-management-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "PENDING_APPROVAL",
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
        reason: "Fix logic IbanValidator",
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
      {
        microserviceId: 6,
        microserviceName: "common-service",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "APPROVED",
        approvedBy: "thailq",
      },
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
        approvalStatus: "PENDING_APPROVAL",
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
      {
        microserviceId: 7,
        microserviceName: "frontend",
        suggestedTrigger: "MANUAL",
        environment: "DEV",
        approvalStatus: "PENDING_APPROVAL",
      },
    ],
    riskAssessment: "HIGH",
    requiresApproval: true,
  },
};

// =========================================================================
// m(P→M): Pipeline Metrics
// =========================================================================
export const DEMO_METRICS: Record<number, PipelineMetrics[]> = {
  1: [
    {
      pipelineCode: "BUILD-101",
      microservice: "payment-management-service",
      totalDurationMin: 18,
      testsPassed: 142,
      testsTotal: 142,
      lineCoverage: 85.2,
      branchCoverage: 78.5,
      vulnerabilities: { critical: 0, high: 1, medium: 3, low: 0 },
      status: "SUCCESS",
      steps: [
        { name: "Git Checkout", type: "GIT_COMMIT", durationSec: 30, status: "PASSED" },
        { name: "Maven Build", type: "CICD_BUILD", durationSec: 150, status: "PASSED" },
        { name: "Unit Test", type: "UNIT_TEST", durationSec: 180, status: "PASSED", detail: "142/142 pass" },
        {
          name: "Code Coverage",
          type: "CODE_COVERAGE",
          durationSec: 90,
          status: "PASSED",
          detail: "85.2% line, 78.5% branch",
        },
        {
          name: "BlackDuck Scan",
          type: "BLACK_DUCK_SCAN",
          durationSec: 270,
          status: "PASSED",
          detail: "0 critical, 1 high",
        },
        { name: "Security Scan", type: "SECURITY_SCAN", durationSec: 240, status: "PASSED", detail: "0 critical" },
        { name: "Docker Build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
      ],
    },
    {
      pipelineCode: "DEPLOY-DEV-55",
      microservice: "payment-management-service",
      totalDurationMin: 3,
      testsPassed: 1,
      testsTotal: 1,
      lineCoverage: 0,
      branchCoverage: 0,
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
      status: "SUCCESS",
      steps: [
        { name: "Deploy to DEV", type: "CICD_DEPLOY", durationSec: 120, status: "PASSED" },
        { name: "Health Check", type: "INTEGRATION_TEST", durationSec: 60, status: "PASSED" },
      ],
    },
  ],
  4: [
    {
      pipelineCode: "BUILD-88",
      microservice: "transaction-management-service",
      totalDurationMin: 15,
      testsPassed: 98,
      testsTotal: 98,
      lineCoverage: 82.1,
      branchCoverage: 75.0,
      vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
      status: "SUCCESS",
      steps: [
        { name: "Git Checkout", type: "GIT_COMMIT", durationSec: 25, status: "PASSED" },
        { name: "Maven Build", type: "CICD_BUILD", durationSec: 155, status: "PASSED" },
        { name: "Unit Test", type: "UNIT_TEST", durationSec: 150, status: "PASSED", detail: "98/98 pass" },
        { name: "Code Coverage", type: "CODE_COVERAGE", durationSec: 60, status: "PASSED", detail: "82.1% line" },
        { name: "Security Scan", type: "SECURITY_SCAN", durationSec: 210, status: "PASSED" },
        { name: "Docker Build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
      ],
    },
  ],
  3: [
    {
      pipelineCode: "frontend-build-67",
      microservice: "frontend",
      totalDurationMin: 8,
      testsPassed: 45,
      testsTotal: 45,
      lineCoverage: 70.5,
      branchCoverage: 65.0,
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 2 },
      status: "SUCCESS",
      steps: [
        { name: "npm install", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
        { name: "npm test", type: "UNIT_TEST", durationSec: 120, status: "PASSED", detail: "45/45 pass" },
        { name: "npm run build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
        { name: "Docker Build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
      ],
    },
  ],
  5: [
    {
      pipelineCode: "frontend-build-67",
      microservice: "frontend",
      totalDurationMin: 8,
      testsPassed: 45,
      testsTotal: 45,
      lineCoverage: 70.5,
      branchCoverage: 65.0,
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 2 },
      status: "SUCCESS",
      steps: [
        { name: "npm install", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
        { name: "npm test", type: "UNIT_TEST", durationSec: 120, status: "PASSED", detail: "45/45 pass" },
        { name: "npm run build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
        { name: "Docker Build", type: "CICD_BUILD", durationSec: 120, status: "PASSED" },
      ],
    },
  ],
};

// =========================================================================
// r(M→A): Effort Analysis (Feedback)
// =========================================================================
export const DEMO_EFFORT: Record<number, EffortAnalysis> = {
  1: {
    plannedDays: 10,
    actualPipelineMin: 21,
    affectedServices: 2,
    pipelineRuns: 2,
    bottleneck: "BlackDuck Scan (270s) la step ton thoi gian nhat trong BUILD-101",
    pmAction:
      "Sprint sau co task tuong tu (xuyen nhieu service) → PM nen estimate story points cao hon, allocate them thoi gian cho security scan",
  },
  2: {
    plannedDays: 10,
    actualPipelineMin: 0,
    affectedServices: 1,
    pipelineRuns: 0,
    bottleneck: "Khong co pipeline tu dong (common-service la library)",
    pmAction: "Library change can quy trinh rieng. Sprint sau allocate thoi gian cho manual testing",
  },
  3: {
    plannedDays: 8,
    actualPipelineMin: 8,
    affectedServices: 1,
    pipelineRuns: 1,
    bottleneck: "Khong co bottleneck dang ke",
    pmAction: "Frontend-only task chay nhanh → sprint sau task tuong tu co the estimate thap hon",
  },
  4: {
    plannedDays: 3,
    actualPipelineMin: 18,
    affectedServices: 1,
    pipelineRuns: 2,
    bottleneck: "Maven Build + Security Scan",
    pmAction:
      "Bug fix don gian nhung can 2 pipeline runs (build + deploy). Sprint sau estimate BUG_FIX backend 3 SP la hop ly",
  },
  5: {
    plannedDays: 3,
    actualPipelineMin: 8,
    affectedServices: 1,
    pipelineRuns: 1,
    bottleneck: "Khong co",
    pmAction: "Frontend bug fix rat nhanh → sprint sau co the estimate 1-2 SP thay vi 3",
  },
};

// =========================================================================
// f(O→S): Trace Records (Layer A → S)
// =========================================================================
export const DEMO_TRACES: Record<number, TraceRecord[]> = {
  1: [
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "MICROSERVICE",
      toName: "payment-management-service",
      relationType: "AFFECTS_DIRECTLY",
      createdAt: "2026-04-15T09:30:00Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "MICROSERVICE",
      toName: "wallet-management-service",
      relationType: "AFFECTS_INDIRECTLY",
      createdAt: "2026-04-15T09:30:00Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "MICROSERVICE",
      toName: "common-service",
      relationType: "AFFECTS_INDIRECTLY",
      createdAt: "2026-04-15T09:30:00Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "SOURCE_FILE",
      toName: "PaymentController",
      relationType: "MODIFIES",
      createdAt: "2026-04-15T09:30:01Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "SOURCE_FILE",
      toName: "PaymentService",
      relationType: "MODIFIES",
      createdAt: "2026-04-15T09:30:01Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "SOURCE_FILE",
      toName: "ValidIban",
      relationType: "MODIFIES",
      createdAt: "2026-04-15T09:30:02Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "SOURCE_FILE",
      toName: "IbanValidator",
      relationType: "MODIFIES",
      createdAt: "2026-04-15T09:30:02Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "FUNCTION",
      toName: "PaymentService.transferFunds",
      relationType: "MODIFIES",
      createdAt: "2026-04-15T09:30:03Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "PIPELINE",
      toName: "BUILD-101",
      relationType: "TRIGGERS",
      createdAt: "2026-04-15T09:30:04Z",
    },
    {
      group: "TG-TASK-001",
      fromType: "ARTIFACT",
      fromName: "Artifact-1",
      toType: "PIPELINE",
      toName: "DEPLOY-DEV-55",
      relationType: "TRIGGERS",
      createdAt: "2026-04-15T09:30:04Z",
    },
  ],
};
