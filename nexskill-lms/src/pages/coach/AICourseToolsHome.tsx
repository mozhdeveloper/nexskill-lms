import React from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import {
  Sparkles,
  Wand2,
  BookOpen,
  ClipboardList,
  Video,
  Share2,
  FileText,
  Zap,
  Lock,
} from 'lucide-react';

const upcomingFeatures = [
  {
    icon: ClipboardList,
    label: 'Course Outline Generator',
    desc: 'Drop a topic — get a full structured course outline with modules and learning objectives in seconds.',
    color: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: BookOpen,
    label: 'Lesson Creator',
    desc: 'Draft complete lesson scripts, breakdowns, and talking points with guided AI prompts.',
    color: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'group-hover:shadow-blue-500/10',
  },
  {
    icon: ClipboardList,
    label: 'Quiz Generator',
    desc: 'Auto-generate multiple-choice, true/false, and essay questions directly from your lesson content.',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  {
    icon: Video,
    label: 'Video Script Writer',
    desc: 'Create structured, engaging video scripts with hooks, transitions, and CTAs built in.',
    color: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
    border: 'border-rose-500/20',
    glow: 'group-hover:shadow-rose-500/10',
  },
  {
    icon: Share2,
    label: 'Social Caption Builder',
    desc: 'Produce scroll-stopping captions for course promotions across LinkedIn, Instagram, and X.',
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'group-hover:shadow-amber-500/10',
  },
  {
    icon: FileText,
    label: 'Sales Page Copy',
    desc: 'Write persuasive, conversion-optimized landing page copy for any of your courses.',
    color: 'from-cyan-500/20 to-sky-500/20',
    iconColor: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glow: 'group-hover:shadow-cyan-500/10',
  },
];

const AICourseToolsHome: React.FC = () => {
  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto bg-[#0b0f1a] min-h-full">

        {/* Hero Section */}
        <div className="relative overflow-hidden px-8 py-20 text-center">
          {/* Background glow layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[60px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Animated icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 mb-8 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
              <Wand2 className="w-12 h-12 text-violet-400" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Coming Soon
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              AI Course Tools
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Are On Their Way
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
              We're building a full suite of AI-powered tools designed specifically for NexSkill coaches.
              Create better courses in a fraction of the time — without staring at a blank page.
            </p>

            {/* Feature highlights inline */}
            <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500 mb-4">
              {['Outlines', 'Lesson Scripts', 'Quizzes', 'Video Scripts', 'Captions', 'Sales Copy'].map((f) => (
                <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <Zap className="w-3 h-3 text-violet-400" />
                  {f}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-600 mt-2">Available to all NexSkill coaches at launch — no extra cost</p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Feature Cards Section */}
        <div className="px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-3">What's Coming</h2>
              <p className="text-slate-500 text-sm">6 tools. Every step of course creation covered.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingFeatures.map(({ icon: Icon, label, desc, color, iconColor, border, glow }) => (
                <div
                  key={label}
                  className={`group relative bg-[#111827] border ${border} rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${glow} cursor-default`}
                >
                  {/* Lock badge */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Soon</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${color} border ${border} w-fit mb-5`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-white text-base mb-2">{label}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/40 to-purple-900/30 border border-violet-500/20 px-8 py-10 text-center shadow-[0_0_60px_rgba(139,92,246,0.08)]">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[60px]" />
              </div>
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">You'll be the first to know</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                AI tools will appear right here when ready. No action needed — they'll unlock automatically for all verified coaches.
              </p>
            </div>
          </div>
        </div>

      </div>
    </CoachAppLayout>
  );
};

export default AICourseToolsHome;



