import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentAppLayout from "../../layouts/StudentAppLayout";
import CourseFilterBar from "../../components/courses/CourseFilterBar";
import CourseCategorySidebar from "../../components/courses/CourseCategorySidebar";
import CourseGridItem from "../../components/courses/CourseGridItem";
import { useCourses } from '../../hooks/useCourses';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';

// Categories for the filter sidebar
const categories = [
  "All",
  "Design",
  "Development",
  "Marketing",
  "Data & Analytics",
  "Business",
  "Personal Development",
];

// Helper to format duration from hours (number) to string
const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const CourseCatalog: React.FC = () => {
  const navigate = useNavigate();
  // Fetch ALL courses
  const { courses: dbCourses, loading: loadingAll, error: errorAll } = useCourses();
  // Fetch ENROLLED courses
  const { courses: enrolledCourses, loading: loadingEnrolled, error: errorEnrolled } = useEnrolledCourses();

  const [activeTab, setActiveTab] = useState<'browse' | 'enrolled'>('enrolled');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortOption, setSortOption] = useState("Most popular");

  // Determine which source data to use
  const sourceCourses = activeTab === 'browse' ? dbCourses : enrolledCourses;
  const isLoading = activeTab === 'browse' ? loadingAll : loadingEnrolled;

  // Map DB courses to UI format
  const mappedCourses = useMemo(() => {
    return sourceCourses.map(course => ({
      id: course.id,
      title: course.title,
      category: (course as any).category?.name || 'Uncategorized', // Handle joined data
      level: course.level || 'Beginner',
      rating: 0,
      studentsCount: 0,
      duration: formatDuration(course.duration_hours || 0),
      price: course.price || 0,
      originalPrice: undefined,
      isBestseller: false,
      isNew: new Date(course.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      thumbnail: 'gradient-blue-purple', // Could vary based on ID
      shortDescription: course.short_description || '',
    }));
  }, [sourceCourses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = [...mappedCourses];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.shortDescription.toLowerCase().includes(query),
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory,
      );
    }

    // Filter by level
    if (selectedLevel !== "All") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Sort courses
    switch (sortOption) {
      case "Most popular":
        filtered.sort((a, b) => b.studentsCount - a.studentsCount);
        break;
      case "Highest rated":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "Newest":
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "Price: low to high":
        filtered.sort((a, b) => a.price - b.price);
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedLevel, sortOption, mappedCourses]);

  const handleCourseClick = (courseId: string) => {
    navigate(`/student/courses/${courseId}`);
  };

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-1">
              {activeTab === 'enrolled' ? 'My Courses' : 'Course Catalog'}
            </h1>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              {activeTab === 'enrolled'
                ? 'Continue learning and track your progress'
                : 'Discover courses tailored to your learning goals'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'enrolled'
                  ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              My Enrollments
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'browse'
                  ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              Browse All
            </button>
          </div>
        </div>
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                {filteredCourses.length}{" "}
                {filteredCourses.length === 1 ? "course" : "courses"} found
              </p>
              {isLoading && <p className="text-sm text-brand-primary">Loading courses...</p>}
            </div>

            {/* Course Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading courses...</p>
                </div>
              </div>
            ) : filteredCourses.length > 0 ? (
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
              <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card dark:bg-dark-background-card p-12 text-center transition-colors">
                <div className="text-6xl mb-4">
                  {activeTab === 'enrolled' ? '📚' : '🔍'}
                </div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                  {activeTab === 'enrolled' ? 'No Enrolled Courses' : 'No courses found'}
                </h3>
                <p className="text-text-secondary dark:text-dark-text-secondary">
                  {activeTab === 'enrolled'
                    ? 'You haven\'t enrolled in any courses yet. Switch to "Browse All" to find one!'
                    : 'Try adjusting your filters or search query'}
                </p>
                {activeTab === 'enrolled' && (
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-full hover:shadow-lg transition-all"
                  >
                    Browse Courses
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseCatalog;
