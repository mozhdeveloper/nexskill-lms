import React, { useState } from 'react';

interface SocialFormData {
  selectedPlatforms: string[];
  courseToPromote: string;
  angle: string;
  ctaPreference: string;
}

interface PlatformCaption {
  platform: string;
  caption: string;
  hashtags: string;
}

const AISocialCaptionTool: React.FC = () => {
  const [formData, setFormData] = useState<SocialFormData>({
    selectedPlatforms: ['LinkedIn'],
    courseToPromote: '',
    angle: 'announce-course',
    ctaPreference: '',
  });
  const [generatedCaptions, setGeneratedCaptions] = useState<PlatformCaption[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const platforms = [
    { id: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
    { id: 'Facebook', label: 'Facebook', icon: '👥' },
    { id: 'Instagram', label: 'Instagram', icon: '📷' },
    { id: 'X', label: 'X', icon: '𝕏' },
  ];

  const angles = [
    { value: 'announce-course', label: 'Announce new course' },
    { value: 'promote-discount', label: 'Promote discount' },
    { value: 'student-success', label: 'Share student success' },
    { value: 'quick-tip', label: 'Share a quick tip' },
  ];

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  };

  const generateCaptions = () => {
    if (!formData.courseToPromote.trim()) {
      alert('Please specify what to promote');
      return;
    }

    if (formData.selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const captions: PlatformCaption[] = [];
      const cta = formData.ctaPreference || 'Learn more';

      formData.selectedPlatforms.forEach((platform) => {
        let caption = '';
        let hashtags = '';

        // Generate caption based on platform and angle
        if (formData.angle === 'announce-course') {
          if (platform === 'LinkedIn') {
            caption = `🚀 Excited to announce:"${formData.courseToPromote}" is now live!\n\nAfter months of development, I'm thrilled to share this comprehensive course designed to help you master essential skills. Whether you're just starting out or looking to level up, this course has something for everyone.\n\n✨ What you'll gain:\n• In-depth lessons and practical projects\n• Lifetime access to all materials\n• Certificate upon completion\n\n${cta} - Link in comments 👇`;
            hashtags = '#OnlineLearning #ProfessionalDevelopment #SkillBuilding #Education';
          } else if (platform === 'Facebook') {
            caption = `🎉 Big news! My new course"${formData.courseToPromote}" just launched!\n\nI've poured my heart into creating something truly valuable for anyone looking to grow their skills. Check it out and let me know what you think!\n\n${cta} ➡️ [Link]`;
            hashtags = '#NewCourse #Learning #OnlineEducation #Skills';
          } else if (platform === 'Instagram') {
            caption = `✨ NEW COURSE ALERT ✨\n\n"${formData.courseToPromote}" is officially here! 🎓\n\nSwipe to see what's inside 👉\n\n${cta} - Link in bio! 🔗`;
            hashtags = '#OnlineCourse #LearnOnline #Education #NewCourse #SkillDevelopment #Learning';
          } else if (platform === 'X') {
            caption = `🚀 Just launched:"${formData.courseToPromote}"\n\nEverything you need to master this skill, all in one place.\n\n${cta} 👇`;
            hashtags = '#Education #OnlineLearning #NewCourse';
          }
        } else if (formData.angle === 'promote-discount') {
          if (platform === 'LinkedIn') {
            caption = `⏰ Limited Time Offer!\n\nGet 30% off"${formData.courseToPromote}" this week only. This is your chance to invest in yourself at a fraction of the cost.\n\nDon't miss out - offer ends soon!\n\n${cta} 👇`;
            hashtags = '#LimitedOffer #OnlineLearning #ProfessionalDevelopment #CareerGrowth';
          } else if (platform === 'Facebook') {
            caption = `🎁 SPECIAL OFFER 🎁\n\n30% OFF"${formData.courseToPromote}" - but only for the next few days!\n\nThis is the perfect time to start your learning journey. ${cta}!`;
            hashtags = '#Sale #Discount #OnlineCourse #LimitedTime';
          } else if (platform === 'Instagram') {
            caption = `⚡ FLASH SALE ⚡\n\n30% off"${formData.courseToPromote}"\n\nDon't wait - this deal won't last! 🔥\n\n${cta} - Link in bio 🔗`;
            hashtags = '#Sale #FlashSale #OnlineCourse #LimitedOffer #LearnOnline #Discount';
          } else if (platform === 'X') {
            caption = `⚡ 30% OFF"${formData.courseToPromote}" this week only!\n\nYour future self will thank you. ${cta} 👇`;
            hashtags = '#Sale #OnlineLearning #LimitedOffer';
          }
        } else if (formData.angle === 'student-success') {
          caption = `💫 Student Success Story!\n\nOne of my students just completed"${formData.courseToPromote}" and achieved amazing results. Here's what they had to say:\n\n"This course completely transformed my approach. Within weeks, I was applying what I learned to real projects."\n\nReady to write your own success story? ${cta}!`;
          hashtags =
            platform === 'Instagram'
              ? '#Success #StudentSuccess #Testimonial #OnlineLearning #Education #Transformation'
              : '#StudentSuccess #Testimonial #OnlineLearning #Education';
        } else if (formData.angle === 'quick-tip') {
          caption = `💡 Quick Tip from"${formData.courseToPromote}":\n\nHere's something that often gets overlooked but makes a huge difference... [Share specific actionable tip]\n\nWant more tips like this? ${cta} to access the full course with dozens of practical lessons!`;
          hashtags =
            platform === 'Instagram'
              ? '#Tips #Tutorial #Learning #OnlineEducation #SkillBuilding #QuickTip'
              : '#Tips #Tutorial #Learning #OnlineEducation';
        }

        captions.push({ platform, caption, hashtags });
      });

      setGeneratedCaptions(captions);
      setIsGenerating(false);
    }, 1000);
  };

  const copyCaption = (caption: string, hashtags: string) => {
    navigator.clipboard.writeText(`${caption}\n\n${hashtags}`);
    alert('Caption copied to clipboard!');
  };

  const copyAll = () => {
    if (!generatedCaptions) return;

    let text = '';
    generatedCaptions.forEach((item) => {
      text += `${item.platform}\n${'='.repeat(item.platform.length)}\n${item.caption}\n\n${item.hashtags}\n\n---\n\n`;
    });

    navigator.clipboard.writeText(text);
    alert('All captions copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">
            Generate Social Media Captions
          </h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Create engaging social media content to promote your courses across multiple platforms.
          </p>
        </div>

        {/* Platform Selector */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Select Platform(s)
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  formData.selectedPlatforms.includes(platform.id)
                    ? 'bg-[#304DB5] text-white shadow-md'
                    : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#E0E5FF]'
                }`}
              >
                <span>{platform.icon}</span>
                <span>{platform.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Course/Lesson to Promote */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Course or Lesson to Promote
          </label>
          <input
            type="text"
            value={formData.courseToPromote}
            onChange={(e) => setFormData({ ...formData, courseToPromote: e.target.value })}
            placeholder="e.g., Complete Web Development Bootcamp"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Angle/Goal Selector */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Angle / Goal</label>
          <select
            value={formData.angle}
            onChange={(e) => setFormData({ ...formData, angle: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          >
            {angles.map((angle) => (
              <option key={angle.value} value={angle.value}>
                {angle.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional CTA Preference */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Optional CTA Preference
          </label>
          <input
            type="text"
            value={formData.ctaPreference}
            onChange={(e) => setFormData({ ...formData, ctaPreference: e.target.value })}
            placeholder="e.g., Enroll today, Book now, Learn more"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateCaptions}
          disabled={isGenerating || !formData.courseToPromote.trim()}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Captions'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Generated Captions</h4>

        {!generatedCaptions ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-[#9CA3B5]">
              Select platforms and click"Generate Captions" to create your social media content.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {generatedCaptions.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-[#E0E5FF] text-[#304DB5] text-xs font-bold rounded-full">
                      {item.platform.toUpperCase()}
                    </span>
                    <button
                      onClick={() => copyCaption(item.caption, item.hashtags)}
                      className="text-xs text-[#5F6473] hover:text-[#304DB5] font-medium"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Caption */}
                  <p className="text-sm text-[#5F6473] leading-relaxed mb-3 whitespace-pre-line">
                    {item.caption}
                  </p>

                  {/* Hashtags */}
                  <div className="pt-3 border-t border-[#EDF0FB]">
                    <p className="text-xs text-[#9CA3B5] font-medium">{item.hashtags}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={copyAll}
              className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Copy All Captions
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AISocialCaptionTool;
