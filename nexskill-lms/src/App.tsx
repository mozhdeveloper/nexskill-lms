import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UiPreferencesProvider } from './context/UiPreferencesContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/system/ErrorBoundary';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import EmailVerification from './pages/auth/EmailVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OnboardingPreferences from './pages/auth/OnboardingPreferences';
import StudentDashboard from './pages/student/StudentDashboard';
import CourseCatalog from './pages/student/CourseCatalog';
import CourseDetail from './pages/student/CourseDetail';
import CoursePlayer from './pages/student/CoursePlayer';
import QuizStart from './pages/student/QuizStart';
import QuizSession from './pages/student/QuizSession';
import QuizResult from './pages/student/QuizResult';
import DiscussionBoard from './pages/student/DiscussionBoard';
import ThreadView from './pages/student/ThreadView';
import CourseCircle from './pages/student/CourseCircle';
import AICoachHome from './pages/student/AICoachHome';
import CoachingCalendar from './pages/student/CoachingCalendar';
import CoachProfile from './pages/student/CoachProfile';
import CoachingBooking from './pages/student/CoachingBooking';
import CoachingSessions from './pages/student/CoachingSessions';
import StudentProfileView from './pages/student/StudentProfileView';
import StudentProfileEdit from './pages/student/StudentProfileEdit';
import StudentSettings from './pages/student/StudentSettings';
import StudentAccountSettings from './pages/student/StudentAccountSettings';
import StudentBilling from './pages/student/StudentBilling';
import CertificatesList from './pages/student/CertificatesList';
import CertificateDetail from './pages/student/CertificateDetail';
import CertificateVerify from './pages/student/CertificateVerify';
import MembershipPlans from './pages/student/MembershipPlans';
import MembershipManage from './pages/student/MembershipManage';
import MembershipConfirmation from './pages/student/MembershipConfirmation';
import LiveClassRoom from './pages/student/LiveClassRoom';
import LiveClasses from './pages/student/LiveClasses';
import CoachDashboard from './pages/coach/CoachDashboard';
import CourseList from './pages/coach/CourseList';
import CourseCreate from './pages/coach/CourseCreate';
import CourseBuilder from './pages/coach/CourseBuilder';
import AICourseToolsHome from './pages/coach/AICourseToolsHome';
import CourseStudents from './pages/coach/CourseStudents';
import CoachingToolsHub from './pages/coach/CoachingToolsHub';
import EarningsDashboard from './pages/coach/EarningsDashboard';
import CoachProfilePage from './pages/coach/CoachProfilePage';
import AdminLogin from './pages/auth/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import CoachesManagementPage from './pages/admin/CoachesManagementPage';
import CourseModerationPage from './pages/admin/CourseModerationPage';
import FinancialControlPage from './pages/admin/FinancialControlPage';
import AdminCrmMarketingPage from './pages/admin/AdminCrmMarketingPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSystemSettingsPage from './pages/admin/AdminSystemSettingsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import FunnelDashboardPage from './pages/admin/funnels/FunnelDashboardPage';
import FunnelBuilderPage from './pages/admin/funnels/FunnelBuilderPage';
import ContactsPage from './pages/admin/contacts/ContactsPage';
import ContactProfilePlaceholderPage from './pages/admin/contacts/ContactProfilePlaceholderPage';
import Error404Page from './pages/system/Error404Page';
import Error500Page from './pages/system/Error500Page';
import MaintenanceModePage from './pages/system/MaintenanceModePage';
import SecurityCenterPage from './pages/admin/security/SecurityCenterPage';
import CookieConsentBanner from './components/system/CookieConsentBanner';

