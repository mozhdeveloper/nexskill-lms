# Source Code Index - NexSkill LMS

Complete index of all source files and their purposes.

---

## 📁 Root Files

### `src/App.tsx`
Main application component with routing configuration for all user roles. Defines all routes using React Router.

### `src/App.css`
Global application styles and custom CSS overrides.

### `src/main.tsx`
Application entry point. Renders the app with context providers (Auth, UI Preferences).

### `src/index.css`
Base Tailwind CSS imports and global styles. Custom utility classes and animations.

---

## 🔐 Authentication & Authorization

### `src/context/AuthContext.tsx`
Authentication context provider. Manages user state, login/logout, role switching, and persistent auth.

### `src/context/UiPreferencesContext.tsx`
UI preferences context. Manages dark mode, theme preferences, and user interface settings.

### `src/components/auth/RoleGuard.tsx`
Protected route component. Restricts access based on user roles.

### `src/components/auth/RoleHeader.tsx`
Displays current user role and information in the header.

---

## 🎨 Branding Components

### `src/components/brand/BrandLogo.tsx`
Platform logo component with customizable size and styling.

### `src/components/brand/BrandLockup.tsx`
Combined logo and brand name component for headers and auth pages.

---

## 📐 Layouts

### `src/layouts/StudentAppLayout.tsx`
Main layout for student dashboard with sidebar navigation.

### `src/layouts/StudentAuthLayout.tsx`
Authentication page layout for student login/signup.

### `src/layouts/CoachAppLayout.tsx`
Coach dashboard layout with navigation and header.

### `src/layouts/AdminAppLayout.tsx`
Admin panel layout with advanced navigation and tools.

### `src/layouts/PlatformOwnerAppLayout.tsx`
Platform owner dashboard layout with system-wide controls.

### `src/layouts/ContentEditorAppLayout.tsx`
Content editor workspace layout.

### `src/layouts/ContentEditorLayout.tsx`
Alternative content editor layout.

### `src/layouts/CommunityManagerAppLayout.tsx`
Community manager dashboard layout.

### `src/layouts/CommunityManagerLayout.tsx`
Alternative community manager layout.

### `src/layouts/SubCoachAppLayout.tsx`
Sub-coach dashboard layout with limited navigation.

### `src/layouts/SupportStaffAppLayout.tsx`
Support staff workspace layout.

### `src/layouts/OrgOwnerAppLayout.tsx`
Organization owner dashboard layout.

### `src/layouts/OrgOwnerLayout.tsx`
Alternative org owner layout.

### `src/layouts/PublicSystemLayout.tsx`
Public-facing pages layout (error pages, maintenance).

---

## 👨‍🎓 Student Pages

### `src/pages/student/StudentDashboard.tsx`
Student home dashboard with course progress, upcoming sessions, and AI recommendations.

### `src/pages/student/CourseCatalog.tsx`
Browse and search all available courses with filters.

### `src/pages/student/CourseDetail.tsx`
Individual course details page with enrollment button.

### `src/pages/student/CoursePlayer.tsx`
Video player interface for watching course lessons.

### `src/pages/student/LiveClasses.tsx`
View scheduled live classes and join sessions.

### `src/pages/student/LiveClassRoom.tsx`
Live class room interface with video, chat, and interactive features.

### `src/pages/student/DiscussionBoard.tsx`
Community discussion forum for asking questions and sharing knowledge.

### `src/pages/student/ThreadView.tsx`
View individual discussion thread with replies.

### `src/pages/student/CourseCircle.tsx`
Course-specific community circle for enrolled students.

### `src/pages/student/CoachingSessions.tsx`
View and manage coaching session bookings.

### `src/pages/student/CoachingBooking.tsx`
Book a new coaching session with coach.

### `src/pages/student/CoachingCalendar.tsx`
Calendar view of coaching sessions.

### `src/pages/student/CoachProfile.tsx`
View coach profile and bio.

### `src/pages/student/AICoachHome.tsx`
AI-powered study assistant and personalized learning recommendations.

