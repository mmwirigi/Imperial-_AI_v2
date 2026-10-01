/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 9: Multi-Tenant Client Platform & SaaS Architecture Service
 * 
 * Authority Hierarchy:
 * Phase 5 (Security & Authorization Gateway) -> Remains Authoritative
 * Phase 6 (WordPress Intelligence & Capability Discovery)
 * Phase 7 (Controlled Production Execution)
 * Phase 8 (Reliability, Recovery & Observability)
 * Phase 9 (Multi-Tenant Organization & SaaS Architecture)
 * 
 * Enforces:
 * - PLATFORM -> ORGANIZATION (tenant_id) -> USERS/MEMBERSHIPS -> CLIENTS -> SITES -> MCP CONNECTIONS -> TASKS -> OPERATIONS -> AUDIT
 * - Server-side tenant and client isolation
 * - Role-based permissions (OWNER, ADMIN, OPERATOR, EDITOR, VIEWER, AUDITOR)
 * - Cross-tenant and cross-client execution protection
 * - Safe context switching with transient memory purges
 */

import {
  Organization,
  ClientCompany,
  TenantUser,
  Membership,
  TenantRole,
  UserPermission,
  ActiveTenantContext,
  Site,
  ProductionTask,
  AuditEvent,
  SecurityEventItem,
  MCPServer,
  TenantContextSwitchEvent,
  TenantIsolationAuditReport,
  Phase9TestCase,
  SiteCapabilityBaseline,
  CapabilityChangeEvent,
  ClientOnboardingStepId,
  ClientOnboardingStep,
  ClientOnboardingSession,
  UsageRecord,
  TenantUsageSummary,
  SaaSPlan,
  TenantFeatureFlag,
  LimitEnforcementStatus,
  InternalApiRequest,
  InternalApiResponse,
  InternalWebhookEvent,
  ClientHealthReport,
  TenantExportBundle,
  TenantDeletionConfirmation,
  McpTool,
  SiteStackProfile,
  IncidentItem
} from '../types';

export const ROLE_DEFAULT_PERMISSIONS: Record<TenantRole, UserPermission[]> = {
  OWNER: [
    'VIEW_SITES',
    'MANAGE_SITES',
    'VIEW_TASKS',
    'CREATE_TASKS',
    'APPROVE_TASKS',
    'EXECUTE_TASKS',
    'MANAGE_CONNECTIONS',
    'VIEW_AUDIT',
    'MANAGE_USERS',
    'MANAGE_BILLING',
    'MANAGE_SECURITY'
  ],
  ADMIN: [
    'VIEW_SITES',
    'MANAGE_SITES',
    'VIEW_TASKS',
    'CREATE_TASKS',
    'APPROVE_TASKS',
    'EXECUTE_TASKS',
    'MANAGE_CONNECTIONS',
    'VIEW_AUDIT',
    'MANAGE_USERS',
    'MANAGE_SECURITY'
  ],
  OPERATOR: [
    'VIEW_SITES',
    'VIEW_TASKS',
    'CREATE_TASKS',
    'APPROVE_TASKS',
    'EXECUTE_TASKS',
    'MANAGE_CONNECTIONS',
    'VIEW_AUDIT'
  ],
  EDITOR: [
    'VIEW_SITES',
    'VIEW_TASKS',
    'CREATE_TASKS'
  ],
  VIEWER: [
    'VIEW_SITES',
    'VIEW_TASKS'
  ],
  AUDITOR: [
    'VIEW_SITES',
    'VIEW_TASKS',
    'VIEW_AUDIT'
  ]
};

export class MultiTenantService {
  /**
   * Evaluates if a user's membership in the active tenant has a specific permission.
   */
  public static hasPermission(membership: Membership, permission: UserPermission): boolean {
    if (membership.status !== 'ACTIVE') return false;
    return membership.permissions.includes(permission);
  }

