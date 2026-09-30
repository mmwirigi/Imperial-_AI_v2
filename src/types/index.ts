export type McpStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export type WordPressType = 'SELF_HOSTED' | 'WORDPRESS_COM' | 'HEADLESS' | 'MULTISITE';

export type SeoPlugin = 'YOAST' | 'RANK_MATH' | 'AIO_SEO' | 'THE_SEO_FRAMEWORK' | 'NONE';

export type PageBuilder = 'GUTENBERG' | 'ELEMENTOR' | 'DIVI' | 'BEAVER_BUILDER' | 'BRICKS' | 'NONE';

export type TaskState = 
  | 'DRAFT'
  | 'PLANNED'
  | 'AWAITING_APPROVAL'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ApprovalRequirement = 'NONE' | 'REQUIRED' | 'APPROVED' | 'REJECTED';

export type DangerousActionType =
  | 'DELETE_PAGE'
  | 'DELETE_POST'
  | 'CHANGE_SITE_SETTINGS'
  | 'PUBLISH_CONTENT'
  | 'MODIFY_PLUGIN'
  | 'MODIFY_THEME'
  | 'CHANGE_USER'
  | 'CHANGE_DNS_SETTINGS'
  | 'BULK_EDIT_CONTENT'
  | 'READ_ONLY_AUDIT';

export interface PermissionPolicy {
  siteId: string;
  requireApprovalForDeletePages: boolean;
  requireApprovalForDeletePosts: boolean;
  requireApprovalForSiteSettings: boolean;
  requireApprovalForPublishing: boolean;
  requireApprovalForPlugins: boolean;
  requireApprovalForThemes: boolean;
  requireApprovalForUsers: boolean;
  requireApprovalForDns: boolean;
  requireApprovalForBulkEdit: boolean;
}

export interface Site {
  id: string;
  siteName: string;
  websiteUrl: string;
  clientCompanyName: string;
  mcpEndpoint: string;
  mcpStatus: McpStatus;
  wordPressType: WordPressType;
  seoPlugin: SeoPlugin;
  pageBuilder: PageBuilder;
  notes: string;
  aiInstructions: string;
  permissionPolicy: PermissionPolicy;
  lastConnection: string;
  lastActivity: string;
  isDemo?: boolean;
}

export interface ExecutionResult {
  summary: string;
  logs: string[];
  executionDurationMs: number;
  completedAt: string;
  success: boolean;
}

export type TaskCategory = 
  | 'SECURITY' 
  | 'MAINTENANCE' 
  | 'CONTENT' 
  | 'SEO' 
  | 'PERFORMANCE' 
  | 'GENERAL';

export interface Task {
  id: string;
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  category: TaskCategory;
  createdDate: string;
  updatedDate: string;
  status: TaskState;
  requestedAction: string;
  dangerousActionType: DangerousActionType;
  approvalRequirement: ApprovalRequirement;
  executionResult?: ExecutionResult | null;
}

export interface ChatConversation {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export interface ToolCallData {
  toolName: string;
  callId: string;
  argumentsSummary: string;
  status: 'PROPOSED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
}

export interface ToolResultData {
  toolName: string;
  callId: string;
  outputSummary: string;
  executionDurationMs: number;
  isError?: boolean;
}

export interface ApprovalPromptData {
  actionType: DangerousActionType;
  description: string;
  targetResource: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AIUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number | null;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  siteId: string;
  sender: MessageRole;
  content: string;
  timestamp: string;
  toolCall?: ToolCallData;
  toolResult?: ToolResultData;
  approvalPrompt?: ApprovalPromptData;
  isStreaming?: boolean;
  isInterrupted?: boolean;
  usage?: AIUsage | null;
  error?: string | null;
  modelName?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  inputCost: number;     // USD per 1,000,000 tokens
  outputCost: number;    // USD per 1,000,000 tokens
  supportsVision: boolean;
  supportsTools: boolean;
  supportsReasoning: boolean;
  supportsStreaming: boolean;
  isFree: boolean;
  modality: string;
  isDefault?: boolean;
}

export interface OpenRouterConfig {
  apiKey: string | null;
  maskedApiKey: string | null;
  isConnected: boolean;
  selectedDefaultModelId: string;
  lastUpdated: string;
}

export interface MCPConnection {
  id: string;
  siteId: string;
  endpointUrl: string;
  transportType: 'SSE' | 'WEBSOCKET' | 'STDIO' | 'STREAMABLE_HTTP';
  status: McpStatus;
  lastHeartbeat: string;
  latencyMs: number;
  discoveredToolsCount: number;
}

export type McpAuthType = 'NONE' | 'BEARER_TOKEN' | 'OAUTH2';

export type ToolRiskLevel = 'READ' | 'LOW_RISK_WRITE' | 'HIGH_RISK_WRITE' | 'DESTRUCTIVE';

export interface McpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, any>;
  serverId: string;
  siteId: string;
  enabled?: boolean;
  requiresApproval: boolean;
  riskLevel: ToolRiskLevel;
}