### `src/pages/student/QuizStart.tsx`
Quiz introduction and start page.

### `src/pages/student/QuizSession.tsx`
Active quiz taking interface.

### `src/pages/student/QuizResult.tsx`
Quiz results and feedback page.

### `src/pages/student/CertificatesList.tsx`
View all earned certificates.

### `src/pages/student/CertificateDetail.tsx`
Individual certificate view and download.

### `src/pages/student/CertificateVerify.tsx`
Public certificate verification page.

### `src/pages/student/MembershipPlans.tsx`
View and compare membership subscription plans.

### `src/pages/student/MembershipManage.tsx`
Manage current membership subscription.

### `src/pages/student/MembershipConfirmation.tsx`
Membership purchase confirmation page.

### `src/pages/student/StudentProfileView.tsx`
View student public profile.

### `src/pages/student/StudentProfileEdit.tsx`
Edit student profile information.

### `src/pages/student/StudentSettings.tsx`
Account settings and preferences.

### `src/pages/student/StudentAccountSettings.tsx`
Account security and privacy settings.

### `src/pages/student/StudentBilling.tsx`
Billing history and payment methods.

---

## 👨‍🏫 Coach Pages

### `src/pages/coach/CoachDashboard.tsx`
Coach home dashboard with course stats and student activity.

### `src/pages/coach/CourseList.tsx`
List of all courses created by coach.

### `src/pages/coach/CourseCreate.tsx`
Create new course form.

### `src/pages/coach/CourseBuilder.tsx`
Advanced course builder with drag-and-drop curriculum editor.

### `src/pages/coach/CourseStudents.tsx`
View students enrolled in a specific course.

### `src/pages/coach/CoachStudentsPage.tsx`
Manage all students across all courses.

### `src/pages/coach/CoachingToolsHub.tsx`
Hub for coaching tools (calendar, chat, notes, resources).

### `src/pages/coach/CoachMessagesPage.tsx`
Message center for student-coach communication.

### `src/pages/coach/CoachQuizzesPage.tsx`
Create and manage quizzes.

### `src/pages/coach/AICourseToolsHome.tsx`
AI-powered tools for course creation (quiz generator, content suggestions).

### `src/pages/coach/EarningsDashboard.tsx`
Revenue tracking and earnings overview.

### `src/pages/coach/SubCoachManagement.tsx`
Manage sub-coaches and assign tasks.

### `src/pages/coach/CoachProfilePage.tsx`
Edit coach profile and bio.

---

## 🛡️ Admin Pages

### `src/pages/admin/AdminDashboard.tsx`
Admin home dashboard with platform-wide statistics.

### `src/pages/admin/AdminDashboardPlaceholder.tsx`
Placeholder admin dashboard (legacy).

### `src/pages/admin/UsersManagementPage.tsx`
Manage all platform users (students, coaches, admins).

### `src/pages/admin/CoachesManagementPage.tsx`
Manage coaches specifically.

### `src/pages/admin/FinancialControlPage.tsx`
Financial management (transactions, payouts, refunds, coupons).

### `src/pages/admin/AdminCrmMarketingPage.tsx`
CRM and marketing tools (email campaigns, WhatsApp, segmentation).

### `src/pages/admin/AdminAnalyticsPage.tsx`
Platform analytics dashboard.

### `src/pages/admin/CourseModerationPage.tsx`
Moderate and approve course content.

### `src/pages/admin/AdminSystemSettingsPage.tsx`
System-wide settings (API keys, integrations, feature flags).

### `src/pages/admin/AdminNotificationsPage.tsx`
Manage notification templates and campaigns.

### `src/pages/admin/contacts/ContactsPage.tsx`
CRM contacts database.

### `src/pages/admin/contacts/ContactProfilePlaceholderPage.tsx`
Individual contact profile view.

### `src/pages/admin/funnels/FunnelDashboardPage.tsx`
Marketing funnels overview.

### `src/pages/admin/funnels/FunnelBuilderPage.tsx`
Visual funnel builder interface.

### `src/pages/admin/funnels/FunnelBuilderPlaceholderPage.tsx`
Funnel builder placeholder.

