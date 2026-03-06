import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    placeholder: string;
    options: { id: string; name: string; type: 'interest' | 'goal' }[];
    selectedIds: string[];
    onSelect: (id: string, type: 'interest' | 'goal') => void;
}

const AutocompleteModal: React.FC<AutocompleteModalProps> = ({
    isOpen,
    onClose,
    title,
    placeholder,
    options,
    selectedIds,
    onSelect,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter((option) =>
                option.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    }, [searchTerm, options]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (id: string, type: 'interest' | 'goal') => {
        onSelect(id, type);
        setSearchTerm('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* Options List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredOptions.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-500 font-medium">No results found</p>
                            <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Interests Section */}
                            {filteredOptions.filter(opt => opt.type === 'interest').length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">Interests</h4>
                                    <div className="space-y-2">
                                        {filteredOptions.filter(opt => opt.type === 'interest').map((option) => {
                                            const isSelected = selectedIds.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleSelect(option.id, option.type)}
                                                    disabled={isSelected}
                                                    className={`w-full px-4 py-3 rounded-xl text-left transition-all ${isSelected
                                                        ? 'bg-blue-50 border-2 border-blue-200 cursor-not-allowed'
                                                        : 'bg-slate-50 border-2 border-transparent hover:border-[#304DB5] hover:bg-blue-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                                                            {option.name}
                                                        </span>
                                                        {isSelected && (
                                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Goals Section */}
                            {filteredOptions.filter(opt => opt.type === 'goal').length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">Learning Goals</h4>
                                    <div className="space-y-2">
                                        {filteredOptions.filter(opt => opt.type === 'goal').map((option) => {
                                            const isSelected = selectedIds.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleSelect(option.id, option.type)}
                                                    disabled={isSelected}
                                                    className={`w-full px-4 py-3 rounded-xl text-left transition-all ${isSelected
                                                        ? 'bg-green-50 border-2 border-green-200 cursor-not-allowed'
                                                        : 'bg-slate-50 border-2 border-transparent hover:border-green-600 hover:bg-green-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-medium ${isSelected ? 'text-green-700' : 'text-slate-900'}`}>
                                                            {option.name}
                                                        </span>
                                                        {isSelected && (
                                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutocompleteModal;