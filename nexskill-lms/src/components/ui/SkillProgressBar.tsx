import React from 'react';

interface SkillProgressBarProps {
    progress: number; // 0 to 100
    label?: string;
    showPercentage?: boolean;
}

const SkillProgressBar: React.FC<SkillProgressBarProps> = ({
    progress,
    label,
    showPercentage = true
}) => {
    return (
        <div className="w-full">
            {/* Header */}
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-2">
                    {label && (
                        <span className="text-sm font-medium text-[color:var(--text-primary)]">
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span className="text-sm font-bold text-gradient">
                            {progress}%
                        </span>
                    )}
                </div>
            )}

            {/* Bar Track */}
            <div className="h-2 w-full bg-[color:var(--bg-secondary)] rounded-full overflow-hidden">
                {/* Animated Bar with Gradient */}
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                        width: `${progress}%`,
                        background: 'var(--gradient-master)',
                        boxShadow: '0 0 10px var(--border-glow)'
                    }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] translate-x-[-100%]"
                        style={{ animationName: 'shimmer', animationDuration: '2s', animationIterationCount: 'infinite' }} />
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
};

export default SkillProgressBar;