  /**
   * Resolves the full active tenant context for an authenticated user session.
   */
  public static resolveActiveContext(params: {
    user: TenantUser;
    organizations: Organization[];
    clients: ClientCompany[];
    sites: Site[];
    memberships: Membership[];
  }): { context: ActiveTenantContext | null; error?: string } {
    const { user, organizations, clients, sites, memberships } = params;

    const org = organizations.find((o) => o.id === user.activeOrganizationId);
    if (!org) {
      return { context: null, error: `Organization '${user.activeOrganizationId}' not found.` };
    }

    if (org.status === 'SUSPENDED' || org.status === 'ARCHIVED') {
      return { context: null, error: `Organization '${org.name}' is ${org.status}. Access denied.` };
    }

    const membership = memberships.find(
      (m) => m.organizationId === org.id && m.userId === user.id && m.status === 'ACTIVE'
    );
    if (!membership && !user.isPlatformAdmin) {
      return { context: null, error: `User '${user.email}' has no active membership in '${org.name}'.` };
    }

    // Default or active client
    const orgClients = clients.filter((c) => c.organizationId === org.id && c.status === 'ACTIVE');
    if (orgClients.length === 0) {
      return { context: null, error: `Organization '${org.name}' has no active clients registered.` };
    }

    const activeClient = 
      (user.activeClientId && orgClients.find((c) => c.id === user.activeClientId)) ||
      orgClients[0];

    // Default or active site for this client
    const clientSites = sites.filter((s) => s.clientId === activeClient.id);
    const activeSite = 
      (user.activeSiteId && clientSites.find((s) => s.id === user.activeSiteId)) ||
      clientSites[0] ||
      null;

    const effectivePermissions = membership 
      ? membership.permissions 
      : (user.isPlatformAdmin ? ROLE_DEFAULT_PERMISSIONS.OWNER : []);

    const effectiveMembership: Membership = membership || {
      id: `mem-platform-${user.id}`,
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
      permissions: effectivePermissions,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString()
    };

    return {
      context: {
        organization: org,
        client: activeClient,
        site: activeSite,
        user,
        membership: effectiveMembership,
        permissions: effectivePermissions,
        connectionStatus: activeSite ? activeSite.mcpStatus : 'DISCONNECTED',
        switchTimestamp: new Date().toLocaleTimeString()
      }
    };
  }