### `src/pages/admin/security/SecurityCenterPage.tsx`
Security settings and audit logs.

---

## 🏢 Platform Owner Pages

### `src/pages/owner/PlatformOwnerDashboardPage.tsx`
Platform owner main dashboard.

### `src/pages/owner/PlatformOwnerDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/owner/SystemSettingsPage.tsx`
System-wide configuration and branding.

### `src/pages/owner/UsersRolesPage.tsx`
User role management and permissions.

### `src/pages/owner/BillingPayoutsPage.tsx`
Platform revenue and payout management.

### `src/pages/owner/AiGovernancePage.tsx`
AI usage governance and cost tracking.

### `src/pages/owner/SecurityCompliancePage.tsx`
Security and compliance settings.

---

## 📝 Content Editor Pages

### `src/pages/content/ContentEditorDashboardPage.tsx`
Content editor main dashboard.

### `src/pages/content/ContentEditorDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/content/ContentReviewQueuePage.tsx`
Queue of content pending review.

### `src/pages/content/ContentSuggestionsPage.tsx`
Review content improvement suggestions.

### `src/pages/content/ResourceLibraryPage.tsx`
Centralized content resource library.

### `src/pages/content/CourseContentBrowserPage.tsx`
Browse and search course content.

### `src/pages/content/TranslationReviewPage.tsx`
Review translated content.

### `src/pages/content/ContentEditorProfilePage.tsx`
Content editor profile page.

---

## 👥 Community Manager Pages

### `src/pages/community/CommunityDashboardPage.tsx`
Community manager main dashboard.

### `src/pages/community/CommunityManagerDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/community/CommunityOverviewPage.tsx`
Community overview and statistics.

### `src/pages/community/CommunityGroupsPage.tsx`
Manage community groups.

### `src/pages/community/CommunityApprovalQueuePage.tsx`
Approve pending community posts.

### `src/pages/community/CommunityAnnouncementsPage.tsx`
Create and manage announcements.

### `src/pages/community/CommunityEngagementPage.tsx`
Track community engagement metrics.

### `src/pages/community/CommunityProfilePage.tsx`
Community manager profile.

---

## 🎯 Sub-Coach Pages

### `src/pages/subcoach/SubCoachDashboardPage.tsx`
Sub-coach main dashboard.

### `src/pages/subcoach/SubCoachDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/subcoach/SubCoachStudentsPage.tsx`
View assigned students.

### `src/pages/subcoach/SubCoachLessonsPage.tsx`
View assigned lessons to support.

### `src/pages/subcoach/SubCoachGradingPage.tsx`
Grade student assignments.

### `src/pages/subcoach/SubCoachGroupsPage.tsx`
Manage assigned student groups.

### `src/pages/subcoach/SubCoachCommunityPage.tsx`
Moderate community discussions.

### `src/pages/subcoach/SubCoachNotificationsPage.tsx`
View notifications and tasks.

### `src/pages/subcoach/SubCoachProfilePage.tsx`
Sub-coach profile page.

---

## 🆘 Support Staff Pages

### `src/pages/support/SupportDashboardPage.tsx`
Support staff main dashboard.

### `src/pages/support/SupportStaffDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/support/SupportTicketsPage.tsx`
Manage support tickets.

### `src/pages/support/SupportStudentsPage.tsx`
Student lookup and support tools.

### `src/pages/support/SupportKnowledgeBasePage.tsx`
Knowledge base article management.

### `src/pages/support/SupportCertificatesPage.tsx`
Certificate support and validation.

### `src/pages/support/SupportTechStatusPage.tsx`
System status monitoring.

### `src/pages/support/SupportProfilePage.tsx`
Support staff profile.

---

## 🏛️ Organization Owner Pages

### `src/pages/org/OrgDashboardPage.tsx`
Organization owner main dashboard.

### `src/pages/org/OrgOwnerDashboardPlaceholder.tsx`
Dashboard placeholder.

### `src/pages/org/OrgTeamPage.tsx`
Manage organization team members.

