import React, { useState } from 'react';
import ContentEditorLayout from '../../layouts/ContentEditorLayout';
import ResourceLibraryList from '../../components/content/ResourceLibraryList';

const ResourceLibraryPage: React.FC = () => {
  const [filters, setFilters] = useState({
    course: 'all',
    type: 'all',
    status: 'all',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    course: '',
    title: '',
    type: 'pdf',
    description: '',
    file: null as File | null
  });

  const courses = ['JavaScript Mastery', 'UI/UX Design', 'Product Management', 'Data Analytics'];
  const types = ['PDF', 'Image', 'Video', 'Archive'];
  const statuses = ['Active', 'Draft', 'Archived'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUploadResource = () => {
    console.log('Uploading resource:', uploadData);
    alert(`Resource "${uploadData.title}" uploaded successfully!`);
    setShowUploadModal(false);
    setUploadData({ course: '', title: '', type: 'pdf', description: '', file: null });
  };

  return (
    <ContentEditorLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Resource Library</h1>
            <p className="text-sm text-text-secondary">
              Manage PDFs, images, videos, and other course materials
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
            >
              📤 Upload Resource
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
                <span className="text-sm text-text-muted">Total Resources</span>
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">127</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">PDFs</span>
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">58</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Images</span>
                <span className="text-2xl">🖼️</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">43</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Videos</span>
                <span className="text-2xl">🎥</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">26</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search resources by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
              </div>

              {/* Filters Row */}
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
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-secondary">Type:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  >
                    <option value="all">All Types</option>
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-secondary">Status:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(filters.course !== 'all' || filters.type !== 'all' || filters.status !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilters({ course: 'all', type: 'all', status: 'all' });
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Resource Library List */}
          <ResourceLibraryList />

          {/* Storage Info */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                💾
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary mb-2">Storage Usage</h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">3.2 GB of 10 GB used</span>
                    <span className="font-semibold text-text-primary">32%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">
                  You have 6.8 GB of storage remaining for course resources.
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Resource Management Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Optimize Images</p>
                  <p className="text-xs text-text-secondary">Compress images to reduce file size without losing quality</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Descriptive Names</p>
                  <p className="text-xs text-text-secondary">Use clear filenames that describe the resource content</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Version Control</p>
                  <p className="text-xs text-text-secondary">Replace outdated resources instead of creating duplicates</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Regular Audits</p>
                  <p className="text-xs text-text-secondary">Review and remove unused resources monthly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={uploadData.course}
                  onChange={(e) => setUploadData({ ...uploadData, course: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g., JavaScript Cheat Sheet"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Type
                </label>
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="archive">Archive (ZIP/RAR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Brief description of the resource..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    {uploadData.file ? (
                      <p className="text-sm text-gray-900 font-medium">{uploadData.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 font-medium mb-1">Click to browse files</p>
                        <p className="text-xs text-gray-500">or drag and drop</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  📌 <strong>Note:</strong> Max file size: 100MB. Supported formats: PDF, JPG, PNG, MP4, ZIP
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadResource}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Upload Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentEditorLayout>
  );
};

export default ResourceLibraryPage;