export type McpConnectionStatus = 
  | 'NOT_CONFIGURED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'AUTH_REQUIRED' 
  | 'AUTHENTICATING' 
  | 'ERROR' 
  | 'SESSION_EXPIRED';

export interface MCPServer {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  siteId: string;
  enabled: boolean;
  connectionStatus: McpConnectionStatus;
  transport: 'STREAMABLE_HTTP' | 'SSE' | 'WEBSOCKET';
  authenticationType: McpAuthType;
  lastConnected?: string | null;
  lastError?: string | null;
  serverInfo?: { name: string; version: string } | null;
  protocolVersion?: string | null;
  capabilities?: { tools: boolean; prompts: boolean; resources: boolean; logging: boolean } | null;
  discoveredToolsCount: number;
  createdAt?: number;
  updatedAt?: number;
  isDemo?: boolean;
}

export interface ActiveSiteContext {
  siteId: string;
  siteName: string;
  websiteUrl: string;
  activeMcpServerId?: string | null;
  activeConversationId?: string | null;
}

export interface ToolExecutionRequest {
  executionId: string;
  siteId: string;
  mcpServerId: string;
  toolName: string;
  arguments: Record<string, any>;
  conversationId?: string | null;
  operatorAuthorized: boolean;
}

export interface ConnectionTestReport {
  success: boolean;
  latencyMs: number;
  serverName?: string | null;
  serverVersion?: string | null;
  protocolVersion?: string | null;
  discoveredToolsCount: number;
  errorMessage?: string | null;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  siteId: string;
  siteName: string;
  userAction: string;
  aiAction: string;
  tool: string;
  parametersSummary: string;
  resultSummary: string;
  approvalStatus: string;
  isSuccess: boolean;
}

// =========================================================
// Phase 6: Universal WordPress Intelligence Adapter Types
// =========================================================

export interface SiteStackProfile {
  siteId: string;
  siteName: string;
  siteUrl: string;
  wordpressVersion?: string | null;
  phpVersion?: string | null;
  themeName?: string | null;
  activePlugins: string[];
  pageBuilder?: string | null;
  seoPlugin?: string | null;
  formsPlugin?: string | null;
  commercePlatform?: string | null;
  learningPlatform?: string | null;
  bookingPlatform?: string | null;
  backupPlugin?: string | null;
  mcpCapabilities: string[];
  lastInspectedAt: number;
}

export type CapabilityCategory = 
  | 'SITE'
  | 'CONTENT'
  | 'PAGES'
  | 'POSTS'
  | 'MEDIA'
  | 'USERS'
  | 'SEO'
  | 'FORMS'
  | 'PLUGINS'
  | 'THEMES'
  | 'BACKUPS'
  | 'WOOCOMMERCE'
  | 'LEARNPRESS'
  | 'BOOKING'
  | 'ELEMENTOR'
  | 'OTHER';

export interface WordPressCapability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
  available: boolean;
  mcpToolNames: string[];
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
}