### `src/pages/org/OrgLearnersPage.tsx`
View organization learners.

### `src/pages/org/OrgSeatsPage.tsx`
Manage seat licenses.

### `src/pages/org/OrgLicensesPage.tsx`
License management.

### `src/pages/org/OrgProgramsPage.tsx`
Learning programs for organization.

### `src/pages/org/OrgAnalyticsPage.tsx`
Organization analytics.

### `src/pages/org/OrgBillingPage.tsx`
Organization billing and invoices.

### `src/pages/org/OrgBrandingPage.tsx`
Custom organization branding.

### `src/pages/org/OrgSettingsPage.tsx`
Organization settings and configuration.

---

## 🔐 Authentication Pages

### `src/pages/auth/Login.tsx`
Login page with role selector (mock auth).

### `src/pages/auth/SignUp.tsx`
User registration page.

### `src/pages/auth/AdminLogin.tsx`
Dedicated admin login page.

### `src/pages/auth/ForgotPassword.tsx`
Password reset request page.

### `src/pages/auth/ResetPassword.tsx`
Password reset form page.

### `src/pages/auth/EmailVerification.tsx`
Email verification page.

### `src/pages/auth/OnboardingPreferences.tsx`
New user onboarding preferences setup.

---

## 🚨 System Pages

### `src/pages/system/Error404Page.tsx`
404 Not Found error page.

### `src/pages/system/Error500Page.tsx`
500 Internal Server Error page.

### `src/pages/system/MaintenanceModePage.tsx`
Maintenance mode page.

---

## 🧩 Admin Components

### Analytics
- `src/components/admin/analytics/AnalyticsTabs.tsx` - Analytics tab navigation
- `src/components/admin/analytics/UserAnalyticsPanel.tsx` - User analytics panel
- `src/components/admin/analytics/CourseAnalyticsPanel.tsx` - Course analytics panel
- `src/components/admin/analytics/CoachAnalyticsPanel.tsx` - Coach analytics panel
- `src/components/admin/analytics/FunnelAnalyticsPanel.tsx` - Funnel analytics panel
- `src/components/admin/analytics/AiAnalyticsPanel.tsx` - AI usage analytics
- `src/components/admin/analytics/BiReportsPanel.tsx` - BI reports panel

### Dashboard
- `src/components/admin/dashboard/AdminKpiSummary.tsx` - KPI summary cards
- `src/components/admin/dashboard/AdminRevenueOverview.tsx` - Revenue charts
- `src/components/admin/dashboard/AdminPlatformAnalytics.tsx` - Platform metrics
- `src/components/admin/dashboard/AdminSystemAlerts.tsx` - System alerts widget

### Users Management
- `src/components/admin/users/UsersTable.tsx` - Users listing table
- `src/components/admin/users/UserFiltersBar.tsx` - User filters and search
- `src/components/admin/users/UserFormDrawer.tsx` - User create/edit form
- `src/components/admin/users/UserRoleBadge.tsx` - Role badge display
- `src/components/admin/users/UserRolesPanel.tsx` - Role assignment panel
- `src/components/admin/users/PendingCoachesPanel.tsx` - Coach approval queue
- `src/components/admin/users/OrganizationManagementPanel.tsx` - Organization management

### Financial
- `src/components/admin/finance/TransactionsTable.tsx` - Transactions listing
- `src/components/admin/finance/PayoutManagementPanel.tsx` - Payout management
- `src/components/admin/finance/RefundManagementPanel.tsx` - Refund approval
- `src/components/admin/finance/CouponCreatorPanel.tsx` - Coupon creation
- `src/components/admin/finance/SubscriptionAnalyticsPanel.tsx` - Subscription metrics

### CRM & Marketing
- `src/components/admin/crm/LeadsDatabaseTable.tsx` - Leads database
- `src/components/admin/crm/LeadsFiltersBar.tsx` - Lead filters
- `src/components/admin/crm/LeadTagsManager.tsx` - Lead tagging system
- `src/components/admin/crm/LeadScoreRulesPanel.tsx` - Lead scoring rules
- `src/components/admin/crm/BulkEmailCampaignsPanel.tsx` - Email campaigns
- `src/components/admin/crm/WhatsappBroadcastCenterPanel.tsx` - WhatsApp broadcasts
- `src/components/admin/crm/FunnelsManagerPanel.tsx` - Funnel manager
- `src/components/admin/crm/LandingPagesManagerPanel.tsx` - Landing pages

