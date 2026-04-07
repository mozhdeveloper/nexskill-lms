import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  instructor_name?: string;
  price?: number;
  rating?: number;
  num_reviews?: number;
  num_students?: number;
  duration_minutes?: number;
  thumbnail_url?: string;
  category?: string;
  level?: string;
}

const StudentBrowsePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Courses' },
    { id: 'development', label: 'Development' },
    { id: 'business', label: 'Business' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'it-software', label: 'IT & Software' },
    { id: 'personal-dev', label: 'Personal Development' },
    { id: 'health-fitness', label: 'Health & Fitness' },
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles (first_name, last_name),
            enrollments (student_id),
            reviews (rating)
          `)
          .eq('verification_status', 'approved');

        if (error) throw error;

        const coursesWithDetails = data?.map((course: any) => {
          const ratingSum = course.reviews?.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) || 0;
          const ratingCount = course.reviews?.length || 0;
          
          return {
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            thumbnail_url: course.thumbnail_url,
            price: course.price,
            category: course.category,
            level: course.level,
            instructor_name: `${course.profiles?.first_name || ''} ${course.profiles?.last_name || ''}`.trim(),
            rating: ratingCount > 0 ? ratingSum / ratingCount : 0,
            num_reviews: ratingCount,
            num_students: course.enrollments?.length || 0,
            duration_minutes: course.duration_minutes || 0,
          };
        }) || [];

        setCourses(coursesWithDetails);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <StudentAppLayout>
      <div className="max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Learn without limits
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Explore our collection of courses and start learning today
            </p>
            <Link
              to="/student/my-courses"
              className="inline-block px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all"
            >
              Go to My Learning
            </Link>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedCategory === 'all' ? 'All Courses' : categories.find(c => c.id === selectedCategory)?.label}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No courses found in this category.
              </h3>
              <p className="text-gray-600">
                Check back later for new courses!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/student/courses/${course.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    {course.level && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded">
                        {course.level}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {course.title}
                    </h3>
                    
                    {course.instructor_name && (
                      <p className="text-sm text-gray-500 mb-2">
                        {course.instructor_name}
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-500 font-bold text-sm">
                        {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
                      </span>
                      {course.rating > 0 && (
                        <div className="flex text-yellow-400 text-xs">
                          {'★'.repeat(Math.floor(course.rating))}
                          {'☆'.repeat(5 - Math.floor(course.rating))}
                        </div>
                      )}
                      {course.num_reviews > 0 && (
                        <span className="text-xs text-gray-400">
                          ({course.num_reviews})
                        </span>
                      )}
                    </div>

                    {/* Students & Duration */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span>{course.num_students} student{course.num_students !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{formatDuration(course.duration_minutes || 0)}</span>
                      </div>
                    </div>

                    {course.price && (
                      <p className="text-lg font-bold text-gray-900">
                        ${course.price}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentBrowsePage;
