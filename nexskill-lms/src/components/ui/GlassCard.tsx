import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hoverEffect = true
}) => {
    return (
        <div
            className={`
        glass-card rounded-[24px] p-6 transition-all duration-300
        ${hoverEffect ? 'hover:scale-[1.01] hover:-translate-y-1' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