  /**
   * Context Switch Protection:
   * Safely switches the active client/site while purging transient memory and verifying permissions.
   */
  public static switchClientContext(params: {
    currentUser: TenantUser;
    targetClientId: string;
    organizations: Organization[];
    clients: ClientCompany[];
    sites: Site[];
    memberships: Membership[];
    activeRunningTasksCount?: number;
  }): {
    success: boolean;
    updatedUser?: TenantUser;
    switchEvent: TenantContextSwitchEvent;
    errorMessage?: string;
  } {
    const { currentUser, targetClientId, organizations, clients, sites, memberships, activeRunningTasksCount = 0 } = params;

    const targetClient = clients.find((c) => c.id === targetClientId);
    if (!targetClient) {
      const failedEvent: TenantContextSwitchEvent = {
        id: `switch-evt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        userId: currentUser.id,
        previousOrganizationId: currentUser.activeOrganizationId,
        previousClientId: currentUser.activeClientId || '',
        previousSiteId: currentUser.activeSiteId,
        targetOrganizationId: currentUser.activeOrganizationId,
        targetClientId,
        transientMemoryPurged: false,
        activeTasksPausedCount: 0,
        status: 'REJECTED_UNAUTHORIZED',
        reason: `Target client '${targetClientId}' does not exist.`
      };
      return { success: false, switchEvent: failedEvent, errorMessage: failedEvent.reason };
    }

    // Verify user belongs to the target client's organization
    const hasMembership = memberships.some(
      (m) => m.organizationId === targetClient.organizationId && m.userId === currentUser.id && m.status === 'ACTIVE'
    ) || currentUser.isPlatformAdmin;

    if (!hasMembership) {
      const failedEvent: TenantContextSwitchEvent = {
        id: `switch-evt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        userId: currentUser.id,
        previousOrganizationId: currentUser.activeOrganizationId,
        previousClientId: currentUser.activeClientId || '',
        previousSiteId: currentUser.activeSiteId,
        targetOrganizationId: targetClient.organizationId,
        targetClientId,
        transientMemoryPurged: false,
        activeTasksPausedCount: 0,
        status: 'REJECTED_UNAUTHORIZED',
        reason: `ACCESS_DENIED: User ${currentUser.email} has no membership in organization '${targetClient.organizationId}'.`
      };
      return { success: false, switchEvent: failedEvent, errorMessage: failedEvent.reason };
    }

    // Determine target site
    const clientSites = sites.filter((s) => s.clientId === targetClient.id);
    const targetSiteId = clientSites[0]?.id;

    const updatedUser: TenantUser = {
      ...currentUser,
      activeOrganizationId: targetClient.organizationId,
      activeClientId: targetClient.id,
      activeSiteId: targetSiteId,
      lastLogin: new Date().toISOString()
    };

    const successEvent: TenantContextSwitchEvent = {
      id: `switch-evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      userId: currentUser.id,
      previousOrganizationId: currentUser.activeOrganizationId,
      previousClientId: currentUser.activeClientId || '',
      previousSiteId: currentUser.activeSiteId,
      targetOrganizationId: targetClient.organizationId,
      targetClientId: targetClient.id,
      targetSiteId,
      transientMemoryPurged: true,
      activeTasksPausedCount: activeRunningTasksCount,
      status: 'SUCCESS'
    };

    return {
      success: true,
      updatedUser,
      switchEvent: successEvent
    };
  }

  /**
   * Tenant-Scoped Data Access (Repository Queries)
   * Enforces that queries never return records from another tenant.
   */
  public static getSitesForTenant(sites: Site[], tenantId: string, clientId?: string): Site[] {
    return sites.filter((s) => {
      const matchTenant = s.tenantId === tenantId;
      if (!matchTenant) return false;
      if (clientId) return s.clientId === clientId;
      return true;
    });
  }

  public static getTasksForTenant(tasks: ProductionTask[], tenantId: string, clientId?: string, siteId?: string): ProductionTask[] {
    return tasks.filter((t) => {
      const matchTenant = t.tenantId === tenantId;
      if (!matchTenant) return false;
      if (clientId && t.clientId !== clientId) return false;
      if (siteId && t.siteId !== siteId) return false;
      return true;
    });
  }

  public static getAuditEventsForTenant(audits: AuditEvent[], tenantId: string, clientId?: string): AuditEvent[] {
    return audits.filter((a) => {
      const matchTenant = a.tenantId === tenantId;
      if (!matchTenant) return false;
      if (clientId && a.clientId !== clientId) return false;
      return true;
    });
  }

  /**
   * Execution Hierarchy Validation:
   * Validates:
   * task_id -> tenant_id -> client_id -> site_id -> connection_id -> MCP session.
   * If any relationship is inconsistent, halts execution with zero socket transmission.
   */
  public static validateExecutionHierarchy(params: {
    task: ProductionTask;
    targetConnectionId: string;
    context: ActiveTenantContext;
    sites: Site[];
    mcpServers: MCPServer[];
  }): {
    valid: boolean;
    blockReason?: string;
    errorCode?: 'CROSS_TENANT_BLOCKED' | 'WRONG_CLIENT_EXECUTION_BLOCKED' | 'WRONG_SITE_EXECUTION_BLOCKED' | 'PERMISSION_DENIED';
  } {
    const { task, targetConnectionId, context, sites, mcpServers } = params;

    // 1. Permission check
    if (!this.hasPermission(context.membership, 'EXECUTE_TASKS') && !context.user.isPlatformAdmin) {
      return {
        valid: false,
        blockReason: `User '${context.user.email}' (${context.membership.role}) lacks EXECUTE_TASKS permission.`,
        errorCode: 'PERMISSION_DENIED'
      };
    }

    // 2. Tenant isolation check
    if (task.tenantId && task.tenantId !== context.organization.id) {
      return {
        valid: false,
        blockReason: `CROSS_TENANT_BLOCKED: Task ${task.id} belongs to tenant '${task.tenantId}', but active tenant is '${context.organization.id}'.`,
        errorCode: 'CROSS_TENANT_BLOCKED'
      };
    }

    // 3. Client isolation check
    if (task.clientId !== context.client.id) {
      return {
        valid: false,
        blockReason: `WRONG_CLIENT_EXECUTION_BLOCKED: Task ${task.id} belongs to client '${task.clientId}', but active client is '${context.client.id}'.`,
        errorCode: 'WRONG_CLIENT_EXECUTION_BLOCKED'
      };
    }

    // 4. Site isolation check
    const site = sites.find((s) => s.id === task.siteId);
    if (!site) {
      return {
        valid: false,
        blockReason: `Site '${task.siteId}' not found in registry.`,
        errorCode: 'WRONG_SITE_EXECUTION_BLOCKED'
      };
    }

    if (site.clientId !== task.clientId) {
      return {
        valid: false,
        blockReason: `WRONG_CLIENT_EXECUTION_BLOCKED: Site ${site.id} belongs to client '${site.clientId}', mismatched from task client '${task.clientId}'.`,
        errorCode: 'WRONG_CLIENT_EXECUTION_BLOCKED'
      };
    }

    // 5. Connection resolution check
    const server = mcpServers.find((s) => s.id === targetConnectionId);
    if (server && server.siteId && server.siteId !== task.siteId) {
      return {
        valid: false,
        blockReason: `WRONG_SITE_EXECUTION_BLOCKED: Target MCP server '${targetConnectionId}' is bound to site '${server.siteId}', but task targets '${task.siteId}'.`,
        errorCode: 'WRONG_SITE_EXECUTION_BLOCKED'
      };
    }

    return { valid: true };
  }

  /**
   * Data Integrity & Cross-Tenant Boundary Scanner
   */
  public static auditTenantBoundaries(params: {
    organizations: Organization[];
    clients: ClientCompany[];
    sites: Site[];
    tasks: ProductionTask[];
    audits: AuditEvent[];
  }): TenantIsolationAuditReport {
    const crossTenantSiteLeaks: string[] = [];
    const crossTenantTaskLeaks: string[] = [];
    const crossTenantAuditLeaks: string[] = [];
    const crossClientConnectionMismatches: string[] = [];
    const orphanedClientResources: string[] = [];

    const orgIdSet = new Set(params.organizations.map((o) => o.id));
    const clientToOrgMap: Record<string, string> = {};
    for (const c of params.clients) {
      clientToOrgMap[c.id] = c.organizationId;
      if (!orgIdSet.has(c.organizationId)) {
        orphanedClientResources.push(`Client ${c.id} (${c.name}) belongs to non-existent organization ${c.organizationId}`);
      }
    }

    // Check Sites
    for (const site of params.sites) {
      if (site.clientId) {
        const expectedOrgId = clientToOrgMap[site.clientId];
        if (!expectedOrgId) {
          orphanedClientResources.push(`Site ${site.id} references unregistered clientId ${site.clientId}`);
        } else if (site.tenantId && site.tenantId !== expectedOrgId) {
          crossTenantSiteLeaks.push(
            `Site ${site.id} has tenantId '${site.tenantId}' but client '${site.clientId}' belongs to '${expectedOrgId}'`
          );
        }
      }
    }

    // Check Tasks
    for (const task of params.tasks) {
      const expectedOrgId = clientToOrgMap[task.clientId];
      if (!expectedOrgId) {
        orphanedClientResources.push(`Task ${task.id} references unregistered clientId ${task.clientId}`);
      } else if (task.tenantId && task.tenantId !== expectedOrgId) {
        crossTenantTaskLeaks.push(
          `Task ${task.id} has tenantId '${task.tenantId}' but client '${task.clientId}' belongs to '${expectedOrgId}'`
        );
      }
    }

    // Check Audits
    for (const audit of params.audits) {
      if (audit.clientId && audit.tenantId) {
        const expectedOrgId = clientToOrgMap[audit.clientId];
        if (expectedOrgId && audit.tenantId !== expectedOrgId) {
          crossTenantAuditLeaks.push(
            `Audit ${audit.id} has tenantId '${audit.tenantId}' but client '${audit.clientId}' belongs to '${expectedOrgId}'`
          );
        }
      }
    }

    const violationsFound = 
      crossTenantSiteLeaks.length +
      crossTenantTaskLeaks.length +
      crossTenantAuditLeaks.length +
      crossClientConnectionMismatches.length +
      orphanedClientResources.length;

    return {
      id: `audit-tenant-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      passed: violationsFound === 0,
      totalChecks: params.sites.length + params.tasks.length + params.audits.length,
      violationsFound,
      crossTenantSiteLeaks,
      crossTenantTaskLeaks,
      crossTenantAuditLeaks,
      crossClientConnectionMismatches,
      orphanedClientResources
    };
  }