### Contacts
- `src/components/admin/contacts/ContactsTable.tsx` - Contacts listing
- `src/components/admin/contacts/ContactsFiltersBar.tsx` - Contact filters
- `src/components/admin/contacts/AssignOwnerDropdown.tsx` - Assign contact owner

### Funnels
- `src/components/admin/funnels/FunnelListTable.tsx` - Funnel listing
- `src/components/admin/funnels/FunnelBuilderCanvas.tsx` - Visual funnel builder
- `src/components/admin/funnels/FunnelStepNode.tsx` - Funnel step node component
- `src/components/admin/funnels/FunnelStepSettingsPanel.tsx` - Step settings
- `src/components/admin/funnels/FunnelCreateModal.tsx` - Create funnel modal
- `src/components/admin/funnels/FunnelAnalyticsPanel.tsx` - Funnel analytics
- `src/components/admin/funnels/FunnelSplitTestPanel.tsx` - A/B test panel
- `src/components/admin/funnels/FunnelDashboardFiltersBar.tsx` - Funnel filters

### Content Moderation
- `src/components/admin/moderation/CourseApprovalTable.tsx` - Course approval queue
- `src/components/admin/moderation/CourseModerationFiltersBar.tsx` - Moderation filters
- `src/components/admin/moderation/CourseQualityScorePanel.tsx` - Quality scoring
- `src/components/admin/moderation/ReportedContentQueuePanel.tsx` - Reported content

### Notifications
- `src/components/admin/notifications/NotificationChannelsTabs.tsx` - Notification channels
- `src/components/admin/notifications/PushNotificationsPanel.tsx` - Push notifications
- `src/components/admin/notifications/EmailTemplatesPanel.tsx` - Email templates
- `src/components/admin/notifications/SmsTemplatesPanel.tsx` - SMS templates
- `src/components/admin/notifications/TemplateEditorDrawer.tsx` - Template editor
- `src/components/admin/notifications/AutomationRulesPanel.tsx` - Automation rules

### Settings
- `src/components/admin/settings/SystemSettingsTabs.tsx` - Settings tab navigation
- `src/components/admin/settings/ApiKeysPanel.tsx` - API key management
- `src/components/admin/settings/IntegrationsPanel.tsx` - Third-party integrations
- `src/components/admin/settings/FeatureTogglesPanel.tsx` - Feature flags
- `src/components/admin/settings/AuditLogsPanel.tsx` - Audit log viewer
- `src/components/admin/settings/AccessControlPanel.tsx` - Access control
- `src/components/admin/settings/LanguageManagerPanel.tsx` - Language settings

### Security
- `src/components/admin/security/SecurityActivitySummaryCard.tsx` - Security overview
- `src/components/admin/security/TwoFactorSettingsCard.tsx` - 2FA settings
- `src/components/admin/security/PasswordRulesCard.tsx` - Password policy

---

## 🧩 Coach Components

### Course Building
- `src/components/coach/CourseBuilderSidebar.tsx` - Course builder sidebar navigation
- `src/components/coach/CurriculumEditor.tsx` - Drag-and-drop curriculum editor
- `src/components/coach/LessonEditorPanel.tsx` - Lesson content editor
- `src/components/coach/VideoUploadPanel.tsx` - Video upload interface
- `src/components/coach/QuizBuilderPanel.tsx` - Quiz creation tool
- `src/components/coach/ResourceUploadPanel.tsx` - Resource file uploads
- `src/components/coach/CoursePreviewPane.tsx` - Course preview
- `src/components/coach/CourseSettingsForm.tsx` - Course settings form
- `src/components/coach/CoursePricingForm.tsx` - Pricing configuration
- `src/components/coach/CoursePublishWorkflow.tsx` - Publishing workflow
- `src/components/coach/DripSchedulePanel.tsx` - Content drip scheduling
- `src/components/coach/CourseTable.tsx` - Course listing table