// New role-based placeholder dashboards
import PlatformOwnerDashboardPage from './pages/owner/PlatformOwnerDashboardPage';
import UsersRolesPage from './pages/owner/UsersRolesPage';
import BillingPayoutsPage from './pages/owner/BillingPayoutsPage';
import SecurityCompliancePage from './pages/owner/SecurityCompliancePage';
import SystemSettingsPage from './pages/owner/SystemSettingsPage';
import AiGovernancePage from './pages/owner/AiGovernancePage';
import SubCoachDashboardPage from './pages/subcoach/SubCoachDashboardPage';
import SubCoachStudentsPage from './pages/subcoach/SubCoachStudentsPage';
import SubCoachLessonsPage from './pages/subcoach/SubCoachLessonsPage';
import SubCoachGradingPage from './pages/subcoach/SubCoachGradingPage';
import SubCoachGroupsPage from './pages/subcoach/SubCoachGroupsPage';
import SubCoachCommunityPage from './pages/subcoach/SubCoachCommunityPage';
import SubCoachNotificationsPage from './pages/subcoach/SubCoachNotificationsPage';
import SubCoachProfilePage from './pages/subcoach/SubCoachProfilePage';

// Support Staff Pages
import SupportDashboardPage from './pages/support/SupportDashboardPage';
import SupportTicketsPage from './pages/support/SupportTicketsPage';
import SupportStudentsPage from './pages/support/SupportStudentsPage';
import SupportTechStatusPage from './pages/support/SupportTechStatusPage';
import SupportCertificatesPage from './pages/support/SupportCertificatesPage';
import SupportKnowledgeBasePage from './pages/support/SupportKnowledgeBasePage';
import SupportProfilePage from './pages/support/SupportProfilePage';

// Community Manager Pages
import CommunityDashboardPage from './pages/community/CommunityDashboardPage';
import CommunityOverviewPage from './pages/community/CommunityOverviewPage';
import CommunityGroupsPage from './pages/community/CommunityGroupsPage';
import CommunityApprovalQueuePage from './pages/community/CommunityApprovalQueuePage';
import CommunityAnnouncementsPage from './pages/community/CommunityAnnouncementsPage';
import CommunityEngagementPage from './pages/community/CommunityEngagementPage';
import CommunityProfilePage from './pages/community/CommunityProfilePage';

// Organization Owner Pages
import OrgDashboardPage from './pages/org/OrgDashboardPage';
import OrgTeamPage from './pages/org/OrgTeamPage';
import OrgSeatsPage from './pages/org/OrgSeatsPage';
import OrgLearnersPage from './pages/org/OrgLearnersPage';
import OrgAnalyticsPage from './pages/org/OrgAnalyticsPage';
import OrgProgramsPage from './pages/org/OrgProgramsPage';
import OrgLicensesPage from './pages/org/OrgLicensesPage';
import OrgBillingPage from './pages/org/OrgBillingPage';
import OrgBrandingPage from './pages/org/OrgBrandingPage';
import OrgSettingsPage from './pages/org/OrgSettingsPage';

// Content Editor Pages
import ContentEditorDashboardPage from './pages/content/ContentEditorDashboardPage';
import ContentReviewQueuePage from './pages/content/ContentReviewQueuePage';
import CourseContentBrowserPage from './pages/content/CourseContentBrowserPage';
import ResourceLibraryPage from './pages/content/ResourceLibraryPage';
import TranslationReviewPage from './pages/content/TranslationReviewPage';
import ContentSuggestionsPage from './pages/content/ContentSuggestionsPage';
import ContentEditorProfilePage from './pages/content/ContentEditorProfilePage';

// Role Guard (temporarily disabled for testing)
// import RoleGuard from './components/auth/RoleGuard';

