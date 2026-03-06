import React from 'react';

interface Profile {
  name: string;
  headline: string;
  level: string | null;
  memberSince: string;
  streakDays: number;
  avatarUrl?: string;
}

interface ProfileHeaderCardProps {
  profile: Profile;
  onEditProfile?: () => void;
}

const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile, onEditProfile }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
      <div className="flex items-start justify-between">
        {/* Left: Avatar and Info */}
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{profile.name}</h1>
            <p className="text-lg text-slate-600 mb-4">{profile.headline}</p>
            <div className="flex items-center gap-3">
              {profile.level && (
                <span className="px-4 py-1.5 bg-blue-100 text-[#304DB5] text-sm font-semibold rounded-full">
                  {profile.level}
                </span>
              )}
              <span className="text-sm text-slate-600">Member since {profile.memberSince}</span>
            </div>
          </div>
        </div>

        {/* Right: Badges and Actions */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-xl">
            <span className="text-2xl">🔥</span>
            <div className="text-right">
              <div className="text-xl font-bold text-orange-600">{profile.streakDays}</div>
              <div className="text-xs text-orange-700">day streak</div>
            </div>
          </div>
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="px-6 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