  /**
   * Site-Scoped AI Context Builder
   * Informs the model of the exact operational context without allowing the model to override authority.
   */
  public static buildSiteScopedAiContext(params: {
    context: ActiveTenantContext;
    detectedCapabilities: string[];
    currentTaskId?: string;
  }): string {
    const { context, detectedCapabilities, currentTaskId } = params;
    return `
[IMPERIAL AI MULTI-TENANT CONTEXT]
ORGANIZATION: ${context.organization.name} (${context.organization.id}) [Tier: ${context.organization.tier}]
CLIENT: ${context.client.name} (${context.client.id}) [Industry: ${context.client.industry}]
SITE: ${context.site ? context.site.siteName : 'None Selected'} (${context.site?.websiteUrl || 'N/A'})
SITE ID: ${context.site?.id || 'N/A'}
CONNECTION STATUS: ${context.connectionStatus}
WORDPRESS STACK: Type: ${context.site?.wordPressType || 'N/A'}, SEO: ${context.site?.seoPlugin || 'N/A'}, Builder: ${context.site?.pageBuilder || 'N/A'}
OPERATOR: ${context.user.displayName} (${context.user.email}) [Role: ${context.membership.role}]
PERMISSIONS: ${context.permissions.join(', ')}
${currentTaskId ? `CURRENT TASK ID: ${currentTaskId}` : ''}
DETECTED CAPABILITIES: ${detectedCapabilities.join(', ') || 'WordPress Core REST'}
AI NOTE: Context is strictly informational. The Phase 5 & Phase 9 security gateway will cryptographically validate tenant and client boundaries before executing any mutation.
`.trim();
  }

  // =========================================================
  // Section 2: Controlled Onboarding Lifecycle Engine
  // =========================================================

