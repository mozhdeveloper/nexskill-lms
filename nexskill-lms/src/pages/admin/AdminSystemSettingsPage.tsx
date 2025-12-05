import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import SystemSettingsTabs from '../../components/admin/settings/SystemSettingsTabs';
import ApiKeysPanel from '../../components/admin/settings/ApiKeysPanel';
import IntegrationsPanel from '../../components/admin/settings/IntegrationsPanel';
import FeatureTogglesPanel from '../../components/admin/settings/FeatureTogglesPanel';
import AuditLogsPanel from '../../components/admin/settings/AuditLogsPanel';
import LanguageManagerPanel from '../../components/admin/settings/LanguageManagerPanel';
import AccessControlPanel from '../../components/admin/settings/AccessControlPanel';

type TabValue = 'api' | 'integrations' | 'features' | 'audit' | 'languages' | 'access';

interface ApiKey {
  id: string;
  label: string;
  keyPreview: string;
  scope: 'read' | 'write' | 'admin';
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

interface Integration {
  id: string;
  provider: 'zoom' | 'stripe' | 'facebook' | 'whatsapp';
  name: string;
  status: 'connected' | 'disconnected' | 'pending';
  environment: 'sandbox' | 'production';
  lastSyncedAt?: string;
  configSummary: string;
}

interface FeatureToggle {
  id: string;
  key: string;
  name: string;
  description: string;
  segment: 'global' | 'beta' | 'internal';
  status: 'enabled' | 'disabled';
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
  ipAddress?: string;
}

interface Language {
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  translationCoverage: number;
}

interface TranslationNamespace {
  id: string;
  key: string;
  translatedKeys: number;
  totalKeys: number;
}

interface Role {
  id: string;
  name: string;
  description: string;
  system: boolean;
}

interface Permission {
  key: string;
  label: string;
  category: 'Dashboard' | 'Courses' | 'Finance' | 'CRM' | 'System';
}

interface RolePermission {
  roleId: string;
  permissionKey: string;
  allowed: boolean;
}

const AdminSystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('api');

