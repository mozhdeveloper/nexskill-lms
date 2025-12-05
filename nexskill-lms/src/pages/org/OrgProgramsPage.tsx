import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';

interface Program {
  id: string;
  title: string;
  instructor: string;
  enrolledCount: number;
  completionRate: number;
  category: string;
  duration: string;
  status: 'active' | 'inactive' | 'archived';
  thumbnail: string;
}

const OrgProgramsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const programs: Program[] = [
    {
      id: '1',
      title: 'JavaScript Fundamentals',
      instructor: 'John Smith',
      enrolledCount: 45,
      completionRate: 78,
      category: 'Development',
      duration: '8 weeks',
      status: 'active',
      thumbnail: '💻'
    },
    {
      id: '2',
      title: 'Product Management Essentials',
      instructor: 'Sarah Johnson',
      enrolledCount: 32,
      completionRate: 85,
      category: 'Business',
      duration: '6 weeks',
      status: 'active',
      thumbnail: '📊'
    },
    {
      id: '3',
      title: 'Data Analytics with Python',
      instructor: 'Michael Chen',
      enrolledCount: 28,
      completionRate: 72,
      category: 'Data Science',
      duration: '10 weeks',
      status: 'active',
      thumbnail: '📈'
    },
    {
      id: '4',
      title: 'UI/UX Design Principles',
      instructor: 'Emily Rodriguez',
      enrolledCount: 38,
      completionRate: 91,
      category: 'Design',
      duration: '7 weeks',
      status: 'active',
      thumbnail: '🎨'
    },
    {
      id: '5',
      title: 'Advanced React Patterns',
      instructor: 'David Kim',
      enrolledCount: 15,
      completionRate: 68,
      category: 'Development',
      duration: '12 weeks',
      status: 'inactive',
      thumbnail: '⚛️'
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || program.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['Development', 'Business', 'Data Science', 'Design', 'Marketing'];

  const handleAssignProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowAssignModal(true);
  };

  const confirmAssignment = () => {
    console.log('Assigning program:', selectedProgram?.title);
    setShowAssignModal(false);
    setSelectedProgram(null);
  };

  return (
    <OrgOwnerAppLayout>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Training Programs</h1>
              <p className="text-[#5F6473]">Manage and assign training programs to your team</p>
            </div>
            <button 
              onClick={() => console.log('Browse catalog')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              + Browse Catalog
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-3xl font-bold text-[#111827] mb-1">{programs.length}</div>
              <div className="text-sm text-[#5F6473]">Total Programs</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {programs.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-[#5F6473]">Active Programs</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-3xl font-bold text-[#111827] mb-1">
                {programs.reduce((sum, p) => sum + p.enrolledCount, 0)}
              </div>
              <div className="text-sm text-[#5F6473]">Total Enrollments</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-3xl font-bold text-[#111827] mb-1">
                {Math.round(programs.reduce((sum, p) => sum + p.completionRate, 0) / programs.length)}%
              </div>
              <div className="text-sm text-[#5F6473]">Avg Completion</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 pl-12 bg-[#F5F7FF] rounded-full text-sm text-[#111827] placeholder-[#5F6473] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-6xl">
                  {program.thumbnail}
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-[#111827] flex-1">{program.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      program.status === 'active' ? 'bg-green-100 text-green-700' :
                      program.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {program.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-[#5F6473] mb-3">👨‍🏫 {program.instructor}</p>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-[#5F6473]">
                    <span>📁 {program.category}</span>
                    <span>⏱️ {program.duration}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-[#5F6473]">Enrolled:</span>
                      <span className="font-semibold text-[#111827]">{program.enrolledCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#5F6473]">Completion:</span>
                      <span className="font-semibold text-[#111827]">{program.completionRate}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${program.completionRate}%` }}
                    ></div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssignProgram(program)}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Assign to Team
                    </button>
                    <button
                      onClick={() => console.log('View details:', program.title)}
                      className="px-4 py-2 border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPrograms.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-[#111827] mb-2">No programs found</h3>
              <p className="text-[#5F6473]">Try adjusting your filters or browse the catalog</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111827]">Assign Program</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <p className="font-semibold text-[#111827] mb-1">{selectedProgram.title}</p>
                <p className="text-sm text-[#5F6473]">{selectedProgram.instructor}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Assign to
                </label>
                <select className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>All Team Members (142)</option>
                  <option>Specific Team Members</option>
                  <option>Specific Groups</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a message for your team..."
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] placeholder-[#5F6473] focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] text-[#111827] font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAssignment}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Assign Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrgOwnerAppLayout>
  );
};

export default OrgProgramsPage;
