import React, { useState } from 'react';
import { X, Eye, Check, XCircle, FileText, Award, User, Mail, Phone, Calendar, Download, ExternalLink } from 'lucide-react';

interface CoachCertification {
  id: string;
  name: string;
  type: 'certificate' | 'diploma' | 'license' | 'other';
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  fileUrl: string;
  verified: boolean;
}

interface PendingCoach {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  appliedAt: string;
  expertise: string[];
  bio: string;
  yearsExperience: number;
  linkedinUrl?: string;
  websiteUrl?: string;
  certifications: CoachCertification[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

interface PendingCoachesPanelProps {
  onApprove?: (coachId: string) => void;
  onReject?: (coachId: string, reason: string) => void;
}

// Dummy pending coaches data
const dummyPendingCoaches: PendingCoach[] = [
  {
    id: 'coach-pending-1',
    firstName: 'Alexandra',
    lastName: 'Thompson',
    email: 'alexandra.t@email.com',
    phone: '+1 (555) 123-4567',
    appliedAt: '2025-12-04T10:30:00Z',
    expertise: ['Web Development', 'JavaScript', 'React'],
    bio: 'Senior software engineer with 8+ years of experience in full-stack web development. Passionate about teaching and mentoring aspiring developers.',
    yearsExperience: 8,
    linkedinUrl: 'https://linkedin.com/in/alexandrathompson',
    websiteUrl: 'https://alexthompson.dev',
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect',
        type: 'certificate',
        issuer: 'Amazon Web Services',
        issueDate: '2024-03-15',
        expiryDate: '2027-03-15',
        fileUrl: '/uploads/certs/aws-cert.pdf',
        verified: false,
      },
      {
        id: 'cert-2',
        name: 'Google Cloud Professional Developer',
        type: 'certificate',
        issuer: 'Google Cloud',
        issueDate: '2023-08-20',
        expiryDate: '2025-08-20',
        fileUrl: '/uploads/certs/gcp-cert.pdf',
        verified: false,
      },
    ],
    status: 'pending',
  },
  {
    id: 'coach-pending-2',
    firstName: 'Marcus',
    lastName: 'Rivera',
    email: 'marcus.r@email.com',
    phone: '+1 (555) 234-5678',
    appliedAt: '2025-12-03T14:15:00Z',
    expertise: ['Data Science', 'Machine Learning', 'Python'],
    bio: 'Data scientist with PhD in Computer Science. Specialized in machine learning and AI applications in business.',
    yearsExperience: 6,
    linkedinUrl: 'https://linkedin.com/in/marcusrivera',
    certifications: [
      {
        id: 'cert-3',
        name: 'TensorFlow Developer Certificate',
        type: 'certificate',
        issuer: 'Google',
        issueDate: '2024-01-10',
        fileUrl: '/uploads/certs/tf-cert.pdf',
        verified: false,
      },
      {
        id: 'cert-4',
        name: 'PhD in Computer Science',
        type: 'diploma',
        issuer: 'Stanford University',
        issueDate: '2019-06-15',
        fileUrl: '/uploads/certs/phd-diploma.pdf',
        verified: false,
      },
    ],
    status: 'under_review',
  },
  {
    id: 'coach-pending-3',
    firstName: 'Sarah',
    lastName: 'Kim',
    email: 'sarah.kim@email.com',
    phone: '+1 (555) 345-6789',
    appliedAt: '2025-12-02T09:45:00Z',
    expertise: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
    bio: 'Lead UX designer with 10 years of experience working with Fortune 500 companies. Specializes in user research and design systems.',
    yearsExperience: 10,
    linkedinUrl: 'https://linkedin.com/in/sarahkimux',
    websiteUrl: 'https://sarahkim.design',
    certifications: [
      {
        id: 'cert-5',
        name: 'Google UX Design Professional Certificate',
        type: 'certificate',
        issuer: 'Google',
        issueDate: '2023-05-22',
        fileUrl: '/uploads/certs/google-ux.pdf',
        verified: false,
      },
    ],
    status: 'pending',
  },
  {
    id: 'coach-pending-4',
    firstName: 'James',
    lastName: 'Okonkwo',
    email: 'james.o@email.com',
    phone: '+1 (555) 456-7890',
    appliedAt: '2025-12-01T16:20:00Z',
    expertise: ['Project Management', 'Agile', 'Scrum'],
    bio: 'Certified Scrum Master and PMP with experience leading cross-functional teams at tech startups and enterprise companies.',
    yearsExperience: 12,
    linkedinUrl: 'https://linkedin.com/in/jamesokonkwo',
    certifications: [
      {
        id: 'cert-6',
        name: 'Project Management Professional (PMP)',
        type: 'license',
        issuer: 'Project Management Institute',
        issueDate: '2020-02-28',
        expiryDate: '2026-02-28',
        fileUrl: '/uploads/certs/pmp.pdf',
        verified: false,
      },
      {
        id: 'cert-7',
        name: 'Certified Scrum Master (CSM)',
        type: 'certificate',
        issuer: 'Scrum Alliance',
        issueDate: '2019-11-15',
        expiryDate: '2025-11-15',
        fileUrl: '/uploads/certs/csm.pdf',
        verified: false,
      },
    ],
    status: 'pending',
  },
];

