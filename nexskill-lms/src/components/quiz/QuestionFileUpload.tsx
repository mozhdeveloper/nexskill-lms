import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface QuestionFileUploadProps {
  question: {
    id: string;
    questionText: string;
    questionContent?: ContentBlock[];
    answerConfig?: {
      accepted_file_types?: string[];
      max_file_size_mb?: number;
      max_files?: number;
      instructions?: string;
    };
  };
  onFilesChange: (questionId: string, files: File[]) => void;
  existingFiles?: File[];
}

const QuestionFileUpload: React.FC<QuestionFileUploadProps> = ({
  question,
  onFilesChange,
  existingFiles = [],
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(existingFiles);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFiles = question.answerConfig?.max_files || 1;
  const maxSizeMB = question.answerConfig?.max_file_size_mb || 10;
  const acceptedTypes = question.answerConfig?.accepted_file_types || ['pdf', 'docx', 'txt'];

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`;
    }

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedTypes.includes(fileExt)) {
      return `File type "${fileExt}" is not accepted. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    setUploadError('');
    const filesArray = Array.from(files);

    // Check max files limit
    if (uploadedFiles.length + filesArray.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} file(s) allowed. You can upload ${maxFiles - uploadedFiles.length} more file(s).`);
      return;
    }

    // Validate all files
    const errors: string[] = [];
    filesArray.forEach(file => {
      const error = validateFile(file);
      if (error) errors.push(error);
    });

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
      return;
    }

    const newFiles = [...uploadedFiles, ...filesArray];
    setUploadedFiles(newFiles);
    onFilesChange(question.id, newFiles);
  }, [uploadedFiles, maxFiles, question.id, onFilesChange, maxSizeMB, acceptedTypes]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again if removed
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesChange(question.id, newFiles);
    setUploadError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconColors: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      docx: 'text-blue-500',
      txt: 'text-gray-500',
      jpg: 'text-green-500',
      jpeg: 'text-green-500',
      png: 'text-green-500',
      zip: 'text-yellow-600',
      xlsx: 'text-green-600',
      pptx: 'text-orange-500',
    };
    return iconColors[ext] || 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
        />
        {question.answerConfig?.instructions && (
          <p className="text-sm text-slate-600 mt-2">{question.answerConfig.instructions}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
          <span>📁 Accepted: {acceptedTypes.map(t => t.toUpperCase()).join(', ')}</span>
          <span>📏 Max size: {maxSizeMB}MB</span>
          <span>📄 Max files: {maxFiles}</span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${uploadedFiles.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept={acceptedTypes.map(t => `.${t}`).join(',')}
          multiple={maxFiles > 1}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-700 font-medium mb-1">
          {uploadedFiles.length >= maxFiles ? 'Maximum files reached' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-slate-500">
          {uploadedFiles.length >= maxFiles 
            ? `You've uploaded the maximum of ${maxFiles} file(s)`
            : `${maxFiles - uploadedFiles.length} file(s) remaining`
          }
        </p>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 whitespace-pre-line">{uploadError}</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className={`w-5 h-5 flex-shrink-0 ${getFileIcon(file.name)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionFileUpload;
