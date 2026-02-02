import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    variant?: 'dark' | 'light' | 'auto';
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hoverEffect = true,
    variant = 'auto'
}) => {
    // Determine glass styling based on variant
    const getGlassStyles = () => {
        switch (variant) {
            case 'dark':
                // Force dark glass regardless of theme
                return 'bg-slate-900/70 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]';
            case 'light':
                // Force light glass regardless of theme
                return 'bg-white/70 backdrop-blur-xl border border-gray-200 hover:border-blue-400/50 hover:shadow-lg';
            case 'auto':
            default:
                // Use theme-aware CSS variables
                return 'glass-card';
        }
    };

    return (
        <div
            className={`
                rounded-[24px] p-6 transition-all duration-300
                ${getGlassStyles()}
                ${hoverEffect ? 'hover:scale-[1.01] hover:-translate-y-1' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
