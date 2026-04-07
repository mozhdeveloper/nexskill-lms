import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Star, Users, Clock, Filter, Grid, List } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail_url?: string;
  instructor_name?: string;
  price?: number;
  rating?: number;
  num_reviews?: number;
  num_students?: number;
  level?: string;
  category?: string;
  category_name?: string;
  duration_minutes?: number;
}

const CourseCatalog: React.FC = () => {
  const { profile: currentUser } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<{id: string; label: string}[]>([
    { id: 'all', label: 'All Courses' }
  ]);

  const levels = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('📚 Fetching courses...');

        // Step 0: Fetch categories for the filter
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name');

        if (categoriesData) {
          setCategories([
            { id: 'all', label: 'All Courses' },
            ...categoriesData.map((cat: any) => ({ id: cat.slug || cat.id, label: cat.name })).reverse()
          ]);
        }

        // Step 1: Fetch basic course data
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*, categories(name)')
          .eq('verification_status', 'approved');

        if (coursesError) {
          console.error('❌ Error fetching courses:', coursesError);
          throw coursesError;
        }

        console.log('✅ Courses fetched:', coursesData?.length || 0);

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch instructor profiles for all courses
        const coachIds = [...new Set(coursesData.map((c: any) => c.coach_id).filter(Boolean))];
        let profilesMap: Record<string, string> = {};

        if (coachIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', coachIds);

          if (profilesData) {
            profilesMap = profilesData.reduce((acc, profile: any) => {
              acc[profile.id] = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Step 3: Fetch enrollment counts for all courses
        const courseIds = coursesData.map((c: any) => c.id);
        let enrollmentCounts: Record<string, number> = {};

        if (courseIds.length > 0) {
          try {
            const { data: enrollmentsData } = await supabase
              .from('enrollments')
              .select('course_id')
              .in('course_id', courseIds);

            if (enrollmentsData) {
              enrollmentCounts = enrollmentsData.reduce((acc, enrollment: any) => {
                acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
            }
          } catch (e) {
            console.warn('Could not fetch enrollment counts');
          }
        }

        // Step 4: Fetch reviews for all courses
        let reviewRatings: Record<string, { sum: number; count: number }> = {};

        if (courseIds.length > 0) {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('course_id, rating')
            .in('course_id', courseIds);

          if (reviewsData) {
            reviewRatings = reviewsData.reduce((acc, review: any) => {
              if (!acc[review.course_id]) {
                acc[review.course_id] = { sum: 0, count: 0 };
              }
              acc[review.course_id].sum += (review.rating || 0);
              acc[review.course_id].count += 1;
              return acc;
            }, {} as Record<string, { sum: number; count: number }>);
          }
        }

        // Step 5: Combine all data
        const coursesWithDetails: Course[] = coursesData.map((course: any) => {
          const reviewData = reviewRatings[course.id];
          const rating = reviewData && reviewData.count > 0
            ? reviewData.sum / reviewData.count
            : 0;

          return {
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            price: course.price,
            category: course.category_id || course.category,
            category_name: course.categories?.name || 'Uncategorized',
            level: course.level,
            duration_minutes: course.duration_minutes || 0,
            instructor_name: profilesMap[course.coach_id] || 'Unknown Instructor',
            rating: rating,
            num_reviews: reviewData?.count || 0,
            num_students: enrollmentCounts[course.id] || 0,
          };
        });

        console.log('📖 Courses with details:', coursesWithDetails);
        setCourses(coursesWithDetails);
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter and sort courses
  const filteredCourses = courses.filter(course => {
    // Category filter (match by category_id or slug)
    if (selectedCategory !== 'all') {
      const categoryMatch = course.category === selectedCategory || 
                           categories.find(c => c.id === selectedCategory)?.label.toLowerCase() === course.category_name?.toLowerCase();
      if (!categoryMatch) return false;
    }

    // Level filter (case-insensitive)
    if (selectedLevel !== 'all' && course.level?.toLowerCase() !== selectedLevel.toLowerCase()) return false;

    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return 0; // Would need created_at field
      case 'popular':
        return (b.num_students || 0) - (a.num_students || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)]">
        {/* Header with Welcome */}
        <div className="bg-gradient-to-r from-[color:var(--color-brand-neon)] via-[color:var(--color-brand-electric)] to-[color:var(--color-brand-primary)] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {currentUser?.firstName || 'Student'}! 👋
            </h1>
            <p className="text-xl text-white/90">
              Explore {courses.length} courses and find the perfect one for you
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border-base)] sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

            
              {/* Level Filter */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                >
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-[color:var(--bg-secondary)] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-[color:var(--bg-primary)] shadow-sm' : 'hover:bg-[color:var(--bg-glass-hover)]'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-[color:var(--bg-primary)] shadow-sm' : 'hover:bg-[color:var(--bg-glass-hover)]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-[color:var(--color-brand-electric)] text-white shadow-lg shadow-[color:var(--color-brand-electric)]/25'
                      : 'bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-[color:var(--text-secondary)]">
            <span className="font-semibold text-[color:var(--text-primary)]">{filteredCourses.length}</span> courses found
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)] overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[color:var(--bg-secondary)]" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-[color:var(--bg-secondary)] rounded w-3/4" />
                    <div className="h-4 bg-[color:var(--bg-secondary)] rounded w-1/2" />
                    <div className="h-4 bg-[color:var(--bg-secondary)] rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20 bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)]">
              <div className="w-24 h-24 bg-[color:var(--color-brand-electric)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-[color:var(--color-brand-electric)]" />
              </div>
              <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">No courses found</h3>
              <p className="text-[color:var(--text-secondary)] mb-6">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-[color:var(--color-brand-electric)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/student/courses/${course.id}`}
                  className={`group bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)] overflow-hidden hover:shadow-xl hover:border-[color:var(--color-brand-electric)]/20 transition-all ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`${viewMode === 'list' ? 'w-80 flex-shrink-0' : ''} aspect-video bg-gray-100 relative overflow-hidden`}>
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                        <BookOpen className="w-12 h-12 text-purple-400" />
                      </div>
                    )}
                    {course.level && (
                      <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded-full">
                        {course.level}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {course.title}
                    </h3>
                    
                    {course.instructor_name && (
                      <p className="text-xs text-gray-500 mb-2">{course.instructor_name}</p>
                    )}

                    {/* Rating with Stars */}
                    {course.rating && course.rating > 0 ? (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-[color:var(--text-primary)]">{course.rating.toFixed(1)}</span>
                        <div className="flex text-yellow-400">
                          {'★'.repeat(Math.floor(course.rating))}
                          {'☆'.repeat(5 - Math.floor(course.rating))}
                        </div>
                        <span className="text-xs text-[color:var(--text-secondary)]">({course.num_reviews})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-[color:var(--text-secondary)]">No reviews yet</span>
                      </div>
                    )}

                  

                    {/* Course Info Row */}
                    <div className="flex items-center gap-4 text-xs text-[color:var(--text-secondary)] mb-4 flex-wrap">
                      {course.duration_minutes && course.duration_minutes > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">{formatDuration(course.duration_minutes)}</span>
                        </div>
                      )}
                      {course.num_students !== undefined && course.num_students > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium">{course.num_students} {course.num_students === 1 ? 'student' : 'students'}</span>
                        </div>
                      )}
                      {course.level && (
                        <span className="px-2 py-0.5 bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] rounded text-xs font-medium">
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-large font-bold text-[color:var(--text-primary)]">
                        {course.price && course.price > 0 ? `₱${course.price}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentAppLayout>
  );
};

export default CourseCatalog;