### AI Tools
- `src/components/coach/ai/AIQuizGeneratorTool.tsx` - AI quiz generator
- `src/components/coach/ai/AICourseOutlineTool.tsx` - AI course outline generator
- `src/components/coach/ai/AILessonCreatorTool.tsx` - AI lesson content creator
- `src/components/coach/ai/AIVideoScriptTool.tsx` - AI video script generator
- `src/components/coach/ai/AISalesPageCopyTool.tsx` - AI sales page copy
- `src/components/coach/ai/AISocialCaptionTool.tsx` - AI social media captions

### Students Management
- `src/components/coach/students/StudentListTable.tsx` - Student listing
- `src/components/coach/students/StudentProgressOverview.tsx` - Progress tracking
- `src/components/coach/students/StudentScoresPanel.tsx` - Scores and grades
- `src/components/coach/students/StudentExportBar.tsx` - Export student data
- `src/components/coach/students/GroupAnnouncementPanel.tsx` - Group announcements

### Earnings
- `src/components/coach/earnings/EarningsOverviewHeader.tsx` - Earnings summary
- `src/components/coach/earnings/RevenueChart.tsx` - Revenue visualization
- `src/components/coach/earnings/TransactionHistoryTable.tsx` - Transaction history
- `src/components/coach/earnings/MonthlyPayoutTable.tsx` - Payout schedule
- `src/components/coach/earnings/RefundRequestsPanel.tsx` - Refund requests
- `src/components/coach/earnings/TaxFormsPanel.tsx` - Tax documents
- `src/components/coach/earnings/AffiliateEarningsPanel.tsx` - Affiliate earnings

### Profile
- `src/components/coach/profile/CoachProfileHeader.tsx` - Profile header
- `src/components/coach/profile/CoachAvatarUploader.tsx` - Avatar upload
- `src/components/coach/profile/CoachBioForm.tsx` - Bio editor
- `src/components/coach/profile/CoachSocialLinksForm.tsx` - Social links
- `src/components/coach/profile/CoachAchievementsPanel.tsx` - Achievements display
- `src/components/coach/profile/CoachPoliciesPanel.tsx` - Coach policies

### Sub-Coach
- `src/components/coach/subcoach/SubCoachAssignmentModal.tsx` - Assign sub-coach tasks

---

## 🧩 Coaching Components

### Booking
- `src/components/coaching/CoachCard.tsx` - Coach profile card
- `src/components/coaching/TimeSlotPicker.tsx` - Time slot selection
- `src/components/coaching/BookingPaymentForm.tsx` - Payment form
- `src/components/coaching/BookingConfirmationCard.tsx` - Booking confirmation
- `src/components/coaching/SessionSummaryCard.tsx` - Session summary

### Tools
- `src/components/coaching/tools/AvailabilityCalendarPanel.tsx` - Availability calendar
- `src/components/coaching/tools/BookingTypesPanel.tsx` - Session types
- `src/components/coaching/tools/StudentChatPanel.tsx` - Student chat
- `src/components/coaching/tools/SessionNotesPanel.tsx` - Session notes
- `src/components/coaching/tools/SessionLogTable.tsx` - Session history
- `src/components/coaching/tools/SessionReplayUpload.tsx` - Upload recordings
- `src/components/coaching/tools/GroupCoachingDashboard.tsx` - Group coaching

---

## 🧩 Community Components

- `src/components/community/CommunityGroupsList.tsx` - Groups listing
- `src/components/community/CommunityOverviewList.tsx` - Community overview
- `src/components/community/CommunityKpiStrip.tsx` - Community KPIs
- `src/components/community/ApprovalQueueTable.tsx` - Post approval queue
- `src/components/community/AnnouncementsList.tsx` - Announcements
- `src/components/community/EngagementMetricsPanel.tsx` - Engagement metrics
- `src/components/community/PostComposer.tsx` - Create post interface
- `src/components/community/CommentThread.tsx` - Comment thread
- `src/components/community/ReactionBar.tsx` - Reaction buttons
- `src/components/community/ReportContentModal.tsx` - Report content
- `src/components/community/CircleChat.tsx` - Circle chat feature

