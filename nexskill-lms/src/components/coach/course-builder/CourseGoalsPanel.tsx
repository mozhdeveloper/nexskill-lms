import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Target } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface CourseGoal {
    id: string;
    description: string;
    position: number;
}

interface CourseGoalsPanelProps {
    courseId: string;
}

const CourseGoalsPanel: React.FC<CourseGoalsPanelProps> = ({ courseId }) => {
    const [goals, setGoals] = useState<CourseGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newGoal, setNewGoal] = useState('');

    useEffect(() => {
        fetchGoals();
    }, [courseId]);

    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from('course_goals')
                .select('*')
                .eq('course_id', courseId)
                .order('position', { ascending: true });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching course goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoal.trim()) return;

        try {
            setSaving(true);
            const { data, error } = await supabase
                .from('course_goals')
                .insert([
                    {
                        course_id: courseId,
                        description: newGoal,
                        position: goals.length,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            setGoals([...goals, data]);
            setNewGoal('');
        } catch (error) {
            console.error('Error adding goal:', error);
            alert('Failed to add goal');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            const { error } = await supabase.from('course_goals').delete().eq('id', id);
            if (error) throw error;
            setGoals(goals.filter((g) => g.id !== id));
        } catch (error) {
            alert('Failed to delete goal');
        }
    };

    const handleUpdateGoal = async (id: string, description: string) => {
        try {
            const { error } = await supabase
                .from('course_goals')
                .update({ description })
                .eq('id', id);

            if (error) throw error;

            setGoals(goals.map(g => g.id === id ? { ...g, description } : g));
        } catch (error) {
            console.error("Error updating goal: ", error);
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Goals</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Define the key learning outcomes for your students. What will they achieve by the end of this course?
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <p className="text-center py-4 text-gray-500">Loading goals...</p>
                ) : (
                    <div className="space-y-3">
                        {goals.map((goal, index) => (
                            <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-gray-600 group">
                                <div className="text-gray-400 cursor-grab">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={goal.description}
                                        onChange={(e) => {
                                            const newDesc = e.target.value;
                                            setGoals(goals.map(g => g.id === goal.id ? { ...g, description: newDesc } : g));
                                        }}
                                        onBlur={(e) => handleUpdateGoal(goal.id, e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white font-medium"
                                    />
                                </div>
                                <button
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3 mt-4">
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                        placeholder="Add a new learning goal..."
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <button
                        onClick={handleAddGoal}
                        disabled={!newGoal.trim() || saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseGoalsPanel;
