import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import NotificationChannelsTabs from '../../components/admin/notifications/NotificationChannelsTabs';
import EmailTemplatesPanel from '../../components/admin/notifications/EmailTemplatesPanel';
import SmsTemplatesPanel from '../../components/admin/notifications/SmsTemplatesPanel';
import PushNotificationsPanel from '../../components/admin/notifications/PushNotificationsPanel';
import AutomationRulesPanel from '../../components/admin/notifications/AutomationRulesPanel';
import TemplateEditorDrawer from '../../components/admin/notifications/TemplateEditorDrawer';

interface EmailTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'system';
  subject: string;
  previewText: string;
  body?: string;
  status: 'active' | 'draft' | 'archived';
  lastUpdatedAt?: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: 'otp' | 'reminder' | 'marketing' | 'system';
  body: string;
  characterCount: number;
  status: 'active' | 'draft' | 'archived';
  lastUpdatedAt?: string;
}

interface PushConfig {
  id: string;
  name: string;
  targetApp: 'web' | 'mobile' | 'both';
  status: 'enabled' | 'disabled';
  provider: 'firebase' | 'onesignal' | 'custom' | 'placeholder';
  lastUpdatedAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'event' | 'schedule';
  triggerSummary: string;
  channels: string[];
  status: 'enabled' | 'disabled';
  lastRunAt?: string;
  priority: number;
}

const AdminNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'push' | 'automation'>('email');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [drawerType, setDrawerType] = useState<'email' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | SmsTemplate | undefined>();

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: 'email-1',
      name: 'Welcome Email',
      category: 'transactional',
      subject: 'Welcome to NexSkill!',
      previewText: 'Get started with your learning journey',
      body: 'Hi {first_name}, Welcome to NexSkill! We are excited to have you on board.',
      status: 'active',
      lastUpdatedAt: '2024-01-15',
    },
    {
      id: 'email-2',
      name: 'Course Enrollment Confirmation',
      category: 'transactional',
      subject:"You're enrolled in {course_name}",
      previewText: 'Start learning today',
      body: 'Hi {first_name}, You have successfully enrolled in {course_name}.',
      status: 'active',
      lastUpdatedAt: '2024-01-14',
    },
    {
      id: 'email-3',
      name: 'Monthly Newsletter',
      category: 'marketing',
      subject: 'NexSkill Monthly Update - January 2024',
      previewText: 'New courses, features, and more',
      body: 'Hi {first_name}, Check out what is new this month at NexSkill!',
      status: 'active',
      lastUpdatedAt: '2024-01-12',
    },
    {
      id: 'email-4',
      name: 'Password Reset',
      category: 'system',
      subject: 'Reset your NexSkill password',
      previewText: 'Click the link to reset your password',
      body: 'Hi {first_name}, Click here to reset your password: {link}',
      status: 'active',
      lastUpdatedAt: '2024-01-10',
    },
    {
      id: 'email-5',
      name: 'Certificate Earned',
      category: 'transactional',
      subject: 'Congratulations! You earned a certificate',
      previewText: 'Download your certificate now',
      body: 'Hi {first_name}, Congratulations on completing {course_name}!',
      status: 'active',
      lastUpdatedAt: '2024-01-09',
    },
    {
      id: 'email-6',
      name: 'Payment Receipt',
      category: 'transactional',
      subject: 'Payment Receipt - {amount}',
      previewText: 'Thank you for your payment',
      body: 'Hi {first_name}, Your payment of {amount} has been processed.',
      status: 'active',
      lastUpdatedAt: '2024-01-08',
    },
    {
      id: 'email-7',
      name: 'Course Completion Reminder',
      category: 'marketing',
      subject:"You're almost there!",
      previewText: 'Complete {course_name} and earn your certificate',
      body: 'Hi {first_name}, You are 80% done with {course_name}. Finish strong!',
      status: 'draft',
      lastUpdatedAt: '2024-01-07',
    },
    {
      id: 'email-8',
      name: 'System Maintenance Notice',
      category: 'system',
      subject: 'Scheduled Maintenance - {date}',
      previewText: 'NexSkill will be unavailable briefly',
      body: 'Hi {first_name}, NexSkill will undergo scheduled maintenance on {date}.',
      status: 'archived',
      lastUpdatedAt: '2024-01-05',
    },
  ]);

  // SMS Templates
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([
    {
      id: 'sms-1',
      name: 'OTP Verification',
      category: 'otp',
      body: 'Your NexSkill OTP is {code}. Valid for 10 minutes.',
      characterCount: 52,
      status: 'active',
      lastUpdatedAt: '2024-01-15',
    },
    {
      id: 'sms-2',
      name: 'Course Start Reminder',
      category: 'reminder',
      body: 'Hi {first_name}, your course {course_name} starts tomorrow!',
      characterCount: 65,
      status: 'active',
      lastUpdatedAt: '2024-01-14',
    },
    {
      id: 'sms-3',
      name: 'Payment Confirmation',
      category: 'system',
      body: 'Payment of {amount} received. Thank you for choosing NexSkill!',
      characterCount: 62,
      status: 'active',
      lastUpdatedAt: '2024-01-13',
    },
    {
      id: 'sms-4',
      name: 'Flash Sale Alert',
      category: 'marketing',
      body: 'Flash Sale! 50% off all UX courses. Use code FLASH50. Ends tonight!',
      characterCount: 68,
      status: 'active',
      lastUpdatedAt: '2024-01-12',
    },
    {
      id: 'sms-5',
      name: 'Session Reminder',
      category: 'reminder',
      body: 'Reminder: Your coaching session with {coach_name} starts in 1 hour.',
      characterCount: 73,
      status: 'active',
      lastUpdatedAt: '2024-01-11',
    },
    {
      id: 'sms-6',
      name: 'Account Verification',
      category: 'otp',
      body: 'Welcome to NexSkill! Verify your account with code: {code}',
      characterCount: 60,
      status: 'draft',
      lastUpdatedAt: '2024-01-10',
    },
  ]);

  // Push Configs
  const [pushConfigs, setPushConfigs] = useState<PushConfig[]>([
    {
      id: 'push-1',
      name: 'Course Reminder Push',
      targetApp: 'both',
      status: 'enabled',
      provider: 'firebase',
      lastUpdatedAt: '2024-01-15',
    },
    {
      id: 'push-2',
      name: 'New Message Notification',
      targetApp: 'mobile',
      status: 'enabled',
      provider: 'firebase',
      lastUpdatedAt: '2024-01-14',
    },
    {
      id: 'push-3',
      name: 'Certificate Ready',
      targetApp: 'both',
      status: 'enabled',
      provider: 'firebase',
      lastUpdatedAt: '2024-01-13',
    },
    {
      id: 'push-4',
      name: 'Weekly Progress Report',
      targetApp: 'web',
      status: 'disabled',
      provider: 'firebase',
      lastUpdatedAt: '2024-01-12',
    },
  ]);

  // Automation Rules
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Welcome New Users',
      triggerType: 'event',
      triggerSummary: 'When: User signs up',
      channels: ['email', 'sms'],
      status: 'enabled',
      lastRunAt: '2024-01-15 14:23',
      priority: 1,
    },
    {
      id: 'rule-2',
      name: 'Course Enrollment Confirmation',
      triggerType: 'event',
      triggerSummary: 'When: Course enrolled',
      channels: ['email', 'push'],
      status: 'enabled',
      lastRunAt: '2024-01-15 13:45',
      priority: 2,
    },
    {
      id: 'rule-3',
      name: 'Daily Progress Report',
      triggerType: 'schedule',
      triggerSummary: 'On schedule: Daily at 9:00 AM',
      channels: ['email'],
      status: 'enabled',
      lastRunAt: '2024-01-15 09:00',
      priority: 3,
    },
    {
      id: 'rule-4',
      name: 'Payment Failed Alert',
      triggerType: 'event',
      triggerSummary: 'When: Payment fails',
      channels: ['email', 'sms'],
      status: 'enabled',
      lastRunAt: '2024-01-14 16:12',
      priority: 1,
    },
    {
      id: 'rule-5',
      name: 'Weekly Engagement Reminder',
      triggerType: 'schedule',
      triggerSummary: 'On schedule: Weekly on Monday at 9:00 AM',
      channels: ['email', 'push'],
      status: 'disabled',
      priority: 4,
    },
  ]);

  // KPIs
  const activeEmailTemplates = emailTemplates.filter((t) => t.status === 'active').length;
  const activeSmsTemplates = smsTemplates.filter((t) => t.status === 'active').length;
  const activePushCampaigns = pushConfigs.filter((c) => c.status === 'enabled').length;
  const automationRulesEnabled = automationRules.filter((r) => r.status === 'enabled').length;

  // Handlers
  const handleOpenEmailEditor = (template?: EmailTemplate) => {
    setDrawerType('email');
    setDrawerMode(template ? 'edit' : 'create');
    setSelectedTemplate(template);
    setDrawerOpen(true);
  };

  const handleOpenSmsEditor = (template?: SmsTemplate) => {
    setDrawerType('sms');
    setDrawerMode(template ? 'edit' : 'create');
    setSelectedTemplate(template);
    setDrawerOpen(true);
  };

  const handleSaveTemplate = (templateData: EmailTemplate | SmsTemplate) => {
    if (drawerType === 'email') {
      const emailData = templateData as EmailTemplate;
      if (drawerMode === 'create') {
        setEmailTemplates([...emailTemplates, emailData]);
      } else {
        setEmailTemplates(
          emailTemplates.map((t) => (t.id === emailData.id ? emailData : t))
        );
      }
    } else {
      const smsData = templateData as SmsTemplate;
      if (drawerMode === 'create') {
        setSmsTemplates([...smsTemplates, smsData]);
      } else {
        setSmsTemplates(
          smsTemplates.map((t) => (t.id === smsData.id ? smsData : t))
        );
      }
    }
    console.log('Template saved:', templateData);
  };

  return (
    <AdminAppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Notification Management</h1>
          <p className="text-sm text-[#9CA3B5] mt-1">
            Standardize templates, channels, and automated triggers across NexSkill
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
            <div className="text-xs font-semibold text-[#9CA3B5] mb-2">Active Email Templates</div>
            <div className="text-3xl font-bold text-[#304DB5]">{activeEmailTemplates}</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
            <div className="text-xs font-semibold text-[#9CA3B5] mb-2">Active SMS Templates</div>
            <div className="text-3xl font-bold text-[#304DB5]">{activeSmsTemplates}</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
            <div className="text-xs font-semibold text-[#9CA3B5] mb-2">Active Push Campaigns</div>
            <div className="text-3xl font-bold text-[#304DB5]">{activePushCampaigns}</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
            <div className="text-xs font-semibold text-[#9CA3B5] mb-2">Automation Rules Enabled</div>
            <div className="text-3xl font-bold text-[#304DB5]">{automationRulesEnabled}</div>
          </div>
        </div>

        {/* Tabs */}
        <NotificationChannelsTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Channel Content */}
        <div>
          {activeTab === 'email' && (
            <EmailTemplatesPanel
              templates={emailTemplates}
              onChange={setEmailTemplates}
              onOpenEditor={handleOpenEmailEditor}
            />
          )}
          {activeTab === 'sms' && (
            <SmsTemplatesPanel
              templates={smsTemplates}
              onChange={setSmsTemplates}
              onOpenEditor={handleOpenSmsEditor}
            />
          )}
          {activeTab === 'push' && (
            <PushNotificationsPanel
              configs={pushConfigs}
              onChange={setPushConfigs}
            />
          )}
          {activeTab === 'automation' && (
            <AutomationRulesPanel
              rules={automationRules}
              emailTemplates={emailTemplates}
              smsTemplates={smsTemplates}
              pushConfigs={pushConfigs}
              onChange={setAutomationRules}
            />
          )}
        </div>
      </div>

      {/* Template Editor Drawer */}
      <TemplateEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        type={drawerType}
        initialTemplate={selectedTemplate}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTemplate(undefined);
        }}
        onSave={handleSaveTemplate}
      />
    </AdminAppLayout>
  );
};

export default AdminNotificationsPage;
