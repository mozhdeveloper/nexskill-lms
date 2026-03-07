import React from "react";
import { useNavigate } from "react-router-dom";

interface Coach {
    id: string;
    name: string;
    avatar?: string;
    bio: string;
    jobTitle?: string;
    experienceLevel?: string;
    contentAreas?: string[];
    tools?: string[];
    linkedinUrl?: string;
    portfolioUrl?: string;
    studentsCount: number;
    coursesCount: number;
    rating: number;
    ratingIsHardcoded?: boolean;
}

interface CourseCoachTabProps {
    coach: Coach | null;
}

const CourseCoachTab: React.FC<CourseCoachTabProps> = ({ coach }) => {
    const navigate = useNavigate();

    if (!coach) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">👨‍🏫</div>
                <p className="text-text-muted">Instructor information coming soon</p>
            </div>
        );
    }

    const handleViewProfile = () => {
        navigate(`/student/coaching/coaches/${coach.id}`);
    };

    const handleMessageCoach = () => {
        // Navigate to messages with coach ID as query param
        navigate(`/student/messages?recipientId=${coach.id}&recipientName=${encodeURIComponent(coach.name)}`);
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-4xl text-white flex-shrink-0">
                    {coach.avatar?.length === 1 ? (
                        coach.avatar
                    ) : coach.avatar ? (
                        <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        coach.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={handleViewProfile}
                            className="text-xl font-bold text-text-primary dark:text-dark-text-primary hover:text-brand-primary transition-colors cursor-pointer"
                        >
                            {coach.name}
                        </button>
                        <button
                            onClick={handleMessageCoach}
                            className="p-2 rounded-full bg-brand-primary-soft hover:bg-brand-primary text-brand-primary hover:text-white transition-all"
                            title="Message Coach"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>
                    {coach.jobTitle && (
                        <p className="text-sm text-brand-primary font-medium mb-1">
                            {coach.jobTitle}
                        </p>
                    )}
                    {coach.experienceLevel && (
                        <p className="text-xs text-text-muted dark:text-dark-text-muted mb-3">
                            {coach.experienceLevel} Level
                        </p>
                    )}
                    <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                        {coach.bio}
                    </p>

                    {/* Social Links */}
                    {(coach.linkedinUrl || coach.portfolioUrl) && (
                        <div className="flex gap-3 mt-4">
                            {coach.linkedinUrl && (
                                <a
                                    href={coach.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    🔗 LinkedIn
                                </a>
                            )}
                            {coach.portfolioUrl && (
                                <a
                                    href={coach.portfolioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                                >
                                    🌐 Portfolio
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 border-t border-[#EDF0FB] dark:border-gray-700 pt-6">
                <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {coach.studentsCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
                        Students
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {coach.coursesCount}
                    </div>
                    <div className="text-xs text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
                        Courses
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {coach.rating.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
                        Rating
                        {coach.ratingIsHardcoded && (
                            <span className="ml-1 text-orange-400" title="Sample data">*</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Rating notice */}
            {coach.ratingIsHardcoded && (
                <p className="text-xs text-orange-400 italic">
                    * Rating is sample data. Rating system coming soon.
                </p>
            )}

            {/* Content Areas */}
            {coach.contentAreas && coach.contentAreas.length > 0 && (
                <div className="border-t border-[#EDF0FB] dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                        Areas of Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {coach.contentAreas.map((area, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-medium"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tools */}
            {coach.tools && coach.tools.length > 0 && (
                <div className="border-t border-[#EDF0FB] dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                        Tools & Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {coach.tools.map((tool, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-dark-text-secondary rounded-full text-xs"
                            >
                                {tool}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCoachTab;

