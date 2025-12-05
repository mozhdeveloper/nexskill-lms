import React, { useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  year: number;
}

interface CoachAchievementsPanelProps {
  achievements: Achievement[];
  onChange: (updatedAchievements: Achievement[]) => void;
}

const CoachAchievementsPanel: React.FC<CoachAchievementsPanelProps> = ({
  achievements,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Achievement, 'id'>>({
    title: '',
    description: '',
    year: new Date().getFullYear(),
  });

  const handleSave = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (editingId) {
      const updated = achievements.map((a) =>
        a.id === editingId ? { ...formData, id: editingId } : a
      );
      onChange(updated);
      console.log('Updated achievement:', editingId);
    } else {
      const newAchievement: Achievement = {
        id: `ach-${Date.now()}`,
        ...formData,
      };
      onChange([...achievements, newAchievement]);
      console.log('Added achievement:', newAchievement);
    }

    setFormData({ title: '', description: '', year: new Date().getFullYear() });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (achievement: Achievement) => {
    setFormData({
      title: achievement.title,
      description: achievement.description,
      year: achievement.year,
    });
    setEditingId(achievement.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this achievement?')) {
      onChange(achievements.filter((a) => a.id !== id));
      console.log('Deleted achievement:', id);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', year: new Date().getFullYear() });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-[#304DB5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-[#111827]">Achievements & Awards</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-[#304DB5] text-white font-semibold rounded-full hover:bg-[#5E7BFF] transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-[#F5F7FF] rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., ICF Certified Professional Coach"
              className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#304DB5] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the achievement"
              className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#304DB5] focus:border-transparent outline-none resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min={1950}
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#304DB5] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#304DB5] text-white font-semibold rounded-full hover:bg-[#5E7BFF] transition-colors"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-[#E5E7EB] text-[#5F6473] font-semibold rounded-full hover:bg-[#D1D5DB] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Achievements List */}
      <div className="space-y-4">
        {achievements.length === 0 && (
          <p className="text-sm text-[#9CA3B5] italic text-center py-6">
            No achievements added yet. Click"+ Add" to showcase your accomplishments.
          </p>
        )}
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="p-4 bg-gradient-to-r from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB] hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-[#111827]">{achievement.title}</h3>
                  <span className="px-2 py-1 bg-[#304DB5] text-white text-xs rounded-full">
                    {achievement.year}
                  </span>
                </div>
                <p className="text-sm text-[#5F6473]">{achievement.description}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(achievement)}
                  className="p-1 text-[#304DB5] hover:bg-[#F5F7FF] rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(achievement.id)}
                  className="p-1 text-[#EF4444] hover:bg-[#FEE2E2] rounded transition-colors"
                  title="Delete"
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachAchievementsPanel;
