import React, { useState } from 'react';

interface Announcement {
  id: number;
  title: string;
  target: string;
  createdAt: string;
  status: 'Active' | 'Scheduled' | 'Archived';
  author: string;
  content?: string;
}

const AnnouncementsList: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 1, title: 'Platform Maintenance Scheduled', target: 'All Communities', createdAt: '2 days ago', status: 'Active', author: 'Admin Team', content: 'We will be performing scheduled maintenance on Saturday from 2-4 AM EST. Some features may be temporarily unavailable.' },
    { id: 2, title: 'New Community Guidelines', target: 'All Communities', createdAt: '5 days ago', status: 'Active', author: 'Community Team', content: 'Please review our updated community guidelines to ensure a positive experience for all members.' },
    { id: 3, title: 'JavaScript Course Update Available', target: 'JavaScript Mastery', createdAt: '1 week ago', status: 'Active', author: 'Coach Sarah', content: 'New modules on React hooks and TypeScript have been added to the JavaScript Mastery course.' },
    { id: 4, title: 'Welcome New Members!', target: 'General Discussion', createdAt: '1 week ago', status: 'Active', author: 'CM Alex', content: 'A warm welcome to all new members who joined this week! Introduce yourself in the comments.' },
    { id: 5, title: 'Holiday Schedule Changes', target: 'All Communities', createdAt: '2 weeks ago', status: 'Scheduled', author: 'Admin Team', content: 'Support hours will be reduced during the holiday season. Please plan accordingly.' },
    { id: 6, title: 'Q3 Community Awards', target: 'All Communities', createdAt: '3 weeks ago', status: 'Archived', author: 'Community Team', content: 'Congratulations to all Q3 award winners! Your contributions make our community great.' },
  ]);

  const [editModal, setEditModal] = useState<Announcement | null>(null);
  const [deleteModal, setDeleteModal] = useState<Announcement | null>(null);
  const [viewModal, setViewModal] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState({ title: '', target: '', content: '' });
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditForm({
      title: announcement.title,
      target: announcement.target,
      content: announcement.content || '',
    });
    setEditModal(announcement);
  };

  const handleSaveEdit = () => {
    if (editModal) {
      setAnnouncements(prev => prev.map(a => 
        a.id === editModal.id 
          ? { ...a, title: editForm.title, target: editForm.target, content: editForm.content }
          : a
      ));
      showFeedback(`Announcement "${editForm.title}" has been updated`);
      setEditModal(null);
    }
  };

  const handleArchive = (announcement: Announcement) => {
    const newStatus = announcement.status === 'Archived' ? 'Active' : 'Archived';
    setAnnouncements(prev => prev.map(a => 
      a.id === announcement.id ? { ...a, status: newStatus } : a
    ));
    showFeedback(`Announcement ${newStatus === 'Archived' ? 'archived' : 'restored'}`, 'info');
  };

  const handleDelete = () => {
    if (deleteModal) {
      setAnnouncements(prev => prev.filter(a => a.id !== deleteModal.id));
      showFeedback(`Announcement "${deleteModal.title}" has been deleted`);
      setDeleteModal(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
          actionFeedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          <span className="text-lg">{actionFeedback.type === 'success' ? '✅' : 'ℹ️'}</span>
          <p className="text-sm font-medium">{actionFeedback.message}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md border border-gray-100">
        <div className="p-6 space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 cursor-pointer" onClick={() => setViewModal(announcement)}>
                  <h3 className="text-sm font-semibold text-text-primary mb-1 hover:text-green-600 transition-colors">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>📢 {announcement.target}</span>
                    <span>•</span>
                    <span>by {announcement.author}</span>
                    <span>•</span>
                    <span>{announcement.createdAt}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(announcement.status)}`}>
                  {announcement.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchive(announcement)}
                  className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  {announcement.status === 'Archived' ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={() => setDeleteModal(announcement)}
                  className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">{viewModal.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>📢 {viewModal.target}</span>
                    <span>•</span>
                    <span>by {viewModal.author}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="text-2xl text-text-muted hover:text-text-primary"
                >×</button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <p className="text-sm text-text-primary">{viewModal.content || 'No content available.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(viewModal.status)}`}>
                  {viewModal.status}
                </span>
                <span className="text-xs text-text-muted">{viewModal.createdAt}</span>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setViewModal(null);
                    handleEdit(viewModal);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium"
                >
                  Edit Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Edit Announcement</h3>
                <button
                  onClick={() => setEditModal(null)}
                  className="text-2xl text-text-muted hover:text-text-primary"
                >×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Target</label>
                  <select
                    value={editForm.target}
                    onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="All Communities">All Communities</option>
                    <option value="JavaScript Mastery">JavaScript Mastery</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Data Analytics">Data Analytics</option>
                    <option value="General Discussion">General Discussion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🗑️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Delete Announcement</h3>
                  <p className="text-sm text-text-muted">This action cannot be undone</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <p className="text-sm font-medium text-text-primary">{deleteModal.title}</p>
                <p className="text-xs text-text-muted mt-1">by {deleteModal.author} • {deleteModal.createdAt}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementsList;