export interface AuditFinding {
  id: string;
  siteId: string;
  category: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface WordPressCommand {
  id: string;
  title: string;
  description: string;
  category: CapabilityCategory;
  requiredCapabilityId: string;
  promptTemplate: string;
  isDestructive?: boolean;
}

export type WorkflowStage = 
  | 'AUDIT'
  | 'PROPOSE'
  | 'APPROVAL_PENDING'
  | 'BACKUP'
  | 'IMPLEMENT'
  | 'VERIFY'
  | 'REPORT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ChangeProposal {
  id: string;
  siteId: string;
  taskId: string;
  operation: string;
  target: string;
  currentState: string;
  proposedState: string;
  reason: string;
  requiresApproval: boolean;
}

export interface VerificationResult {
  success: boolean;
  siteId: string;
  tool: string;
  target: string;
  expectedState: string;
  actualState: string;
  differences: string;
  verifiedAt: number;
}

export interface WordPressTask {
  id: string;
  siteId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  workflowStage: WorkflowStage;
  riskLevel: ToolRiskLevel;
  affectedResources: string[];
  proposedChanges?: ChangeProposal | null;
  approvalRequestId?: string | null;
  backupCheckpointId?: string | null;
  executionSummary?: string | null;
  verificationSummary?: VerificationResult | null;
  report?: string | null;
  createdAt: number;
  updatedAt: number;
}

// =========================================================
// Phase 7: Production WordPress Operations & Autonomous Task Execution
// =========================================================

export type AgentExecutionMode = 'READ_ONLY' | 'PLAN' | 'EXECUTE';

export interface AutomaticStopConditions {
  siteChange: boolean;
  mcpDisconnect: boolean;
  authChange: boolean;
  capabilityChange: boolean;
  approvalInvalid: boolean;
  operationLimitExceeded: boolean;
  verificationFailure: boolean;
  rollbackNecessary: boolean;
  unexpectedToolResponse: boolean;
  taskContextInconsistent: boolean;
  wrongSiteDetected: boolean;
}

export interface AgentCircuitBreakers {
  maxOperationsPerTask: number;
  maxAffectedObjects: number;
  maxRetries: number;
  maxFailures: number;
  maxExecutionDurationSeconds: number;
  maxRiskLevel: ToolRiskLevel;
  approvalThreshold: 'ALL_MUTATIONS' | 'HIGH_AND_CRITICAL' | 'CRITICAL_ONLY';
  automaticStopConditions: AutomaticStopConditions;
  stopOnConditionChange: boolean;
  autoRollbackOnVerifyFailure: boolean;
  rateLimitMs: number;
}

export type OperationDomain =
  | 'PAGES_POSTS'
  | 'SEO'
  | 'MEDIA_ALT'
  | 'ELEMENTOR'
  | 'FORMS'
  | 'PLUGINS_THEMES'
  | 'WOOCOMMERCE'
  | 'LEARNPRESS'
  | 'BOOKING'
  | 'BACKUPS';

export type StepState = 
  | 'PENDING' 
  | 'PREFLIGHT_CHECKPOINT' 
  | 'AWAITING_APPROVAL'
  | 'EXECUTING' 
  | 'VERIFYING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'ROLLED_BACK' 
  | 'SKIPPED';

export type RollbackMechanism =
  | 'MCP_ROLLBACK_TOOL'
  | 'WORDPRESS_REVISION'
  | 'STORED_PREVIOUS_VALUE'
  | 'BACKUP_RESTORATION'
  | 'UNAVAILABLE';

export type BackupStatus =
  | 'NOT_REQUESTED'
  | 'CHECKPOINTING'
  | 'VERIFYING_BACKUP'
  | 'VERIFIED'
  | 'FAILED'
  | 'UNAVAILABLE';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'INVALIDATED_TAMPERED';

export type RecoveryWorkflowAction =
  | 'RETRY_FAILED'
  | 'MANUAL_INTERVENTION'
  | 'ROLLBACK_CHECKPOINT'
  | 'SKIP_WITH_APPROVAL';

