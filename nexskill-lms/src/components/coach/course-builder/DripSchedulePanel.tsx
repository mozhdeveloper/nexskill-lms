import React from 'react';

type DripMode = 'immediate' | 'days-after-enrollment' | 'specific-date' | 'after-previous';

interface ModuleDrip {
    moduleId: string;
    moduleTitle: string;
    mode: DripMode;
    daysAfter?: number;
    specificDate?: string;
}

interface DripSchedulePanelProps {
    modules: ModuleDrip[];
    onChange: (modules: ModuleDrip[]) => void;
    onSave?: () => void;
}

const DripSchedulePanel: React.FC<DripSchedulePanelProps> = ({ modules, onChange, onSave }) => {
    const updateModule = (moduleId: string, updates: Partial<ModuleDrip>) => {
        onChange(
            modules.map((m) => (m.moduleId === moduleId ? { ...m, ...updates } : m))
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Drip schedule</h2>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-6">
                Control when students can access course content. Release modules gradually over time.
            </p>

            {/* Global mode info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-dark-text-primary mb-1">Drip content modes</p>
                        <ul className="text-sm text-slate-600 dark:text-dark-text-secondary space-y-1">
                            <li>• <strong>Immediate:</strong> Available as soon as student enrolls</li>
                            <li>• <strong>Days after enrollment:</strong> Unlocked X days after joining</li>
                            <li>• <strong>Specific date:</strong> Unlocked on a calendar date</li>
                        </ul>
                    </div>
                </div>
            </div>

            {modules.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">No modules yet</p>
                    <p className="text-slate-600">Create modules in the Curriculum section first</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div
                            key={module.moduleId}
                            className="bg-white dark:bg-dark-background-card rounded-2xl border-2 border-slate-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center font-bold text-slate-700">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-dark-text-primary mb-4">{module.moduleTitle}</h3>

                                    <div className="space-y-3">
                                        {/* Mode selector */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                                                Release mode
                                            </label>
                                            <select
                                                value={module.mode}
                                                onChange={(e) =>
                                                    updateModule(module.moduleId, { mode: e.target.value as DripMode })
                                                }
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="immediate">Immediate (no restriction)</option>
                                                <option value="days-after-enrollment">Days after enrollment</option>
                                                <option value="specific-date">Specific date</option>
                                                <option value="after-previous">After previous module</option>
                                            </select>
                                        </div>

                                        {/* Conditional inputs */}
                                        {module.mode === 'days-after-enrollment' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                                                    Unlock after (days)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={module.daysAfter || 0}
                                                    onChange={(e) =>
                                                        updateModule(module.moduleId, { daysAfter: parseInt(e.target.value) || 0 })
                                                    }
                                                    min="0"
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        )}

                                        {module.mode === 'specific-date' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                                                    Unlock on date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={module.specificDate || ''}
                                                    onChange={(e) =>
                                                        updateModule(module.moduleId, { specificDate: e.target.value })
                                                    }
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6">
                <button
                    onClick={onSave ?? undefined}
                    disabled={!onSave}
                    className="w-full py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save drip schedule
                </button>
            </div>
        </div>
    );
};

export default DripSchedulePanel;
