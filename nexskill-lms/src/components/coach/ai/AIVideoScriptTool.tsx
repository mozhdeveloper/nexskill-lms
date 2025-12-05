import React, { useState } from 'react';

interface VideoScriptFormData {
  topic: string;
  duration: string;
  tone: string;
  audience: string;
}

interface ScriptSection {
  title: string;
  content: string;
}

const AIVideoScriptTool: React.FC = () => {
  const [formData, setFormData] = useState<VideoScriptFormData>({
    topic: '',
    duration: '10-min',
    tone: 'friendly',
    audience: '',
  });
  const [generatedScript, setGeneratedScript] = useState<ScriptSection[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScript = () => {
    if (!formData.topic.trim()) {
      alert('Please provide a video topic');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const sections: ScriptSection[] = [];

      // Hook/Intro
      const toneIntros: Record<string, string> = {
        friendly:"Hey there! Welcome back to the channel. Today, we're diving into something really exciting",
        professional:"Good day. In today's lesson, we'll be examining the critical aspects of",
        inspirational:"Imagine being able to master this skill completely. That's exactly what we're going to achieve today as we explore",
        casual:"What's up everyone! So today I want to talk about something super cool",
      };

      sections.push({
        title: 'Hook / Introduction',
        content: `${toneIntros[formData.tone] || toneIntros.friendly} - ${formData.topic}. ${
          formData.audience
            ? `This is especially valuable for ${formData.audience}. `
            : ''
        }By the end of this video, you'll have a solid understanding of the key concepts and be ready to apply them in real-world scenarios. So let's jump right in!`,
      });

      // Main teaching segments based on duration
      const segmentCount = formData.duration === '5-min' ? 2 : formData.duration === '15-min' ? 4 : 3;

      for (let i = 1; i <= segmentCount; i++) {
        sections.push({
          title: `Segment ${i}: Core Concept ${i}`,
          content: `Now, let's talk about the ${i === 1 ? 'first' : i === 2 ? 'second' : i === 3 ? 'third' : 'fourth'} key element of ${formData.topic}. This is crucial because it forms the foundation of everything else we'll cover. Here's what you need to know: [Explain the concept with examples]. Remember, the key here is to understand not just the"what" but also the "why" behind it. Let me show you a practical example... [Demonstrate with specifics]. This is something you can start applying immediately in your own projects.`,
        });
      }

      // Recap & CTA
      sections.push({
        title: 'Recap & Call-to-Action',
        content: `Alright, let's quickly recap what we've covered today about ${formData.topic}. We explored the core concepts, looked at practical applications, and discussed how you can implement these techniques right away. ${
          formData.tone === 'inspirational'
            ?"Remember, every expert was once a beginner. You've got this!"
            : formData.tone === 'professional'
            ? 'These principles will serve as a strong foundation for your continued learning.'
            :"I hope you found this helpful!"
        } If you enjoyed this video, don't forget to like and subscribe for more content. Drop a comment below letting me know what topic you'd like me to cover next. Thanks for watching, and I'll see you in the next one!`,
      });

      setGeneratedScript(sections);
      setIsGenerating(false);
    }, 1200);
  };

  const copyScript = () => {
    if (!generatedScript) return;

    let text = `Video Script: ${formData.topic}\n\n`;
    generatedScript.forEach((section) => {
      text += `${section.title}\n${'-'.repeat(section.title.length)}\n${section.content}\n\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Script copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">Generate Video Script</h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Create a structured script for your lesson videos with AI assistance.
          </p>
        </div>

        {/* Video Topic */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Video Topic</label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g., Introduction to CSS Grid Layout"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Desired Duration */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Desired Duration
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          >
            <option value="5-min">5 minutes</option>
            <option value="10-min">10 minutes</option>
            <option value="15-min">15+ minutes</option>
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Tone</label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="inspirational">Inspirational</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        {/* Optional Audience */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Optional Audience Descriptor
          </label>
          <input
            type="text"
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            placeholder="e.g., beginners, career switchers, intermediate developers"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateScript}
          disabled={isGenerating || !formData.topic.trim()}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Script'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Video Script Draft</h4>

        {!generatedScript ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-[#9CA3B5]">
              Fill in the details and click"Generate Script" to create your video script.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5 mb-6 max-h-96 overflow-y-auto">
              {generatedScript.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
                  <h5 className="font-bold text-[#304DB5] mb-3 flex items-center gap-2">
                    {idx === 0 && '🎯'}
                    {idx > 0 && idx < generatedScript.length - 1 && '📚'}
                    {idx === generatedScript.length - 1 && '🎬'}
                    <span>{section.title}</span>
                  </h5>
                  <p className="text-sm text-[#5F6473] leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={copyScript}
              className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Copy Script
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AIVideoScriptTool;
