import React from 'react';

interface Resource {
  name: string;
  type: string;
  size: string;
}

interface ResourceUploadPanelProps {
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
}

const ResourceUploadPanel: React.FC<ResourceUploadPanelProps> = ({ resources, onChange }) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newResources = files.map((file) => ({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    }));
    onChange([...resources, ...newResources]);
  };

  const handleRemoveResource = (index: number) => {
    onChange(resources.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">Resources</h3>

      {/* Resource List */}
      {resources.length > 0 && (
        <div className="space-y-2 mb-4">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200"
            >
              <span className="text-2xl">{getFileIcon(resource.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-dark-text-primary truncate">{resource.name}</p>
                <p className="text-xs text-slate-600">{resource.size}</p>
              </div>
              <button
                onClick={() => handleRemoveResource(index)}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Button */}
      <div className="relative">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button
          type="button"
          className="w-full py-4 px-6 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium text-slate-700">Add resource</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1">PDF, DOCX, ZIP, or other files</p>
        </button>
      </div>
    </div>
  );
};

export default ResourceUploadPanel;
