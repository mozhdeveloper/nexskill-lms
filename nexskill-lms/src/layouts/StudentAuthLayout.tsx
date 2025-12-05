import React from 'react';
import BrandLockup from '../components/brand/BrandLockup';

interface StudentAuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'small' | 'large';
}

const StudentAuthLayout: React.FC<StudentAuthLayoutProps> = ({ 
  children, 
  maxWidth = 'large' 
}) => {
  const widthClass = maxWidth === 'small' ? 'max-w-[600px]' : 'max-w-[1100px]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-8 transition-colors">
      <div className={`w-full ${widthClass} bg-white rounded-[32px] shadow-card p-8 md:p-12 transition-colors`}>
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <BrandLockup orientation="vertical" />
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default StudentAuthLayout;
