import { useState } from 'react';
import { Award, Send, CheckCircle } from 'lucide-react';

interface CertificateRequest {
  id: string;
  studentName: string;
  courseName: string;
  completedDate: string;
  issueReason: string;
  requestDate: string;
  status: 'pending' | 'resent' | 'failed';
}

interface CertificatesListProps {
  onResend?: (certId: string, email: string) => void;
  onRegenerate?: (certId: string) => void;
}

const CertificatesList = ({ onResend, onRegenerate }: CertificatesListProps) => {
  const [requests, setRequests] = useState<CertificateRequest[]>([
    { id: 'CERT-501', studentName: 'Sarah Chen', courseName: 'Advanced React Development', completedDate: 'Oct 15, 2024', issueReason: 'Email not received', requestDate: '2 hours ago', status: 'pending' },
    { id: 'CERT-502', studentName: 'Michael Brown', courseName: 'Python for Data Science', completedDate: 'Nov 2, 2024', issueReason: 'Wrong email address', requestDate: '5 hours ago', status: 'resent' },
    { id: 'CERT-503', studentName: 'Emma Wilson', courseName: 'Digital Marketing Mastery', completedDate: 'Nov 20, 2024', issueReason: 'Certificate not generated', requestDate: '1 day ago', status: 'pending' },
    { id: 'CERT-504', studentName: 'James Lee', courseName: 'UI/UX Design Fundamentals', completedDate: 'Sep 30, 2024', issueReason: 'Lost certificate', requestDate: '3 days ago', status: 'resent' },
  ]);

  const handleResend = (id: string, email: string) => {
    if (onResend) {
      onResend(id, email);
    }
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'resent' as const } : req
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'resent': return 'bg-green-100 text-green-700 border-green-300';
      case 'failed': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Certificate Requests</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Award className="w-5 h-5" />
          <span>{requests.filter(r => r.status === 'pending').length} Pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="bg-gray-50 rounded-2xl p-5 hover:bg-blue-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-semibold text-gray-700">{request.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{request.studentName}</h4>
                <p className="text-sm text-gray-700 mb-2">{request.courseName}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Completed:</span>
                    <span className="ml-2 font-medium text-gray-900">{request.completedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested:</span>
                    <span className="ml-2 font-medium text-gray-900">{request.requestDate}</span>
                  </div>
                </div>
                <div className="mt-2 p-3 bg-white rounded-xl">
                  <span className="text-xs text-gray-600 font-semibold">Issue Reason:</span>
                  <p className="text-sm text-gray-900 mt-1">{request.issueReason}</p>
                </div>
              </div>
              <div className="ml-4">
                {request.status === 'pending' ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleResend(request.id, 'student@example.com')}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      Resend
                    </button>
                    {onRegenerate && (
                      <button
                        onClick={() => onRegenerate(request.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Resent
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Resending certificates triggers an automated email to the student with a download link. Ensure the email address is correct before resending.
        </p>
      </div>
    </div>
  );
};

export default CertificatesList;
