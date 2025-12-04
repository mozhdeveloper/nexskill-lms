import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

// Dummy course detail data
const coursesData: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Complete UI/UX Design Bootcamp',
    category: 'Design',
    level: 'Beginner',
    rating: 4.8,
    reviewCount: 1240,
    studentsCount: 12450,
    duration: '24h 30m',
    price: 49,
    originalPrice: 99,
    description: 'Dive deep into the world of UI/UX design with this comprehensive bootcamp. Learn industry-standard tools, design thinking methodologies, and create stunning user interfaces. This course covers everything from wireframing to high-fidelity prototyping, user research, and usability testing.',
    whatYouLearn: [
      'Master Figma, Sketch, and Adobe XD from scratch',
      'Create wireframes and interactive prototypes',
      'Conduct user research and usability testing',
      'Apply design thinking methodology to solve problems',
      'Build a professional portfolio with real-world projects',
      'Understand color theory, typography, and layout principles',
    ],
    tools: ['Figma', 'Sketch', 'Adobe XD', 'InVision', 'Principle'],
    curriculum: [
      {
        id: 1,
        title: 'Module 1: Design Foundations',
        lessons: [
          { id: 1, title: 'Introduction to UI/UX Design', duration: '15:30' },
          { id: 2, title: 'Design Thinking Process', duration: '22:45' },
          { id: 3, title: 'Color Theory Fundamentals', duration: '18:20' },
          { id: 4, title: 'Typography Best Practices', duration: '25:10' },
        ],
      },
      {
        id: 2,
        title: 'Module 2: Wireframing & Prototyping',
        lessons: [
          { id: 1, title: 'Low-Fidelity Wireframing', duration: '28:15' },
          { id: 2, title: 'High-Fidelity Mockups', duration: '32:40' },
          { id: 3, title: 'Interactive Prototyping', duration: '35:25' },
          { id: 4, title: 'Micro-interactions & Animations', duration: '30:50' },
        ],
      },
      {
        id: 3,
        title: 'Module 3: User Research & Testing',
        lessons: [
          { id: 1, title: 'User Personas & Journey Maps', duration: '20:30' },
          { id: 2, title: 'Conducting User Interviews', duration: '24:15' },
          { id: 3, title: 'Usability Testing Methods', duration: '27:45' },
          { id: 4, title: 'Analyzing & Implementing Feedback', duration: '22:30' },
        ],
      },
    ],
    reviews: [
      {
        id: 1,
        userName: 'Emily Rodriguez',
        avatar: '👩',
        rating: 5,
        date: 'Nov 28, 2025',
        comment: 'Absolutely amazing course! The instructor explains complex concepts in a very simple way. The projects are practical and helped me build a strong portfolio.',
      },
      {
        id: 2,
        userName: 'James Chen',
        avatar: '👨',
        rating: 5,
        date: 'Nov 15, 2025',
        comment: 'Best investment I made for my career. Went from knowing nothing about UI/UX to landing my first design job in 3 months!',
      },
      {
        id: 3,
        userName: 'Sarah Williams',
        avatar: '👩',
        rating: 4,
        date: 'Nov 10, 2025',
        comment: 'Great content and well-structured. Would love to see more advanced topics covered in future updates.',
      },
    ],
    coach: {
      name: 'Alexandra Morgan',
      avatar: '👩‍🏫',
      bio: 'Senior Product Designer with 10+ years of experience at leading tech companies. Passionate about teaching and helping aspiring designers break into the industry.',
      studentsCount: 45000,
      coursesCount: 8,
      rating: 4.9,
    },
    includes: [
      '24.5 hours of on-demand video',
      '45 downloadable resources',
      'Lifetime access',
      'Certificate of completion',
      'Access on mobile and desktop',
      'Community support',
    ],
  },
  '2': {
    id: '2',
    title: 'Advanced React & TypeScript',
    category: 'Development',
    level: 'Advanced',
    rating: 4.9,
    reviewCount: 892,
    studentsCount: 8920,
    duration: '18h 15m',
    price: 79,
    originalPrice: 129,
    description: 'Take your React skills to the next level with advanced patterns, performance optimization, and TypeScript integration. Build production-ready applications with best practices used by industry leaders.',
    whatYouLearn: [
      'Master advanced React patterns and hooks',
      'Write type-safe code with TypeScript',
      'Optimize performance and bundle size',
      'Implement state management with Redux Toolkit',
      'Build scalable application architecture',
      'Testing strategies with Jest and React Testing Library',
    ],
    tools: ['React', 'TypeScript', 'Redux', 'Jest', 'Webpack'],
    curriculum: [
      {
        id: 1,
        title: 'Module 1: Advanced React Patterns',
        lessons: [
          { id: 1, title: 'Custom Hooks Deep Dive', duration: '32:15' },
          { id: 2, title: 'Compound Components', duration: '28:40' },
          { id: 3, title: 'Render Props vs HOCs', duration: '25:30' },
        ],
      },
      {
        id: 2,
        title: 'Module 2: TypeScript Integration',
        lessons: [
          { id: 1, title: 'TypeScript Fundamentals', duration: '35:20' },
          { id: 2, title: 'Typing React Components', duration: '30:45' },
          { id: 3, title: 'Generics and Utility Types', duration: '27:15' },
        ],
      },
    ],
    reviews: [
      {
        id: 1,
        userName: 'Michael Tech',
        avatar: '👨‍💻',
        rating: 5,
        date: 'Dec 1, 2025',
        comment: 'The most comprehensive React course I\'ve taken. Really helped me understand advanced patterns.',
      },
    ],
    coach: {
      name: 'David Kim',
      avatar: '👨‍💼',
      bio: 'Full-stack developer and tech lead with experience at Google and Facebook. Love sharing knowledge about modern web development.',
      studentsCount: 32000,
      coursesCount: 6,
      rating: 4.9,
    },
    includes: [
      '18 hours of on-demand video',
      '30 coding exercises',
      'Lifetime access',
      'Certificate of completion',
      'GitHub repository access',
    ],
  },
};

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'coach'>('overview');
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const course = courseId ? coursesData[courseId] : null;

  if (!course) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Course not found</h2>
            <p className="text-text-secondary mb-6">The course you're looking for doesn't exist.</p>
            <Link
              to="/student/courses"
              className="inline-block px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleEnroll = () => {
    console.log('Enrolling in course:', course.id);
    setIsEnrolled(true);
  };

  const handleAddToWishlist = () => {
    console.log('Added to wishlist:', course.id);
  };

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary">{course.title}</h1>
              <span className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-medium">
                {course.level}
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-3">{course.category}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold text-text-primary">{course.rating}</span>
                <span className="text-text-muted">({course.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <span>👥</span>
                <span>{course.studentsCount.toLocaleString()} students</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <span>⏱️</span>
                <span>{course.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6">
          {/* Left: Tabbed Content */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="flex gap-2 mb-6 border-b border-[#EDF0FB]">
              {(['overview', 'curriculum', 'reviews', 'coach'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-text-secondary hover:text-brand-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl shadow-card p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">About this course</h3>
                    <p className="text-text-secondary leading-relaxed">{course.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">What you'll learn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.whatYouLearn.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm text-text-secondary">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Tools & Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tools.map((tool: string) => (
                        <span
                          key={tool}
                          className="px-4 py-2 bg-[#F5F7FF] text-brand-primary rounded-full text-sm font-medium"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Course curriculum</h3>
                  {course.curriculum.map((module: any) => (
                    <div key={module.id} className="border border-[#EDF0FB] rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FF] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-5 h-5 text-text-muted transition-transform ${
                              expandedModules.includes(module.id) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-medium text-text-primary">{module.title}</span>
                        </div>
                        <span className="text-sm text-text-muted">{module.lessons.length} lessons</span>
                      </button>

                      {expandedModules.includes(module.id) && (
                        <div className="bg-[#FAFBFF] p-4 space-y-2">
                          {module.lessons.map((lesson: any) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between py-2 px-3 hover:bg-white rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-text-muted">▶️</span>
                                <span className="text-sm text-text-secondary">{lesson.title}</span>
                              </div>
                              <span className="text-xs text-text-muted">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-8 pb-6 border-b border-[#EDF0FB]">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-text-primary mb-1">{course.rating}</div>
                      <div className="text-yellow-500 text-xl mb-1">★★★★★</div>
                      <div className="text-sm text-text-muted">{course.reviewCount} reviews</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {course.reviews.map((review: any) => (
                      <div key={review.id} className="pb-6 border-b border-[#EDF0FB] last:border-0">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl flex-shrink-0">
                            {review.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-text-primary">{review.userName}</p>
                                <p className="text-xs text-text-muted">{review.date}</p>
                              </div>
                              <div className="text-yellow-500">
                                {'★'.repeat(review.rating)}
                              </div>
                            </div>
                            <p className="text-sm text-text-secondary">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'coach' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-5xl flex-shrink-0">
                      {course.coach.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-primary mb-2">{course.coach.name}</h3>
                      <p className="text-text-secondary mb-4">{course.coach.bio}</p>
                      
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{course.coach.studentsCount.toLocaleString()}</div>
                          <div className="text-xs text-text-muted">Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{course.coach.coursesCount}</div>
                          <div className="text-xs text-text-muted">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{course.coach.rating}</div>
                          <div className="text-xs text-text-muted">Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Pricing Card */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-card p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-text-primary">${course.price}</span>
                  {course.originalPrice && (
                    <span className="text-lg text-text-muted line-through">${course.originalPrice}</span>
                  )}
                </div>
                {course.originalPrice && (
                  <span className="text-sm text-green-600 font-medium">
                    Save {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {isEnrolled ? (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                  <span className="text-green-700 font-medium">✓ Enrolled!</span>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleEnroll}
                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    Enroll now
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className="w-full py-3 bg-white border-2 border-brand-primary text-brand-primary font-medium rounded-full hover:bg-brand-primary-soft transition-colors"
                  >
                    Add to wishlist
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-[#EDF0FB]">
                <h4 className="text-sm font-semibold text-text-primary mb-3">This course includes:</h4>
                <div className="space-y-2">
                  {course.includes.map((item: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-brand-primary mt-0.5">✓</span>
                      <span className="text-sm text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseDetail;
