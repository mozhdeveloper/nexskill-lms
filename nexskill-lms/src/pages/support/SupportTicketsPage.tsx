import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import SupportTicketsTable from '../../components/support/SupportTicketsTable';

interface Ticket {
  id: string;
  subject: string;
  student: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';
  category: string;
  created?: string;
  createdAt?: string;
}

const SupportTicketsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });

  const handleCreateTicket = () => {
    console.log('Creating ticket:', newTicket);
    alert('Ticket created successfully!');
    setShowCreateModal(false);
    setNewTicket({ subject: '', description: '', priority: 'medium', category: 'technical' });
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const handleResolveTicket = (ticketId: string) => {
    console.log('Resolving ticket:', ticketId);
    alert('Ticket marked as resolved!');
    setShowViewModal(false);
  };

  const handleExportTickets = () => {
    console.log('Exporting tickets...');
    alert('Ticket export started!');
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
              <p className="text-gray-600">Manage and respond to customer support requests</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportTickets}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium"
              >
                📥 Export
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
              >
                + New Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <SupportTicketsTable onViewTicket={handleViewTicket} />
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing</option>
                    <option value="account">Account</option>
                    <option value="course">Course Content</option>
                    <option value="certificate">Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Ticket ID</span>
                  <span className="font-mono text-sm text-purple-900">{selectedTicket.id}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                    selectedTicket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedTicket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Student</span>
                  <p className="font-semibold text-gray-900 mt-1">{selectedTicket.student}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Category</span>
                  <p className="font-semibold text-gray-900 mt-1">{selectedTicket.category}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Created</span>
                <p className="font-semibold text-gray-900 mt-1">{selectedTicket.createdAt || selectedTicket.created || 'N/A'}</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => console.log('Add note to ticket:', selectedTicket.id)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Add Note
                </button>
                <button
                  onClick={() => handleResolveTicket(selectedTicket.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportStaffAppLayout>
  );
};

export default SupportTicketsPage;
