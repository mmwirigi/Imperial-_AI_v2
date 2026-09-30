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
