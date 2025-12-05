import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CourseFilterBar from '../../components/courses/CourseFilterBar';
import CourseCategorySidebar from '../../components/courses/CourseCategorySidebar';
import CourseGridItem from '../../components/courses/CourseGridItem';

// Dummy course data
const allCourses = [
  {
    id: '1',
    title: 'Complete UI/UX Design Bootcamp',
    category: 'Design',
    level: 'Beginner' as const,
    rating: 4.8,
    studentsCount: 12450,
    duration: '24h 30m',
    price: 49,
    originalPrice: 99,
    isBestseller: true,
    isNew: false,
    thumbnail: 'gradient-blue-purple',
    shortDescription: 'Master UI/UX design from scratch with hands-on projects and real-world examples.',
  },
  {
    id: '2',
    title: 'Advanced React & TypeScript',
    category: 'Development',
    level: 'Advanced' as const,
    rating: 4.9,
    studentsCount: 8920,
    duration: '18h 15m',
    price: 79,
    originalPrice: 129,
    isBestseller: true,
    isNew: false,
    thumbnail: 'gradient-purple-pink',
    shortDescription: 'Build scalable applications with modern React patterns and TypeScript best practices.',
  },
  {
    id: '3',
    title: 'Digital Marketing Fundamentals',
    category: 'Marketing',
    level: 'Beginner' as const,
    rating: 4.6,
    studentsCount: 15230,
    duration: '12h 45m',
    price: 39,
    isBestseller: false,
    isNew: true,
    thumbnail: 'gradient-pink-orange',
    shortDescription: 'Learn SEO, social media marketing, content strategy, and analytics from industry experts.',
  },
  {
    id: '4',
    title: 'Data Science with Python',
    category: 'Data & Analytics',
    level: 'Intermediate' as const,
    rating: 4.7,
    studentsCount: 10540,
    duration: '32h 20m',
    price: 89,
    originalPrice: 149,
    isBestseller: false,
    isNew: false,
    thumbnail: 'gradient-green-blue',
    shortDescription: 'Master data analysis, visualization, and machine learning with Python and popular libraries.',
  },
  {
    id: '5',
    title: 'Figma Mastery for Designers',
    category: 'Design',
    level: 'Intermediate' as const,
    rating: 4.8,
    studentsCount: 7890,
    duration: '15h 30m',
    price: 59,
    isBestseller: false,
    isNew: true,
    thumbnail: 'gradient-purple-pink',
    shortDescription: 'Become a Figma expert with advanced techniques for UI design, prototyping, and collaboration.',
  },
  {
    id: '6',
    title: 'Full-Stack Web Development',
    category: 'Development',
    level: 'Intermediate' as const,
    rating: 4.9,
    studentsCount: 18750,
    duration: '45h 00m',
    price: 99,
    originalPrice: 179,
    isBestseller: true,
    isNew: false,
    thumbnail: 'gradient-blue-purple',
    shortDescription: 'Build complete web applications from frontend to backend with modern technologies.',
  },
  {
    id: '7',
    title: 'Business Strategy & Leadership',
    category: 'Business',
    level: 'Advanced' as const,
    rating: 4.7,
    studentsCount: 5430,
    duration: '20h 10m',
    price: 69,
    isBestseller: false,
    isNew: false,
    thumbnail: 'gradient-orange-red',
    shortDescription: 'Develop strategic thinking and leadership skills to drive business growth and innovation.',
  },
  {
    id: '8',
    title: 'SQL & Database Design',
    category: 'Data & Analytics',
    level: 'Beginner' as const,
    rating: 4.6,
    studentsCount: 9320,
    duration: '16h 40m',
    price: 45,
    isBestseller: false,
    isNew: true,
    thumbnail: 'gradient-green-blue',
    shortDescription: 'Learn SQL queries, database design, and data modeling for effective data management.',
  },
  {
    id: '9',
    title: 'Growth Marketing & Analytics',
    category: 'Marketing',
    level: 'Intermediate' as const,
    rating: 4.8,
    studentsCount: 6210,
    duration: '14h 25m',
    price: 55,
    originalPrice: 89,
    isBestseller: false,
    isNew: false,
    thumbnail: 'gradient-pink-orange',
    shortDescription: 'Master growth hacking strategies, A/B testing, and data-driven marketing techniques.',
  },
];

const categories = ['All', 'Design', 'Development', 'Marketing', 'Data & Analytics', 'Business'];

const CourseCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortOption, setSortOption] = useState('Most popular');

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = [...allCourses];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.shortDescription.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((course) => course.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel !== 'All') {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Sort courses
    switch (sortOption) {
      case 'Most popular':
        filtered.sort((a, b) => b.studentsCount - a.studentsCount);
        break;
      case 'Highest rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'Newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'Price: low to high':
        filtered.sort((a, b) => a.price - b.price);
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedLevel, sortOption]);

  const handleCourseClick = (courseId: string) => {
    navigate(`/student/courses/${courseId}`);
  };

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Course Catalog</h1>
        <p className="text-sm text-text-secondary">
          Discover courses tailored to your learning goals
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <CourseCategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Filter Bar */}
            <CourseFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-text-secondary">
                {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
              </p>
            </div>

            {/* Course Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseGridItem
                    key={course.id}
                    course={course}
                    onClick={handleCourseClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-card p-12 text-center transition-colors">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No courses found
                </h3>
                <p className="text-text-secondary">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseCatalog;
