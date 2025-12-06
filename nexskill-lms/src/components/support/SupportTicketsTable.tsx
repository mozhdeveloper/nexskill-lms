import { useState } from 'react';
import { Eye, MessageSquare, Clock } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  student: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'pending' | 'resolved';
  category: string;
  created: string;
  lastUpdate: string;
  messages: number;
}

interface SupportTicketsTableProps {
  onViewTicket?: (ticket: Ticket) => void;
}

const SupportTicketsTable = ({ onViewTicket }: SupportTicketsTableProps) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'pending' | 'resolved'>('all');

  const tickets: Ticket[] = [
    { id: 'T-2401', subject: 'Cannot access course video', student: 'Sarah Chen', priority: 'high', status: 'open', category: 'Technical', created: '2 hours ago', lastUpdate: '2 hours ago', messages: 1 },
    { id: 'T-2402', subject: 'Billing question about refund', student: 'Michael Brown', priority: 'medium', status: 'in-progress', category: 'Billing', created: '5 hours ago', lastUpdate: '1 hour ago', messages: 3 },
    { id: 'T-2403', subject: 'Certificate not generating', student: 'Emma Wilson', priority: 'urgent', status: 'open', category: 'Certificates', created: '30 minutes ago', lastUpdate: '30 minutes ago', messages: 1 },
    { id: 'T-2404', subject: 'How to reset my password?', student: 'James Lee', priority: 'low', status: 'pending', category: 'Account', created: '1 day ago', lastUpdate: '8 hours ago', messages: 2 },
    { id: 'T-2405', subject: 'Quiz not submitting answers', student: 'Olivia Martinez', priority: 'high', status: 'in-progress', category: 'Technical', created: '3 hours ago', lastUpdate: '20 minutes ago', messages: 4 },
    { id: 'T-2406', subject: 'Course completion issue', student: 'Noah Davis', priority: 'medium', status: 'resolved', category: 'Progress', created: '2 days ago', lastUpdate: '1 day ago', messages: 5 },
  ];

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in-progress': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-lg p-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'open', 'in-progress', 'pending', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Tickets' : f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ticket ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Last Update</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm font-semibold text-gray-700">{ticket.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ticket.subject}</span>
                      {ticket.messages > 1 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.messages}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">{ticket.student}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">{ticket.category}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {ticket.lastUpdate}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => onViewTicket ? onViewTicket(ticket) : setSelectedTicket(ticket)}
                      className="p-2 hover:bg-blue-100 rounded-xl transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Ticket ID</span>
                  <p className="font-mono text-lg font-bold text-gray-900">{selectedTicket.id}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Status</span>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Student</span>
                  <p className="text-lg font-medium text-gray-900">{selectedTicket.student}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Priority</span>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Category</span>
                  <p className="text-lg font-medium text-gray-900">{selectedTicket.category}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Created</span>
                  <p className="text-lg font-medium text-gray-900">{selectedTicket.created}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Subject</span>
                <p className="text-lg font-medium text-gray-900 mt-1">{selectedTicket.subject}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTicketsTable;