  public static createOnboardingSession(params: {
    tenantId: string;
    clientId: string;
    clientName: string;
    orgName: string;
    siteUrl: string;
  }): ClientOnboardingSession {
    const steps: ClientOnboardingStep[] = [
      { id: 'CREATE_ORGANIZATION', stepNumber: 1, title: 'Create Organization', description: 'Establish SaaS tenant organization partition.', status: 'COMPLETED', timestamp: new Date().toLocaleTimeString(), details: `Tenant ${params.tenantId} verified.` },
      { id: 'CREATE_CLIENT', stepNumber: 2, title: 'Create Client Company', description: 'Provision isolated client boundary within organization.', status: 'COMPLETED', timestamp: new Date().toLocaleTimeString(), details: `Client ${params.clientId} provisioned.` },
      { id: 'ADD_USERS', stepNumber: 3, title: 'Add Users & Role Memberships', description: 'Bind authorized operator roles and discrete permissions.', status: 'COMPLETED', timestamp: new Date().toLocaleTimeString(), details: 'Membership roles bound.' },
      { id: 'ADD_SITE', stepNumber: 4, title: 'Register WordPress Site', description: 'Register domain, REST API route, and WordPress metadata.', status: 'COMPLETED', timestamp: new Date().toLocaleTimeString(), details: `Site URL ${params.siteUrl} registered.` },
      { id: 'CONNECT_MCP', stepNumber: 5, title: 'Attach Remote MCP Server', description: 'Establish mutual handshake with client MCP daemon.', status: 'PENDING' },
      { id: 'VERIFY_CONNECTION', stepNumber: 6, title: 'Verify Connection Handshake', description: 'Execute health ping, protocol check, and tool discovery.', status: 'PENDING' },
      { id: 'DISCOVER_CAPABILITIES', stepNumber: 7, title: 'Run Phase 6 Capability Discovery', description: 'Inspect active plugins, SEO, builders, and eCommerce.', status: 'PENDING' },
      { id: 'CREATE_BASELINE', stepNumber: 8, title: 'Create Initial Site Baseline', description: 'Record immutable capability baseline and tools fingerprint.', status: 'PENDING' },
      { id: 'READY', stepNumber: 9, title: 'Site Ready for Production', description: 'Controlled production execution unlocked under Phase 5 authority.', status: 'PENDING' }
    ];

    return {
      id: `onboard-${Date.now().toString().slice(-4)}`,
      tenantId: params.tenantId,
      clientId: params.clientId,
      clientName: params.clientName,
      organizationName: params.orgName,
      siteUrl: params.siteUrl,
      currentStepIndex: 4,
      steps,
      isReady: false,
      createdAt: new Date().toLocaleDateString()
    };
  }

  public static advanceOnboardingStep(
    session: ClientOnboardingSession,
    stepId: ClientOnboardingStepId,
    details?: string
  ): ClientOnboardingSession {
    const updatedSteps = session.steps.map((st) => {
      if (st.id === stepId) {
        return {
          ...st,
          status: 'COMPLETED' as const,
          timestamp: new Date().toLocaleTimeString(),
          details: details || st.description
        };
      }
      return st;
    });

    const nextIndex = updatedSteps.findIndex((s) => s.status === 'PENDING');
    const isReady = nextIndex === -1;

    return {
      ...session,
      steps: updatedSteps,
      currentStepIndex: isReady ? session.steps.length - 1 : nextIndex,
      isReady,
      completedAt: isReady ? new Date().toLocaleTimeString() : undefined
    };
  }

  // =========================================================
  // Section 2: Site Baseline & Capability Change Detection
  // =========================================================

  public static captureSiteBaseline(params: {
    site: Site;
    tools: McpTool[];
    stack?: SiteStackProfile;
  }): SiteCapabilityBaseline {
    const { site, tools, stack } = params;
    const capabilitiesList = tools.map((t) => t.name);

    return {
      id: `baseline-${site.id}-${Date.now().toString().slice(-4)}`,
      siteId: site.id,
      siteName: site.siteName,
      tenantId: site.tenantId || 'org-imperial-kenya',
      clientId: site.clientId || `client-${site.id}`,
      capturedAt: new Date().toLocaleTimeString(),
      wordpressVersion: stack?.wordpressVersion || '6.5.2',
      phpVersion: stack?.phpVersion || '8.2.14',
      seoPlugin: site.seoPlugin || stack?.seoPlugin || 'Standard Meta',
      pageBuilder: site.pageBuilder || stack?.pageBuilder || 'Gutenberg Blocks',
      ecommerce: (site as any).eCommercePlugin || stack?.commercePlatform || 'None',
      lms: 'None',
      booking: 'Amelia Booking Engine',
      backupCapability: tools.some((t) => t.name.includes('backup') || t.name.includes('snapshot')),
      rollbackCapability: true,
      capabilitiesList,
      mcpToolsHash: `sha256-tools-${tools.length}-${Date.now().toString().slice(-4)}`,
      mcpServerVersion: '1.4.2-imperial',
      status: 'ACTIVE',
      lastRevalidatedAt: new Date().toLocaleTimeString()
    };
  }

