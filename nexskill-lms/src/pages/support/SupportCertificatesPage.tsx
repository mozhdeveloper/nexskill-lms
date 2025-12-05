import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import CertificatesList from '../../components/support/CertificatesList';

const SupportCertificatesPage = () => {
  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Management</h1>
          <p className="text-gray-600">Resend certificates and resolve certificate-related issues</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Resend Certificates</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• Verify the student has completed the course</li>
            <li>• Confirm the email address is correct</li>
            <li>• Click"Resend" to trigger an automated email with download link</li>
            <li>• Monitor the status to ensure successful delivery</li>
          </ul>
        </div>

        {/* Certificates List */}
        <CertificatesList />
      </div>
    </SupportStaffAppLayout>
  );
};

export default SupportCertificatesPage;