const PendingCoachesPanel: React.FC<PendingCoachesPanelProps> = ({ onApprove, onReject }) => {
  const [pendingCoaches, setPendingCoaches] = useState<PendingCoach[]>(dummyPendingCoaches);
  const [selectedCoach, setSelectedCoach] = useState<PendingCoach | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCoaches = pendingCoaches.filter((coach) => {
    const matchesSearch =
      searchQuery === '' ||
      `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ||
      coach.status === filterStatus;

    return matchesSearch && matchesStatus && (coach.status === 'pending' || coach.status === 'under_review');
  });

  const handleViewDetails = (coach: PendingCoach) => {
    setSelectedCoach(coach);
    setShowDetailModal(true);
  };

  const handleApprove = (coachId: string) => {
    setPendingCoaches(
      pendingCoaches.map((c) =>
        c.id === coachId ? { ...c, status: 'approved' as const } : c
      )
    );
    setShowDetailModal(false);
    setSelectedCoach(null);
    onApprove?.(coachId);
  };

  const handleReject = (coachId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setPendingCoaches(
      pendingCoaches.map((c) =>
        c.id === coachId ? { ...c, status: 'rejected' as const, reviewNotes: rejectReason } : c
      )
    );
    setShowRejectModal(false);
    setShowDetailModal(false);
    setSelectedCoach(null);
    setRejectReason('');
    onReject?.(coachId, rejectReason);
  };

  const handleMarkUnderReview = (coachId: string) => {
    setPendingCoaches(
      pendingCoaches.map((c) =>
        c.id === coachId ? { ...c, status: 'under_review' as const } : c
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: PendingCoach['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      case 'under_review':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Under Review</span>;
      case 'approved':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
    }
  };

  const getCertTypeBadge = (type: CoachCertification['type']) => {
    switch (type) {
      case 'certificate':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Certificate</span>;
      case 'diploma':
        return <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">Diploma</span>;
      case 'license':
        return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">License</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">Other</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm text-slate-600">Pending Review</p>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {pendingCoaches.filter((c) => c.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600">Under Review</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {pendingCoaches.filter((c) => c.status === 'under_review').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-slate-600">Approved This Week</p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {pendingCoaches.filter((c) => c.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or expertise..."
              className="w-full pl-4 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Pending</option>
            <option value="pending">Needs Review</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>
      </div>

      {/* Pending Coaches Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Coach Applications ({filteredCoaches.length})
          </h2>
        </div>

        {filteredCoaches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Expertise
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Certifications
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {coach.firstName.charAt(0)}{coach.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{coach.firstName} {coach.lastName}</p>
                          <p className="text-sm text-slate-500">{coach.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {coach.expertise.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {coach.expertise.length > 2 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
                            +{coach.expertise.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{coach.yearsExperience} years</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900">{coach.certifications.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(coach.appliedAt)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(coach.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(coach)}
                          className="px-3 py-1.5 text-sm font-medium text-[#304DB5] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Review
                        </button>
                        {coach.status === 'pending' && (
                          <button
                            onClick={() => handleMarkUnderReview(coach.id)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Mark Reviewing
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending applications</h3>
            <p className="text-slate-600">All coach applications have been reviewed</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCoach && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedCoach.firstName.charAt(0)}{selectedCoach.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedCoach.firstName} {selectedCoach.lastName}
                  </h2>
                  <p className="text-slate-600">{selectedCoach.expertise.join(' • ')}</p>
                  <div className="mt-2">{getStatusBadge(selectedCoach.status)}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCoach(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{selectedCoach.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{selectedCoach.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Applied On</p>
                    <p className="font-medium text-slate-900">{formatDate(selectedCoach.appliedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Award className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Experience</p>
                    <p className="font-medium text-slate-900">{selectedCoach.yearsExperience} years</p>
                  </div>
                </div>
              </div>

              {/* Links */}
              {(selectedCoach.linkedinUrl || selectedCoach.websiteUrl) && (
                <div className="flex gap-4">
                  {selectedCoach.linkedinUrl && (
                    <a
                      href={selectedCoach.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {selectedCoach.websiteUrl && (
                    <a
                      href={selectedCoach.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Personal Website
                    </a>
                  )}
                </div>
              )}

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">About</h3>
                <p className="text-slate-600 leading-relaxed">{selectedCoach.bio}</p>
              </div>

              {/* Expertise */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Certifications & Documents ({selectedCoach.certifications.length})
                </h3>
                <div className="space-y-3">
                  {selectedCoach.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-900">{cert.name}</p>
                              {getCertTypeBadge(cert.type)}
                            </div>
                            <p className="text-sm text-slate-500">Issued by {cert.issuer}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Issued: {formatDate(cert.issueDate)}
                              {cert.expiryDate && ` • Expires: ${formatDate(cert.expiryDate)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Downloading: ${cert.name}`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCoach(null);
                }}
                className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-full transition-colors"
              >
                Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-full hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedCoach.id)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Approve Coach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCoach && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Reject Application</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600">
                Are you sure you want to reject the application from{' '}
                <span className="font-semibold">{selectedCoach.firstName} {selectedCoach.lastName}</span>?
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this application..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedCoach.id)}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCoachesPanel;