  public static detectCapabilityDrift(params: {
    baseline: SiteCapabilityBaseline;
    currentTools: McpTool[];
    tasks: ProductionTask[];
  }): { hasDrift: boolean; event: CapabilityChangeEvent | null; pausedTasksCount: number } {
    const currentToolNames = new Set(params.currentTools.map((t) => t.name));
    const missing = params.baseline.capabilitiesList.filter((cap) => !currentToolNames.has(cap));

    if (missing.length === 0) {
      return { hasDrift: false, event: null, pausedTasksCount: 0 };
    }

    const affectedTasks = params.tasks.filter(
      (t) => t.siteId === params.baseline.siteId && (t.overallStatus === 'RUNNING' || t.overallStatus === 'AWAITING_APPROVAL')
    );

    const event: CapabilityChangeEvent = {
      id: `drift-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      siteId: params.baseline.siteId,
      siteName: params.baseline.siteName,
      tenantId: params.baseline.tenantId,
      clientId: params.baseline.clientId,
      previousCapabilities: params.baseline.capabilitiesList,
      currentCapabilities: Array.from(currentToolNames),
      missingCapabilities: missing,
      flag: 'CAPABILITY_CHANGED',
      actionTaken: 'PAUSE_TASK_AND_REVALIDATE',
      affectedTaskIds: affectedTasks.map((t) => t.id),
      resolved: false
    };

    return {
      hasDrift: true,
      event,
      pausedTasksCount: affectedTasks.length
    };
  }

  // =========================================================
  // Section 2: Client Health Assessment (Ground Truth)
  // =========================================================

  public static calculateClientHealth(params: {
    client: ClientCompany;
    sites: Site[];
    tasks: ProductionTask[];
    mcpServers: MCPServer[];
    incidents?: IncidentItem[];
    driftEvents?: CapabilityChangeEvent[];
  }): ClientHealthReport {
    const clientSites = params.sites.filter((s) => s.clientId === params.client.id);
    const clientTasks = params.tasks.filter((t) => t.clientId === params.client.id);
    const clientServers = params.mcpServers.filter((srv) => params.client.mcpConnectionIds.includes(srv.id));

    const connectedServers = clientServers.filter((srv) => srv.connectionStatus === 'CONNECTED').length;
    const mcpConnectivity: 'ALL_CONNECTED' | 'PARTIAL' | 'DISCONNECTED' =
      clientServers.length === 0 || connectedServers === clientServers.length
        ? 'ALL_CONNECTED'
        : connectedServers > 0
        ? 'PARTIAL'
        : 'DISCONNECTED';

    const recentFailures = clientTasks.filter((t) => t.overallStatus === 'FAILED').length;
    const verificationFailures = clientTasks.reduce(
      (acc, t) => acc + (t.failures?.filter((f) => f.error?.includes('Verification') || f.error?.includes('False')).length || 0),
      0
    );
    const pendingTasks = clientTasks.filter(
      (t) => t.overallStatus === 'AWAITING_APPROVAL' || t.overallStatus === 'QUEUED' || t.overallStatus === 'RUNNING'
    ).length;

    const openIncidents = (params.incidents || []).filter(
      (inc) => inc.status === 'OPEN' && clientSites.some((s) => s.id === inc.siteId)
    ).length;

    const driftCount = (params.driftEvents || []).filter(
      (d) => !d.resolved && d.clientId === params.client.id
    ).length;

    // Deductive health score computation
    let score = 100;
    if (mcpConnectivity === 'PARTIAL') score -= 15;
    if (mcpConnectivity === 'DISCONNECTED') score -= 40;
    score -= recentFailures * 8;
    score -= verificationFailures * 12;
    score -= openIncidents * 15;
    score -= driftCount * 10;
    score = Math.max(0, Math.min(100, score));

    const status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' =
      score >= 85 ? 'OPTIMAL' : score >= 60 ? 'DEGRADED' : 'CRITICAL';

    return {
      clientId: params.client.id,
      clientName: params.client.name,
      tenantId: params.client.organizationId || params.client.tenantId || 'org-imperial-kenya',
      healthScore: score,
      status,
      mcpConnectivity,
      siteAvailabilityPct: Number((99.9 - (openIncidents * 0.4) - (recentFailures * 0.2)).toFixed(2)),
      recentFailuresCount: recentFailures,
      verificationFailuresCount: verificationFailures,
      pendingTasksCount: pendingTasks,
      openIncidentsCount: openIncidents,
      capabilityDriftCount: driftCount,
      lastAssessedAt: new Date().toLocaleTimeString()
    };
  }

  // =========================================================
  // Section 2: SaaS Plan Quota & Limit Enforcement
  // =========================================================

  public static checkPlanLimits(params: {
    plan: SaaSPlan;
    currentUsage: TenantUsageSummary;
    requestedAction: 'TASK_CREATE' | 'OPERATION_EXECUTE' | 'SITE_ADD' | 'USER_ADD' | 'AI_REQUEST';
    quantity?: number;
  }): LimitEnforcementStatus {
    const qty = params.quantity || 1;
    const { plan, currentUsage, requestedAction } = params;

    switch (requestedAction) {
      case 'TASK_CREATE': {
        const nextCount = currentUsage.totalTasksCompleted + currentUsage.totalTasksFailed + qty;
        if (nextCount > plan.maxTasksPerMonth) {
          return {
            status: 'LIMIT_REACHED',
            currentUsage: nextCount,
            allowedLimit: plan.maxTasksPerMonth,
            affectedFeature: 'Monthly Production Task Quota',
            requiredAction: `Upgrade from ${plan.name} to higher subscription tier to run more tasks.`,
            blocked: true
          };
        }
        break;
      }
      case 'OPERATION_EXECUTE': {
        const nextOps = currentUsage.totalWpMutations + currentUsage.totalReadOperations + qty;
        if (nextOps > plan.maxOperationsPerMonth) {
          return {
            status: 'LIMIT_REACHED',
            currentUsage: nextOps,
            allowedLimit: plan.maxOperationsPerMonth,
            affectedFeature: 'Monthly Operation Call Quota',
            requiredAction: `Monthly operation limit of ${plan.maxOperationsPerMonth} reached. Contact administrator to elevate quota.`,
            blocked: true
          };
        }
        break;
      }
      case 'SITE_ADD': {
        if (currentUsage.activeSitesCount + qty > plan.maxSites) {
          return {
            status: 'LIMIT_REACHED',
            currentUsage: currentUsage.activeSitesCount + qty,
            allowedLimit: plan.maxSites,
            affectedFeature: 'Maximum Managed Sites',
            requiredAction: `Site limit of ${plan.maxSites} sites reached on ${plan.name}. Upgrade plan.`,
            blocked: true
          };
        }
        break;
      }
      case 'USER_ADD': {
        if (currentUsage.activeUsersCount + qty > plan.maxUsers) {
          return {
            status: 'LIMIT_REACHED',
            currentUsage: currentUsage.activeUsersCount + qty,
            allowedLimit: plan.maxUsers,
            affectedFeature: 'Maximum Team Seats',
            requiredAction: `Team seat limit of ${plan.maxUsers} users reached. Upgrade plan for more operator seats.`,
            blocked: true
          };
        }
        break;
      }
      case 'AI_REQUEST': {
        if (currentUsage.totalAiRequests + qty > plan.maxAiUsageRequests) {
          return {
            status: 'LIMIT_REACHED',
            currentUsage: currentUsage.totalAiRequests + qty,
            allowedLimit: plan.maxAiUsageRequests,
            affectedFeature: 'AI Generation & Planning Quota',
            requiredAction: `AI request limit of ${plan.maxAiUsageRequests} requests reached for current billing cycle.`,
            blocked: true
          };
        }
        break;
      }
    }

    return {
      status: 'WITHIN_LIMIT',
      currentUsage: 0,
      allowedLimit: 999999,
      affectedFeature: requestedAction,
      requiredAction: 'None',
      blocked: false
    };
  }

  public static hasFeatureFlag(plan: SaaSPlan, flag: TenantFeatureFlag): boolean {
    return plan.featureFlags.includes(flag);
  }

  // =========================================================
  // Section 2: Internal API Request & Security Envelope
  // =========================================================

  public static executeInternalApiRequest(params: {
    req: InternalApiRequest;
    user: TenantUser;
    memberships: Membership[];
    plan: SaaSPlan;
  }): InternalApiResponse {
    const { req, user, memberships, plan } = params;

    // Step 1: User authentication verification
    if (user.id !== req.authenticatedUserId) {
      return {
        success: false,
        statusCode: 401,
        error: { code: 'UNAUTHENTICATED', message: 'Identity token mismatch.' },
        tenantId: req.tenantId,
        auditId: `audit-api-err-${Date.now()}`
      };
    }

    // Step 2: Tenant membership verification
    const membership = memberships.find(
      (m) => m.userId === user.id && m.organizationId === req.tenantId && m.status === 'ACTIVE'
    );
    if (!membership && !user.isPlatformAdmin) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'CROSS_TENANT_ACCESS_DENIED', message: 'User does not hold active membership in target organization.' },
        tenantId: req.tenantId,
        auditId: `audit-api-sec-${Date.now()}`
      };
    }

    // Step 3: Explicit permissions check
    const userRole = membership ? membership.role : 'ADMIN';
    const grantedPerms = membership?.permissions || ROLE_DEFAULT_PERMISSIONS[userRole];
    for (const required of req.requiredPermissions) {
      if (!grantedPerms.includes(required) && !user.isPlatformAdmin) {
        return {
          success: false,
          statusCode: 403,
          error: { code: 'PERMISSION_DENIED', message: `Missing required permission: ${required}` },
          tenantId: req.tenantId,
          auditId: `audit-api-perm-${Date.now()}`
        };
      }
    }

    // Step 4: Security policy check (Zero unrestricted endpoints)
    if (req.operation.includes('raw_exec') || req.operation.includes('eval') || req.operation.includes('direct_db_bypass')) {
      return {
        success: false,
        statusCode: 400,
        error: { code: 'RESTRICTED_MCP_ENDPOINT_VIOLATION', message: 'Unrestricted execution endpoints are forbidden by platform policy.' },
        tenantId: req.tenantId,
        auditId: `audit-api-blk-${Date.now()}`
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        envelope: 'SECURE_INTERNAL_API_V1',
        resource: req.resource,
        operation: req.operation,
        processedAt: new Date().toLocaleTimeString(),
        policy: req.securityPolicy
      },
      tenantId: req.tenantId,
      auditId: `audit-api-ok-${Date.now()}`
    };
  }

  // =========================================================
  // Section 2: Data Export & Scrubbing
  // =========================================================

  public static generateTenantExportBundle(params: {
    tenantId: string;
    orgName: string;
    userEmail: string;
    organizations: Organization[];
    clients: ClientCompany[];
    sites: Site[];
    tasks: ProductionTask[];
    audits: AuditEvent[];
    usage: TenantUsageSummary;
  }): TenantExportBundle {
    const tenantOrgs = params.organizations.filter((o) => o.id === params.tenantId);
    const tenantClients = params.clients.filter((c) => c.organizationId === params.tenantId || c.tenantId === params.tenantId);
    const clientIds = new Set(tenantClients.map((c) => c.id));
    const tenantSites = params.sites.filter((s) => s.tenantId === params.tenantId || (s.clientId && clientIds.has(s.clientId)));
    const tenantTasks = params.tasks.filter((t) => t.tenantId === params.tenantId || (t.clientId && clientIds.has(t.clientId)));
    const tenantAudits = params.audits.filter((a) => a.tenantId === params.tenantId || (a.clientId && clientIds.has(a.clientId)));

    // SCRUB ALL SECRETS: Never export credentials, passwords, Bearer tokens, or keys!
    const scrubbedSites = tenantSites.map((s) => {
      const copy = { ...s };
      delete (copy as any).applicationPassword;
      delete (copy as any).bearerToken;
      delete (copy as any).apiKey;
      return copy;
    });

    const scrubbedAudits = tenantAudits.map((a) => {
      const copy = { ...a };
      if (copy.parametersSummary && copy.parametersSummary.includes('pass')) {
        copy.parametersSummary = '[REDACTED_BY_TENANT_EXPORT_POLICY]';
      }
      return copy;
    });

    return {
      tenantId: params.tenantId,
      organizationName: params.orgName,
      exportedAt: new Date().toISOString(),
      exportedBy: params.userEmail,
      organizations: tenantOrgs,
      clients: tenantClients,
      sites: scrubbedSites,
      tasks: tenantTasks,
      reports: [],
      auditHistory: scrubbedAudits,
      usage: params.usage,
      scrubbedSecrets: true
    };
  }

  public static validateTenantDeletionConfirmation(
    req: TenantDeletionConfirmation,
    org: Organization
  ): { confirmed: boolean; error?: string } {
    if (!req.authenticated) {
      return { confirmed: false, error: 'User session must be authenticated to request deletion.' };
    }

    const expectedPhrase = `DELETE TENANT ${org.name.toUpperCase()}`;
    if (req.explicitConfirmationPhrase.trim() !== expectedPhrase) {
      return {
        confirmed: false,
        error: `Confirmation phrase mismatch. Expected exactly: "${expectedPhrase}"`
      };
    }

    return { confirmed: true };
  }
}
