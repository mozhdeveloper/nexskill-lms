import React from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-8">
      <div className={`w-full ${widthClass} bg-white rounded-[32px] shadow-card p-8 md:p-12`}>
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-brand-primary">NexSkill</span>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default StudentAuthLayout;