function App() {
  return (
    <UiPreferencesProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding-preferences" element={<OnboardingPreferences />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Role-based Dashboard Routes */}
        {/* Platform Owner Routes */}
        <Route path="/owner/dashboard" element={<PlatformOwnerDashboardPage />} />
        <Route path="/owner/users" element={<UsersRolesPage />} />
        <Route path="/owner/billing" element={<BillingPayoutsPage />} />
        <Route path="/owner/security" element={<SecurityCompliancePage />} />
        <Route path="/owner/settings" element={<SystemSettingsPage />} />
        <Route path="/owner/ai-governance" element={<AiGovernancePage />} />
        
        {/* Admin Routes - accessible by PLATFORM_OWNER and ADMIN */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagementPage />} />
        <Route path="/admin/coaches" element={<CoachesManagementPage />} />
        <Route path="/admin/courses/moderation" element={<CourseModerationPage />} />
        <Route path="/admin/funnels" element={<FunnelDashboardPage />} />
        <Route path="/admin/funnels/:funnelId" element={<FunnelBuilderPage />} />
        <Route path="/admin/finance" element={<FinancialControlPage />} />
        <Route path="/admin/contacts" element={<ContactsPage />} />
        <Route path="/admin/contacts/:contactId" element={<ContactProfilePlaceholderPage />} />
        <Route path="/admin/crm-marketing" element={<AdminCrmMarketingPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/security" element={<SecurityCenterPage />} />
        <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
        
        {/* Coach Routes */}
        <Route path="/coach/dashboard" element={<CoachDashboard />} />
        <Route path="/coach/courses" element={<CourseList />} />
        <Route path="/coach/courses/new" element={<CourseCreate />} />
        <Route path="/coach/courses/:courseId/edit" element={<CourseBuilder />} />
        <Route path="/coach/courses/:courseId/students" element={<CourseStudents />} />
        <Route path="/coach/ai-tools" element={<AICourseToolsHome />} />
        <Route path="/coach/coaching-tools" element={<CoachingToolsHub />} />
        <Route path="/coach/earnings" element={<EarningsDashboard />} />
        <Route path="/coach/profile" element={<CoachProfilePage />} />
        
        {/* Sub-Coach Routes */}
        <Route path="/subcoach/dashboard" element={<SubCoachDashboardPage />} />
        <Route path="/subcoach/students" element={<SubCoachStudentsPage />} />
        <Route path="/subcoach/lessons" element={<SubCoachLessonsPage />} />
        <Route path="/subcoach/grading" element={<SubCoachGradingPage />} />
        <Route path="/subcoach/groups" element={<SubCoachGroupsPage />} />
        <Route path="/subcoach/community" element={<SubCoachCommunityPage />} />
        <Route path="/subcoach/notifications" element={<SubCoachNotificationsPage />} />
        <Route path="/subcoach/profile" element={<SubCoachProfilePage />} />
        
        {/* Content Editor Routes - RoleGuard temporarily disabled for testing */}
        <Route path="/content/dashboard" element={<ContentEditorDashboardPage />} />
        <Route path="/content/review-queue" element={<ContentReviewQueuePage />} />
        <Route path="/content/courses" element={<CourseContentBrowserPage />} />
        <Route path="/content/resources" element={<ResourceLibraryPage />} />
        <Route path="/content/translations" element={<TranslationReviewPage />} />
        <Route path="/content/suggestions" element={<ContentSuggestionsPage />} />
        <Route path="/content/profile" element={<ContentEditorProfilePage />} />
        
        {/* Community Manager Routes - RoleGuard temporarily disabled for testing */}
        <Route path="/community/dashboard" element={<CommunityDashboardPage />} />
        <Route path="/community/overview" element={<CommunityOverviewPage />} />
        <Route path="/community/groups" element={<CommunityGroupsPage />} />
        <Route path="/community/approvals" element={<CommunityApprovalQueuePage />} />
        <Route path="/community/announcements" element={<CommunityAnnouncementsPage />} />
        <Route path="/community/engagement" element={<CommunityEngagementPage />} />
        <Route path="/community/profile" element={<CommunityProfilePage />} />
        
        {/* Support Staff Routes - RoleGuard temporarily disabled for testing */}
        <Route path="/support/dashboard" element={<SupportDashboardPage />} />
        <Route path="/support/tickets" element={<SupportTicketsPage />} />
        <Route path="/support/students" element={<SupportStudentsPage />} />
        <Route path="/support/tech-status" element={<SupportTechStatusPage />} />
        <Route path="/support/certificates" element={<SupportCertificatesPage />} />
        <Route path="/support/knowledge-base" element={<SupportKnowledgeBasePage />} />
        <Route path="/support/profile" element={<SupportProfilePage />} />
        
        {/* Organization Owner Routes - RoleGuard temporarily disabled for testing */}
        <Route path="/org/dashboard" element={<OrgDashboardPage />} />
        <Route path="/org/team" element={<OrgTeamPage />} />
        <Route path="/org/seats" element={<OrgSeatsPage />} />
        <Route path="/org/learners" element={<OrgLearnersPage />} />
        <Route path="/org/analytics" element={<OrgAnalyticsPage />} />
        <Route path="/org/programs" element={<OrgProgramsPage />} />
        <Route path="/org/licenses" element={<OrgLicensesPage />} />
        <Route path="/org/billing" element={<OrgBillingPage />} />
        <Route path="/org/branding" element={<OrgBrandingPage />} />
        <Route path="/org/settings" element={<OrgSettingsPage />} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses" element={<CourseCatalog />} />
        <Route path="/student/courses/:courseId" element={<CourseDetail />} />
        <Route path="/student/courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
        
        {/* Quiz Routes */}
        <Route path="/student/courses/:courseId/quizzes/:quizId" element={<QuizStart />} />
        <Route path="/student/courses/:courseId/quizzes/:quizId/take" element={<QuizSession />} />
        <Route path="/student/courses/:courseId/quizzes/:quizId/result" element={<QuizResult />} />
        
        {/* Community Routes */}
        <Route path="/student/community" element={<DiscussionBoard />} />
        <Route path="/student/community/threads/:threadId" element={<ThreadView />} />
        <Route path="/student/courses/:courseId/circle" element={<CourseCircle />} />
        
        {/* AI Coach Route */}
        <Route path="/student/ai-coach" element={<AICoachHome />} />
        
        {/* Coaching Routes */}
        <Route path="/student/coaching" element={<CoachingCalendar />} />
        <Route path="/student/coaching/coaches/:coachId" element={<CoachProfile />} />
        <Route path="/student/coaching/coaches/:coachId/book" element={<CoachingBooking />} />
        <Route path="/student/coaching/sessions" element={<CoachingSessions />} />
        
        {/* Live Classes Routes */}
        <Route path="/student/live-classes" element={<LiveClasses />} />
        <Route path="/student/live-class/:classId" element={<LiveClassRoom />} />
        
        {/* Profile Routes */}
        <Route path="/student/profile" element={<StudentProfileView />} />
        <Route path="/student/profile/edit" element={<StudentProfileEdit />} />
        <Route path="/student/settings" element={<StudentSettings />} />
        <Route path="/student/settings/account" element={<StudentAccountSettings />} />
        <Route path="/student/settings/billing" element={<StudentBilling />} />
        
        {/* Certificates Routes */}
        <Route path="/student/certificates" element={<CertificatesList />} />
        <Route path="/student/certificates/:certificateId" element={<CertificateDetail />} />
        
        {/* Membership Routes */}
        <Route path="/student/membership" element={<MembershipPlans />} />
        <Route path="/student/membership/manage" element={<MembershipManage />} />
        <Route path="/student/membership/confirmation" element={<MembershipConfirmation />} />
        
        {/* Public Certificate Verification Route */}
        <Route path="/certificates/verify/:hash" element={<CertificateVerify />} />
        
        {/* System Error & Maintenance Routes */}
        <Route path="/404" element={<Error404Page />} />
        <Route path="/500" element={<Error500Page />} />
        <Route path="/maintenance" element={<MaintenanceModePage />} />
        
        {/* Catch-all route for 404 */}
        <Route path="*" element={<Error404Page />} />
      </Routes>
    </BrowserRouter>
        </ErrorBoundary>
        <CookieConsentBanner />
      </AuthProvider>
    </UiPreferencesProvider>
  );
}

export default App;
