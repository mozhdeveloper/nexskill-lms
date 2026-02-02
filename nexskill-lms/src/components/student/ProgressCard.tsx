import React from 'react';

interface ProgressCardProps {
    progressPercentage: number;
    hoursLearned: number;
    lessonsCompleted: number;
    totalLessons: number;
    timeFilter?: string;
    onFilterChange?: () => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
    progressPercentage,
    hoursLearned,
    lessonsCompleted,
    totalLessons,
    timeFilter = 'This week',
    onFilterChange
}) => {
    // Calculate circumference for the circle
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
        <div className="glass-card rounded-3xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-secondary">Progress</h3>
                <button
                    onClick={onFilterChange}
                    className="px-3 py-1 bg-brand-primary/10 rounded-full text-xs font-medium text-brand-primary flex items-center gap-1 hover:bg-brand-primary/20 transition-colors"
                >
                    {timeFilter}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="absolute inset-0 bg-brand-neon/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <svg className="transform -rotate-90 w-32 h-32 relative z-10">
                    {/* Background Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-700 transition-colors"
                        strokeWidth="12"
                        fill="none"
                    />
                    {/* Progress Circle with Gradient */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="url(#progressGradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset,
                            transition: 'stroke-dashoffset 1s ease-in-out'
                        }}
                    />
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-brand-neon)" />
                            <stop offset="100%" stopColor="var(--color-brand-electric)" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gradient">{progressPercentage}%</p>
                        <p className="text-xs text-text-muted">Complete</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <span className="text-sm text-text-secondary">Hours learned</span>
                    <span className="text-sm font-semibold text-text-primary">{hoursLearned}h</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <span className="text-sm text-text-secondary">Lessons completed</span>
                    <span className="text-sm font-semibold text-text-primary">{lessonsCompleted} / {totalLessons}</span>
                </div>
            </div>
        </div>
    );
};

export default ProgressCard;
