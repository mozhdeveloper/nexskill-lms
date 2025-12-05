import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import StudentAccountSettings from './pages/student/StudentAccountSettings';
import StudentBilling from './pages/student/StudentBilling';
import CertificatesList from './pages/student/CertificatesList';
import CertificateDetail from './pages/student/CertificateDetail';
import CertificateVerify from './pages/student/CertificateVerify';
import MembershipPlans from './pages/student/MembershipPlans';
import MembershipManage from './pages/student/MembershipManage';
import MembershipConfirmation from './pages/student/MembershipConfirmation';
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

function App() {
  return (
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
        
        {/* Profile Routes */}
        <Route path="/student/profile" element={<StudentProfileView />} />
        <Route path="/student/profile/edit" element={<StudentProfileEdit />} />
        <Route path="/student/settings/account" element={<StudentAccountSettings />} />
        <Route path="/student/settings/billing" element={<StudentBilling />} />
        
        {/* Certificates Routes */}
        <Route path="/student/certificates" element={<CertificatesList />} />
        <Route path="/student/certificates/:certificateId" element={<CertificateDetail />} />
        
        {/* Membership Routes */}
        <Route path="/student/membership" element={<MembershipPlans />} />
        <Route path="/student/membership/manage" element={<MembershipManage />} />
        <Route path="/student/membership/confirmation" element={<MembershipConfirmation />} />
        
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
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagementPage />} />
        <Route path="/admin/courses/moderation" element={<CourseModerationPage />} />
        <Route path="/admin/funnels" element={<FunnelDashboardPage />} />
        <Route path="/admin/funnels/:funnelId" element={<FunnelBuilderPage />} />
        <Route path="/admin/finance" element={<FinancialControlPage />} />
        <Route path="/admin/contacts" element={<ContactsPage />} />
        <Route path="/admin/contacts/:contactId" element={<ContactProfilePlaceholderPage />} />
        <Route path="/admin/crm-marketing" element={<AdminCrmMarketingPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
        
        {/* Public Certificate Verification Route */}
        <Route path="/certificates/verify/:hash" element={<CertificateVerify />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
