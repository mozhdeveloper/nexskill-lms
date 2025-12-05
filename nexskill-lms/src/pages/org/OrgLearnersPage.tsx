import React, { useState } from 'react';
import OrgOwnerLayout from '../../layouts/OrgOwnerLayout';
import OrgLearnersTable from '../../components/org/OrgLearnersTable';

const OrgLearnersPage: React.FC = () => {
  const [filters, setFilters] = useState({
    course: 'all',
    status: 'all',
  });

  const courses = [
    'JavaScript Fundamentals',
    'Product Management Basics',
    'Data Analytics with Python',
    'UI/UX Design Principles',
  ];

  const statuses = ['Active', 'Completed', 'At Risk'];

  return (
    <OrgOwnerLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Learners</h1>
            <p className="text-sm text-text-secondary">
              Overview of all learners in your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
              📥 Export Data
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold">
              + Add Learner
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Total Learners</span>
                <span className="text-2xl">🎓</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">89</p>
              <p className="text-xs text-green-600 font-semibold mt-1">↑ 8 this month</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Active</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">76</p>
              <p className="text-xs text-text-muted mt-1">85% of total</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Completed</span>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">34</p>
              <p className="text-xs text-text-muted mt-1">At least one course</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">At Risk</span>
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">8</p>
              <p className="text-xs text-text-muted mt-1">Inactive 5+ days</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">Filters:</span>
              </div>
              
              {/* Course Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Course:</label>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option value="all">All Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(filters.course !== 'all' || filters.status !== 'all') && (
                <button
                  onClick={() => setFilters({ course: 'all', status: 'all' })}
                  className="px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}

              {/* Search */}
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search learners..."
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all w-64"
                />
                <button className="px-4 py-2 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-all text-sm">
                  🔍
                </button>
              </div>
            </div>
          </div>

          {/* Learners Table */}
          <OrgLearnersTable />

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-semibold text-text-primary">1-6</span> of{' '}
              <span className="font-semibold text-text-primary">89</span> learners
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                ← Previous
              </button>
              <button className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold">
                1
              </button>
              <button className="px-3 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                2
              </button>
              <button className="px-3 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                3
              </button>
              <button className="px-3 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                Next →
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                💡
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary mb-2">Learner Management Tips</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>Click on any learner row to view their detailed progress and history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>Learners marked"At Risk" haven't been active in 5+ days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>Export data for detailed reporting and analysis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrgOwnerLayout>
  );
};

export default OrgLearnersPage;
