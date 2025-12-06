import { useState } from 'react';
import { Search, BookOpen, Eye } from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  category: string;
  views: number;
  helpful: number;
  lastUpdated: string;
  excerpt: string;
}

interface KnowledgeBaseListProps {
  onViewArticle?: (articleId: string) => void;
  onBookmark?: (articleId: string) => void;
}

const KnowledgeBaseList = ({ onViewArticle, onBookmark }: KnowledgeBaseListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const articles: KBArticle[] = [
    { id: 'KB-001', title: 'How to reset student password', category: 'Account', views: 1245, helpful: 342, lastUpdated: 'Nov 20, 2024', excerpt: 'Step-by-step guide to resetting passwords for students...' },
    { id: 'KB-002', title: 'Troubleshooting video playback issues', category: 'Technical', views: 987, helpful: 289, lastUpdated: 'Nov 18, 2024', excerpt: 'Common solutions for video player problems and errors...' },
    { id: 'KB-003', title: 'Processing refund requests', category: 'Billing', views: 654, helpful: 201, lastUpdated: 'Nov 15, 2024', excerpt: 'Guidelines and procedures for handling refund requests...' },
    { id: 'KB-004', title: 'Certificate generation process', category: 'Certificates', views: 1456, helpful: 421, lastUpdated: 'Nov 22, 2024', excerpt: 'Understanding how certificates are generated and issued...' },
    { id: 'KB-005', title: 'Handling quiz submission errors', category: 'Technical', views: 789, helpful: 234, lastUpdated: 'Nov 10, 2024', excerpt: 'Common quiz-related issues and their solutions...' },
    { id: 'KB-006', title: 'Course enrollment troubleshooting', category: 'Course Access', views: 1123, helpful: 378, lastUpdated: 'Nov 25, 2024', excerpt: 'Resolving issues with course access and enrollment...' },
  ];

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge base articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-gray-50 rounded-2xl p-5 hover:bg-blue-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-xs font-semibold text-gray-600">{article.id}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {article.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{article.excerpt}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.views} views</span>
                    </div>
                    <div>
                      <span>{article.helpful} found helpful</span>
                    </div>
                    <div>
                      <span>Updated: {article.lastUpdated}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  {onBookmark && (
                    <button
                      onClick={() => onBookmark(article.id)}
                      className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                    >
                      🔖 Bookmark
                    </button>
                  )}
                  <button
                    onClick={() => onViewArticle ? onViewArticle(article.id) : setSelectedArticle(article)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    View Article
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
                  {selectedArticle.category}
                </span>
                <h3 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{selectedArticle.views} views</span>
              </div>
              <div>
                <span>{selectedArticle.helpful} found helpful</span>
              </div>
              <div>
                <span>Updated: {selectedArticle.lastUpdated}</span>
              </div>
            </div>
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed">{selectedArticle.excerpt}</p>
              <p className="text-gray-700 leading-relaxed mt-4">
                This is a placeholder for the full article content. In a production environment, this would contain
                detailed step-by-step instructions, screenshots, videos, and troubleshooting tips to help support staff
                resolve customer issues effectively.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KnowledgeBaseList;
