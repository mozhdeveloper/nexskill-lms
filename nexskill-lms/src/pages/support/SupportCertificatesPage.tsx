import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import CertificatesList from '../../components/support/CertificatesList';

const SupportCertificatesPage = () => {
  const [showResendModal, setShowResendModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleResendCertificate = (certId: string, defaultEmail: string) => {
    setSelectedCertId(certId);
    setRecipientEmail(defaultEmail);
    setShowResendModal(true);
  };

  const confirmResend = () => {
    console.log('Resending certificate:', selectedCertId, 'to:', recipientEmail);
    alert(`Certificate resent to ${recipientEmail}`);
    setShowResendModal(false);
    setRecipientEmail('');
  };

  const handleRegenerateCertificate = (certId: string) => {
    setSelectedCertId(certId);
    setShowRegenerateModal(true);
  };

  const confirmRegenerate = () => {
    console.log('Regenerating certificate:', selectedCertId);
    alert('Certificate regenerated successfully!');
    setShowRegenerateModal(false);
  };

  const handleBulkResend = () => {
    console.log('Bulk resend certificates...');
    alert('Bulk resend initiated!');
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Management</h1>
              <p className="text-gray-600">Resend certificates and resolve certificate-related issues</p>
            </div>
            <button
              onClick={handleBulkResend}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
            >
              📧 Bulk Resend
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">1,248</div>
            <div className="text-sm text-gray-600 mt-1">Total Certificates</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">1,195</div>
            <div className="text-sm text-gray-600 mt-1">Delivered</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">42</div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600">11</div>
            <div className="text-sm text-gray-600 mt-1">Failed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Certificates</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Certificates List */}
        <CertificatesList 
          onResend={handleResendCertificate}
          onRegenerate={handleRegenerateCertificate}
        />
      </div>

      {/* Resend Modal */}
      {showResendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Resend Certificate</h2>
              <button
                onClick={() => setShowResendModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  📧 The certificate will be sent to the email address below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResendModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResend}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Send Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Regenerate Certificate</h2>
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will generate a new certificate with an updated issue date. The previous certificate will remain valid.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRegenerate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportStaffAppLayout>
  );
};

export default SupportCertificatesPage;
