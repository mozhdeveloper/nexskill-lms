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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
