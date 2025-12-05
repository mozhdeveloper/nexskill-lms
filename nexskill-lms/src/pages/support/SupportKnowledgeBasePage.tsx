import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import KnowledgeBaseList from '../../components/support/KnowledgeBaseList';

const SupportKnowledgeBasePage = () => {
  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
          <p className="text-gray-600">Search and browse support articles and troubleshooting guides</p>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-700">
            <div>• Use specific keywords for better results</div>
            <div>• Filter by category to narrow down articles</div>
            <div>• Check"Most Helpful" articles first</div>
            <div>• Bookmark frequently used articles</div>
          </div>
        </div>

        {/* Knowledge Base List */}
        <KnowledgeBaseList />
      </div>
    </SupportStaffAppLayout>
  );
};

export default SupportKnowledgeBasePage;