---

## 🧩 Content Editor Components

- `src/components/content/ContentReviewQueueTable.tsx` - Review queue
- `src/components/content/ContentEditorKpiStrip.tsx` - Content editor KPIs
- `src/components/content/ContentSuggestionsList.tsx` - Content suggestions
- `src/components/content/ResourceLibraryList.tsx` - Resource library
- `src/components/content/CourseContentTree.tsx` - Content tree view
- `src/components/content/TranslationReviewList.tsx` - Translation review

---

## 🧩 Course Components

- `src/components/courses/CourseGridItem.tsx` - Course card for catalog
- `src/components/courses/CourseCategorySidebar.tsx` - Category filter
- `src/components/courses/CourseFilterBar.tsx` - Search and filters

---

## 🧩 Learning Components

- `src/components/learning/VideoPlayer.tsx` - Video player with controls
- `src/components/learning/LessonSidebar.tsx` - Lesson navigation sidebar
- `src/components/learning/LessonNotesPanel.tsx` - Take notes during lesson
- `src/components/learning/TranscriptPanel.tsx` - Video transcript
- `src/components/learning/AISummaryDrawer.tsx` - AI lesson summary
- `src/components/learning/AskAIWidget.tsx` - Ask AI questions
- `src/components/learning/DownloadCenter.tsx` - Download resources
- `src/components/learning/PdfReader.tsx` - PDF document viewer
- `src/components/learning/MarkLessonCompleteModal.tsx` - Complete lesson

---

## 🧩 Quiz Components

- `src/components/quiz/QuestionProgressBar.tsx` - Quiz progress indicator
- `src/components/quiz/QuestionMultipleChoice.tsx` - Multiple choice question
- `src/components/quiz/QuestionTrueFalse.tsx` - True/false question
- `src/components/quiz/QuestionImageChoice.tsx` - Image-based question
- `src/components/quiz/QuestionFeedback.tsx` - Answer feedback

---

## 🧩 Certificate Components

- `src/components/certificates/CertificateCard.tsx` - Certificate preview card
- `src/components/certificates/CertificateViewer.tsx` - Full certificate view
- `src/components/certificates/CertificateShareBar.tsx` - Share buttons
- `src/components/certificates/BlockchainVerificationBadge.tsx` - Blockchain verification

---

## 🧩 AI Components

- `src/components/ai/AIChatPanel.tsx` - AI chat interface
- `src/components/ai/AIPersonalizedStudyPlan.tsx` - AI study plan
- `src/components/ai/AIProgressRecommendations.tsx` - AI recommendations
- `src/components/ai/AIRevisionTasks.tsx` - AI revision tasks
- `src/components/ai/AIExplainSimplyCard.tsx` - Simplify complex topics
- `src/components/ai/AIMilestoneNotifications.tsx` - Milestone notifications

---

## 🧩 Membership Components

- `src/components/membership/MembershipPlanCard.tsx` - Plan card
- `src/components/membership/MembershipFeatureCompare.tsx` - Feature comparison
- `src/components/membership/MembershipPaymentSummary.tsx` - Payment summary
- `src/components/membership/MembershipChangeFlow.tsx` - Change plan flow
- `src/components/membership/MembershipCancelPanel.tsx` - Cancel membership

---

## 🧩 Profile Components

- `src/components/profile/ProfileHeaderCard.tsx` - Profile header
- `src/components/profile/ProfileAccountSettingsForm.tsx` - Account settings
- `src/components/profile/ProfileNotificationSettings.tsx` - Notification preferences
- `src/components/profile/ProfileLanguagePreferences.tsx` - Language settings
- `src/components/profile/ProfileInterestsGoals.tsx` - Interests and goals
- `src/components/profile/ProfilePaymentMethods.tsx` - Payment methods
- `src/components/profile/ProfileBillingHistory.tsx` - Billing history