export type McpHealthStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'authentication_expired' 
  | 'tool_unavailable' 
  | 'schema_capability_changed';

export type SiteHealthStatus = 
  | 'reachable' 
  | 'unavailable' 
  | 'authentication_failure' 
  | 'capability_changes';

export type TaskHealthCategory = 
  | 'running' 
  | 'paused' 
  | 'failed' 
  | 'verification_failure' 
  | 'rollback_required';

export type SecurityEventType =
  | 'WRONG_SITE_EXECUTION_BLOCKED'
  | 'APPROVAL_INVALIDATED'
  | 'UNAUTHORIZED_OPERATION'
  | 'CAPABILITY_MISMATCH'
  | 'LIMIT_EXCEEDED'
  | 'AUTHENTICATION_FAILURE'
  | 'MCP_TOOL_NOT_FOUND'
  | 'VERIFICATION_FAILURE';

export interface SecurityEventItem {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  siteId: string;
  siteName: string;
  clientId: string;
  taskId?: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
}

export interface ExecutionJournalEntry {
  id: string;
  timestamp: string;
  taskId: string;
  clientId: string;
  siteId: string;
  operationId: string;
  mcpTool: string;
  argumentsRedacted: string;
  securityResult: 'PERMITTED' | 'BLOCKED';
  approvalId?: string;
  executionResult: 'SUCCESS' | 'FAILED';
  verificationResult: 'VERIFIED' | 'FAILED' | 'SKIPPED';
  rollbackResult?: string;
}

export interface TaskFailureReport {
  resource: string;
  operation: string;
  error: string;
  retryability: boolean;
  verificationResult: string;
  rollbackStatus: string;
}

export interface ProductionTaskStep {
  id: string;
  stepNumber: number;
  title: string;
  domain: OperationDomain;
  targetResource: string;
  action: string;
  state: StepState;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  isApproved?: boolean;
  preState?: string;
  proposedState?: string;
  executedState?: string;
  verificationExpected?: string;
  verificationActual?: string;
  error?: string;
  checkpointId?: string;
  rollbackPayload?: Record<string, any>;
  durationMs?: number;
}

export interface ProductionTask {
  id: string;
  clientId: string;
  siteId: string;
  siteName: string;
  connectionId: string;
  title: string;
  naturalLanguagePrompt: string;
  domain: OperationDomain;
  overallStatus: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  operationHash: string;
  steps: ProductionTaskStep[];
  currentStepIndex: number;
  riskLevel: ToolRiskLevel;
  requiresPreflightBackup: boolean;
  backupStatus: BackupStatus;
  backupCheckpointId?: string | null;
  rollbackMechanism: RollbackMechanism;
  successCount: number;
  failureCount: number;
  failures: TaskFailureReport[];
  journal: ExecutionJournalEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  canResume?: boolean;
  canRollback?: boolean;
  executionLogs: string[];
}

export interface BackupCheckpoint {
  id: string;
  siteId: string;
  siteName: string;
  timestamp: string;
  label: string;
  operationType: OperationDomain;
  affectedResources: string[];
  snapshotData: Record<string, any>;
  restoreStatus: 'AVAILABLE' | 'RESTORED' | 'FAILED';
  sizeKb: number;
  isVerifiedBackup: boolean;
}

export interface BulkOperationItem {
  id: string;
  resourceId: string;
  title: string;
  url?: string;
  currentValue: string;
  proposedValue: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'VERIFIED' | 'FAILED';
  verificationDiff?: string;
  error?: string;
}