  // Dummy API Keys data
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'key-1',
      label: 'Public API – Read-only',
      keyPreview: 'sk_live_••••7842',
      scope: 'read',
      createdAt: '2025-10-15',
      lastUsedAt: '2025-12-03',
      status: 'active',
    },
    {
      id: 'key-2',
      label: 'Integration Service – Write',
      keyPreview: 'sk_live_••••3291',
      scope: 'write',
      createdAt: '2025-11-20',
      lastUsedAt: '2025-12-04',
      status: 'active',
    },
    {
      id: 'key-3',
      label: 'Admin Console – Full Access',
      keyPreview: 'sk_live_••••9156',
      scope: 'admin',
      createdAt: '2025-09-01',
      lastUsedAt: '2025-12-02',
      status: 'active',
    },
    {
      id: 'key-4',
      label: 'Legacy Integration (deprecated)',
      keyPreview: 'sk_live_••••4567',
      scope: 'read',
      createdAt: '2024-03-12',
      lastUsedAt: '2025-08-15',
      status: 'revoked',
    },
  ]);

  // Dummy Integrations data
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'int-1',
      provider: 'zoom',
      name: 'Zoom Meetings',
      status: 'connected',
      environment: 'production',
      lastSyncedAt: '2025-12-04 10:32',
      configSummary: 'Webhook active · 48 sessions this week',
    },
    {
      id: 'int-2',
      provider: 'stripe',
      name: 'Stripe Billing',
      status: 'connected',
      environment: 'production',
      lastSyncedAt: '2025-12-04 09:15',
      configSummary: '2 products synced · Webhooks active',
    },
    {
      id: 'int-3',
      provider: 'facebook',
      name: 'Facebook Marketing',
      status: 'disconnected',
      environment: 'sandbox',
      configSummary: 'Not configured',
    },
    {
      id: 'int-4',
      provider: 'whatsapp',
      name: 'WhatsApp Business',
      status: 'pending',
      environment: 'sandbox',
      configSummary: 'Awaiting verification',
    },
  ]);

  // Dummy Feature Toggles data
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([
    {
      id: 'ft-1',
      key: 'ai_student_coach',
      name: 'AI Student Coach',
      description: 'Enable AI-powered personalized study recommendations and chatbot.',
      segment: 'global',
      status: 'enabled',
    },
    {
      id: 'ft-2',
      key: 'beta_quiz_v2',
      name: 'Quiz Builder V2 (Beta)',
      description: 'New quiz builder with advanced question types and analytics.',
      segment: 'beta',
      status: 'enabled',
    },
    {
      id: 'ft-3',
      key: 'blockchain_certificates',
      name: 'Blockchain Certificates',
      description: 'Issue tamper-proof certificates on blockchain.',
      segment: 'global',
      status: 'enabled',
    },
    {
      id: 'ft-4',
      key: 'internal_debug_panel',
      name: 'Internal Debug Panel',
      description: 'Advanced debugging tools for internal team use only.',
      segment: 'internal',
      status: 'enabled',
    },
    {
      id: 'ft-5',
      key: 'social_learning_circles',
      name: 'Social Learning Circles',
      description: 'Community-driven study groups and peer learning features.',
      segment: 'global',
      status: 'enabled',
    },
    {
      id: 'ft-6',
      key: 'gamification_badges',
      name: 'Gamification & Badges',
      description: 'Award badges and achievements for course milestones.',
      segment: 'beta',
      status: 'disabled',
    },
    {
      id: 'ft-7',
      key: 'live_coaching_integration',
      name: 'Live 1:1 Coaching',
      description: 'Enable booking and video calls with expert coaches.',
      segment: 'global',
      status: 'enabled',
    },
    {
      id: 'ft-8',
      key: 'advanced_analytics_dashboard',
      name: 'Advanced Analytics Dashboard',
      description: 'Enhanced reporting and data visualization for admins.',
      segment: 'internal',
      status: 'disabled',
    },
  ]);

  // Dummy Audit Logs data
  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: '2025-12-04 14:23:15',
      actor: 'admin@nexskill.io',
      actorRole: 'Super Admin',
      action: 'UPDATED_FEATURE_FLAG',
      resourceType: 'FeatureToggle',
      resourceId: 'ft-1',
      summary: 'Enabled feature"ai_student_coach" for segment global',
      ipAddress: '203.0.113.42',
    },
    {
      id: 'log-2',
      timestamp: '2025-12-04 13:45:22',
      actor: 'system@nexskill.io',
      actorRole: 'System',
      action: 'CONNECTED_INTEGRATION',
      resourceType: 'Integration',
      resourceId: 'int-2',
      summary: 'Connected Stripe Billing integration in production environment',
      ipAddress: '198.51.100.5',
    },
    {
      id: 'log-3',
      timestamp: '2025-12-04 12:18:41',
      actor: 'john.admin@nexskill.io',
      actorRole: 'Admin',
      action: 'GENERATED_API_KEY',
      resourceType: 'APIKey',
      resourceId: 'key-2',
      summary: 'Generated new API key"Integration Service – Write" with write scope',
      ipAddress: '192.0.2.100',
    },
    {
      id: 'log-4',
      timestamp: '2025-12-04 11:30:15',
      actor: 'admin@nexskill.io',
      actorRole: 'Super Admin',
      action: 'UPDATED_ROLE_PERMISSIONS',
      resourceType: 'Role',
      resourceId: 'role-3',
      summary: 'Added permission"manage_courses" to Coach role',
      ipAddress: '203.0.113.42',
    },
    {
      id: 'log-5',
      timestamp: '2025-12-04 10:15:33',
      actor: 'admin@nexskill.io',
      actorRole: 'Super Admin',
      action: 'DISCONNECTED_INTEGRATION',
      resourceType: 'Integration',
      resourceId: 'int-3',
      summary: 'Disconnected Facebook Marketing integration',
      ipAddress: '203.0.113.42',
    },
    {
      id: 'log-6',
      timestamp: '2025-12-03 16:22:10',
      actor: 'maria.admin@nexskill.io',
      actorRole: 'Admin',
      action: 'REVOKED_API_KEY',
      resourceType: 'APIKey',
      resourceId: 'key-4',
      summary: 'Revoked API key"Legacy Integration (deprecated)"',
      ipAddress: '198.51.100.88',
    },
    {
      id: 'log-7',
      timestamp: '2025-12-03 14:05:19',
      actor: 'admin@nexskill.io',
      actorRole: 'Super Admin',
      action: 'UPDATED_FEATURE_FLAG',
      resourceType: 'FeatureToggle',
      resourceId: 'ft-6',
      summary: 'Disabled feature"gamification_badges" for segment beta',
      ipAddress: '203.0.113.42',
    },
    {
      id: 'log-8',
      timestamp: '2025-12-03 09:47:55',
      actor: 'john.admin@nexskill.io',
      actorRole: 'Admin',
      action: 'CREATED_ROLE',
      resourceType: 'Role',
      resourceId: 'role-5',
      summary: 'Created new custom role"Org Admin" with organizational management permissions',
      ipAddress: '192.0.2.100',
    },
    {
      id: 'log-9',
      timestamp: '2025-12-02 15:33:28',
      actor: 'system@nexskill.io',
      actorRole: 'System',
      action: 'CONNECTED_INTEGRATION',
      resourceType: 'Integration',
      resourceId: 'int-1',
      summary: 'Connected Zoom Meetings integration in production environment',
      ipAddress: '198.51.100.5',
    },
    {
      id: 'log-10',
      timestamp: '2025-12-02 11:20:41',
      actor: 'admin@nexskill.io',
      actorRole: 'Super Admin',
      action: 'ACTIVATED_LANGUAGE',
      resourceType: 'Language',
      resourceId: 'ja',
      summary: 'Activated Japanese language (ja) with 78% translation coverage',
      ipAddress: '203.0.113.42',
    },
  ];

  // Dummy Languages data
  const [languages, setLanguages] = useState<Language[]>([
    {
      code: 'en',
      name: 'English',
      isDefault: true,
      isActive: true,
      translationCoverage: 100,
    },
    {
      code: 'fil',
      name: 'Filipino',
      isDefault: false,
      isActive: true,
      translationCoverage: 87,
    },
    {
      code: 'es',
      name: 'Spanish',
      isDefault: false,
      isActive: true,
      translationCoverage: 92,
    },
    {
      code: 'fr',
      name: 'French',
      isDefault: false,
      isActive: false,
      translationCoverage: 45,
    },
    {
      code: 'ja',
      name: 'Japanese',
      isDefault: false,
      isActive: true,
      translationCoverage: 78,
    },
    {
      code: 'ar',
      name: 'Arabic',
      isDefault: false,
      isActive: false,
      translationCoverage: 23,
    },
  ]);

  // Dummy Translation Namespaces data (optional)
  const translationNamespaces: TranslationNamespace[] = [
    { id: 'ns-1', key: 'student_portal', translatedKeys: 245, totalKeys: 280 },
    { id: 'ns-2', key: 'coach_dashboard', translatedKeys: 189, totalKeys: 210 },
    { id: 'ns-3', key: 'admin_console', translatedKeys: 156, totalKeys: 195 },
    { id: 'ns-4', key: 'course_player', translatedKeys: 98, totalKeys: 120 },
    { id: 'ns-5', key: 'community', translatedKeys: 67, totalKeys: 85 },
  ];

  // Dummy Roles data
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'role-1',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      system: true,
    },
    {
      id: 'role-2',
      name: 'Admin',
      description: 'Administrative access with limited system configuration',
      system: true,
    },
    {
      id: 'role-3',
      name: 'Coach',
      description: 'Course creation and student management permissions',
      system: true,
    },
    {
      id: 'role-4',
      name: 'Student',
      description: 'Learning and community participation permissions',
      system: true,
    },
    {
      id: 'role-5',
      name: 'Org Admin',
      description: 'Organizational management and reporting access',
      system: false,
    },
  ]);

  // Dummy Permissions data
  const permissions: Permission[] = [
    // Dashboard
    { key: 'view_admin_dashboard', label: 'View Admin Dashboard', category: 'Dashboard' },
    { key: 'view_analytics', label: 'View Analytics', category: 'Dashboard' },
    // Courses
    { key: 'manage_courses', label: 'Manage Courses', category: 'Courses' },
    { key: 'approve_courses', label: 'Approve Courses', category: 'Courses' },
    { key: 'view_courses', label: 'View Courses', category: 'Courses' },
    { key: 'enroll_courses', label: 'Enroll in Courses', category: 'Courses' },
    // Finance
    { key: 'manage_finance', label: 'Manage Finance', category: 'Finance' },
    { key: 'view_transactions', label: 'View Transactions', category: 'Finance' },
    { key: 'issue_refunds', label: 'Issue Refunds', category: 'Finance' },
    // CRM
    { key: 'manage_crm', label: 'Manage CRM', category: 'CRM' },
    { key: 'send_campaigns', label: 'Send Campaigns', category: 'CRM' },
    { key: 'view_leads', label: 'View Leads', category: 'CRM' },
    // System
    { key: 'manage_settings', label: 'Manage Settings', category: 'System' },
    { key: 'manage_users', label: 'Manage Users', category: 'System' },
    { key: 'manage_roles', label: 'Manage Roles', category: 'System' },
    { key: 'view_audit_logs', label: 'View Audit Logs', category: 'System' },
    { key: 'manage_integrations', label: 'Manage Integrations', category: 'System' },
    { key: 'manage_api_keys', label: 'Manage API Keys', category: 'System' },
  ];

  // Dummy Role Permissions mapping
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    // Super Admin - all permissions
    ...permissions.map((p) => ({ roleId: 'role-1', permissionKey: p.key, allowed: true })),
    // Admin - most permissions except some system ones
    { roleId: 'role-2', permissionKey: 'view_admin_dashboard', allowed: true },
    { roleId: 'role-2', permissionKey: 'view_analytics', allowed: true },
    { roleId: 'role-2', permissionKey: 'manage_courses', allowed: true },
    { roleId: 'role-2', permissionKey: 'approve_courses', allowed: true },
    { roleId: 'role-2', permissionKey: 'view_courses', allowed: true },
    { roleId: 'role-2', permissionKey: 'manage_finance', allowed: true },
    { roleId: 'role-2', permissionKey: 'view_transactions', allowed: true },
    { roleId: 'role-2', permissionKey: 'issue_refunds', allowed: true },
    { roleId: 'role-2', permissionKey: 'manage_crm', allowed: true },
    { roleId: 'role-2', permissionKey: 'send_campaigns', allowed: true },
    { roleId: 'role-2', permissionKey: 'view_leads', allowed: true },
    { roleId: 'role-2', permissionKey: 'manage_users', allowed: true },
    { roleId: 'role-2', permissionKey: 'view_audit_logs', allowed: true },
    { roleId: 'role-2', permissionKey: 'manage_integrations', allowed: true },
    // Coach - course management
    { roleId: 'role-3', permissionKey: 'manage_courses', allowed: true },
    { roleId: 'role-3', permissionKey: 'view_courses', allowed: true },
    { roleId: 'role-3', permissionKey: 'view_analytics', allowed: true },
    { roleId: 'role-3', permissionKey: 'view_transactions', allowed: true },
    // Student - learning permissions
    { roleId: 'role-4', permissionKey: 'view_courses', allowed: true },
    { roleId: 'role-4', permissionKey: 'enroll_courses', allowed: true },
    // Org Admin - organizational management
    { roleId: 'role-5', permissionKey: 'view_admin_dashboard', allowed: true },
    { roleId: 'role-5', permissionKey: 'view_analytics', allowed: true },
    { roleId: 'role-5', permissionKey: 'view_courses', allowed: true },
    { roleId: 'role-5', permissionKey: 'approve_courses', allowed: true },
    { roleId: 'role-5', permissionKey: 'manage_crm', allowed: true },
    { roleId: 'role-5', permissionKey: 'view_leads', allowed: true },
    { roleId: 'role-5', permissionKey: 'manage_users', allowed: true },
  ]);

  // KPI Summary (dummy stats)
  const kpiSummary = {
    activeIntegrations: integrations.filter((i) => i.status === 'connected').length,
    featuresEnabled: featureToggles.filter((f) => f.status === 'enabled').length,
    apiKeysInUse: apiKeys.filter((k) => k.status === 'active').length,
    environmentsConfigured: 2, // production + sandbox
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api':
        return <ApiKeysPanel apiKeys={apiKeys} onChange={setApiKeys} />;
      case 'integrations':
        return <IntegrationsPanel integrations={integrations} onChange={setIntegrations} />;
      case 'features':
        return <FeatureTogglesPanel toggles={featureToggles} onChange={setFeatureToggles} />;
      case 'audit':
        return <AuditLogsPanel logs={auditLogs} />;
      case 'languages':
        return (
          <LanguageManagerPanel
            languages={languages}
            namespaces={translationNamespaces}
            onChange={setLanguages}
          />
        );
      case 'access':
        return (
          <AccessControlPanel
            roles={roles}
            permissions={permissions}
            rolePermissions={rolePermissions}
            onChangeRoles={setRoles}
            onChangeRolePermissions={setRolePermissions}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminAppLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">System settings</h1>
          <p className="text-gray-600">
            Configure platform-level integrations, features, and access policies.
          </p>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Active integrations</div>
            <div className="text-3xl font-bold text-gray-900">{kpiSummary.activeIntegrations}</div>
            <div className="text-xs text-green-600 mt-1">✓ All operational</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Features enabled</div>
            <div className="text-3xl font-bold text-gray-900">{kpiSummary.featuresEnabled}</div>
            <div className="text-xs text-gray-500 mt-1">
              of {featureToggles.length} total
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">API keys in use</div>
            <div className="text-3xl font-bold text-gray-900">{kpiSummary.apiKeysInUse}</div>
            <div className="text-xs text-gray-500 mt-1">
              {apiKeys.filter((k) => k.status === 'revoked').length} revoked
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Environments configured</div>
            <div className="text-3xl font-bold text-gray-900">{kpiSummary.environmentsConfigured}</div>
            <div className="text-xs text-gray-500 mt-1">Sandbox + Production</div>
          </div>
        </div>

        {/* Tabs */}
        <SystemSettingsTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </AdminAppLayout>
  );
};

export default AdminSystemSettingsPage;