---

## 🧩 Organization Components

- `src/components/org/OrgOwnerKpiStrip.tsx` - Organization KPIs
- `src/components/org/OrgTeamTable.tsx` - Team members table
- `src/components/org/OrgLearnersTable.tsx` - Learners table
- `src/components/org/OrgSeatsSummaryCard.tsx` - Seats summary
- `src/components/org/OrgAnalyticsOverview.tsx` - Analytics overview

---

## 🧩 Platform Owner Components

- `src/components/owner/PlatformOwnerOverviewKpiStrip.tsx` - Platform KPIs
- `src/components/owner/SystemQuickLinksCard.tsx` - Quick links
- `src/components/owner/RoleMatrixSummaryCard.tsx` - Role matrix
- `src/components/owner/AiUsageOverviewCard.tsx` - AI usage overview
- `src/components/owner/DevRoleSwitcherPanel.tsx` - Development role switcher

---

## 🧩 Sub-Coach Components

- `src/components/subcoach/SubCoachKpiStrip.tsx` - Sub-coach KPIs
- `src/components/subcoach/AssignedStudentsTable.tsx` - Assigned students
- `src/components/subcoach/AssignedLessonsList.tsx` - Assigned lessons
- `src/components/subcoach/GradingQueueList.tsx` - Grading queue
- `src/components/subcoach/GroupSessionsList.tsx` - Group sessions
- `src/components/subcoach/SubCoachNotificationList.tsx` - Notifications

---

## 🧩 Support Components

- `src/components/support/SupportKpiStrip.tsx` - Support KPIs
- `src/components/support/SupportTicketsTable.tsx` - Tickets table
- `src/components/support/SupportStudentList.tsx` - Student lookup
- `src/components/support/KnowledgeBaseList.tsx` - KB articles
- `src/components/support/CertificatesList.tsx` - Certificates list
- `src/components/support/TechStatusPanel.tsx` - System status

---

## 🧩 System Components

- `src/components/system/DarkModeToggle.tsx` - Dark mode toggle
- `src/components/system/ThemeToggle.tsx` - Theme switcher
- `src/components/system/NotificationBell.tsx` - Notification bell icon
- `src/components/system/GlobalTopBarControls.tsx` - Top bar controls
- `src/components/system/MultiLanguageSelector.tsx` - Language selector
- `src/components/system/SessionExpiredModal.tsx` - Session timeout modal
- `src/components/system/CookieConsentBanner.tsx` - Cookie consent
- `src/components/system/ErrorBoundary.tsx` - Error boundary wrapper

---

## 🔧 Utilities & Types

### `src/types/roles.ts`
TypeScript type definitions for all user roles. Defines UserRole enum, role labels, icons, and routing.

### `src/utils/errorHandler.ts`
Global error handling utility functions.

### `src/lib/supabaseClient.ts`
Supabase client configuration and initialization.

### `src/examples/sessionExpiryExamples.tsx`
Example components for session expiry handling.

---

## 📊 File Statistics

- **Total Files:** 343
- **Pages:** 118
- **Components:** 218
- **Layouts:** 14
- **Context Providers:** 2
- **Utilities:** 3
- **Type Definitions:** 1
- **Style Files:** 2
- **Entry Points:** 2

---

## 🎨 File Naming Conventions

### Pages
- Pattern: `[Role][Feature]Page.tsx` (e.g., `StudentDashboard.tsx`, `AdminAnalyticsPage.tsx`)
- Location: `src/pages/[role]/`

### Components
- Pattern: `[Feature][Type].tsx` (e.g., `CourseCard.tsx`, `UserTable.tsx`)
- Location: `src/components/[category]/`

### Layouts
- Pattern: `[Role]AppLayout.tsx` or `[Role]Layout.tsx`
- Location: `src/layouts/`

### Context
- Pattern: `[Feature]Context.tsx`
- Location: `src/context/`

---

**Last Updated:** December 10, 2025
**Total Lines of Code:** ~50,000+ (estimated)