export interface BulkOperationBatch {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  domain: OperationDomain;
  description: string;
  items: BulkOperationItem[];
  maxBatchSize: number;
  approvedCount: number;
  completedCount: number;
  failedCount: number;
  checkpointId?: string;
  operationHash: string;
  status: 'DRAFT' | 'REVIEWING' | 'EXECUTING' | 'COMPLETED' | 'PARTIAL_FAIL' | 'ROLLED_BACK';
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedApprovalItem {
  id: string;
  userId: string;
  taskId: string;
  stepId?: string;
  siteId: string;
  siteName: string;
  clientId: string;
  clientName: string;
  title: string;
  domain: OperationDomain;
  riskLevel: ToolRiskLevel;
  targetResource: string;
  actionSummary: string;
  operationIds: string[];
  operationHash: string;
  previousValue: string;
  proposedValue: string;
  approvedScope: string;
  approvedLimits: { maxAffectedObjects: number; maxOperations: number };
  backupStatus: BackupStatus;
  rollbackMechanism: RollbackMechanism;
  affectedObjects: Array<{
    id: string;
    name: string;
    resourceType: string;
    currentVal: string;
    proposedVal: string;
    risk: ToolRiskLevel;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }>;
  status: ApprovalStatus;
  requestedAt: string;
  expiresAt: string;
  invalidationReason?: string;
  decidedAt?: string;
  operator?: string;
  comments?: string;
}

export interface ProductionMonitorMetrics {
  mcpLatencyMs: number;
  mcpUptimePercent: number;
  mcpLastPing: string;
  siteResponseTimeMs: number;
  sslValid: boolean;
  activeDiscoveredTools: number;
  tasksQueuedCount: number;
  tasksRunningCount: number;
  tasksFailedCount: number;
  verificationsFailedCount: number;
  capabilityDriftDetected: boolean;
  driftSummary?: string;
  securityInterceptionsCount: number;
  authHealthy: boolean;
  tokenExpiresAt: string;
}

export interface ProductionTestCase {
  id: string;
  name: string;
  category: 'APPROVAL' | 'BACKUP' | 'VERIFY' | 'ROLLBACK' | 'BULK' | 'ISOLATION' | 'SECURITY' | 'TELEMETRY' | 'INVARIANT' | 'INTEGRATION';
  description: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  logs: string[];
  durationMs?: number;
  assertionsPassed: number;
  assertionsTotal: number;
  error?: string;
}

export interface ProductionReport {
  id: string;
  taskId: string;
  taskTitle: string;
  site: { id: string; name: string; url: string };
  client: { id: string; name: string };
  createdAt: string;
  completedAt: string;
  userRequest: string;
  plan: {
    plannedOperationsCount: number;
    affectedDomains: string[];
    summary: string;
  };
  approval: {
    approvedBy: string;
    approvedAt: string;
    approvedScope: string;
    status: ApprovalStatus;
    operationHash: string;
  };
  backup: {
    status: BackupStatus;
    checkpointId?: string;
    verified: boolean;
    message: string;
  };
  execution: {
    totalOperations: number;
    successful: number;
    failed: number;
    skipped: number;
    durationSeconds: number;
  };
  verification: {
    passed: number;
    failed: number;
    summary: string;
  };
  rollback: {
    performed: boolean;
    mechanism: RollbackMechanism;
    status: string;
  };
  security: {
    checksPassed: string[];
    interceptedEventsCount: number;
  };
  errors: Array<{
    resource: string;
    operation: string;
    error: string;
    retryability: boolean;
  }>;
  finalStatus: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'ROLLED_BACK';
}

export interface SecurityInvariantItem {
  id: string;
  invariantNumber: number;
  title: string;
  description: string;
  enforcedBy: 'PHASE_5_SECURITY' | 'PHASE_6_CAPABILITY' | 'PHASE_7_ORCHESTRATOR';
  status: 'PASSED' | 'FAILED' | 'VERIFYING';
  lastAsserted: string;
  evidence: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: 'CORE_ENGINE' | 'WORDPRESS_OPS' | 'APPROVAL_VERIFY' | 'ISOLATION_SECURITY' | 'MONITORING_TESTS';
  status: 'VERIFIED' | 'FAILED';
  notes: string;
}

export interface IntegrationWorkflowStep {
  id: string;
  stepNumber: number;
  label: string;
  description: string;
  authority: 'USER' | 'PHASE_5' | 'PHASE_6' | 'PHASE_7';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  outputSnippet?: string;
}


