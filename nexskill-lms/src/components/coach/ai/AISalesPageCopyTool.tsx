import React, { useState } from 'react';

interface SalesFormData {
  courseTitle: string;
  audiencePersona: string;
  keyOutcomes: string;
  price: string;
  bonusGuarantee: string;
  tone: string;
}

interface SalesCopySection {
  section: string;
  content: string | string[];
}

const AISalesPageCopyTool: React.FC = () => {
  const [formData, setFormData] = useState<SalesFormData>({
    courseTitle: '',
    audiencePersona: '',
    keyOutcomes: '',
    price: '',
    bonusGuarantee: '',
    tone: 'high-conversion',
  });
  const [generatedCopy, setGeneratedCopy] = useState<SalesCopySection[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSalesCopy = () => {
    if (!formData.courseTitle.trim()) {
      alert('Please provide a course title');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const sections: SalesCopySection[] = [];
      const courseName = formData.courseTitle;
      const audience = formData.audiencePersona || 'aspiring professionals';
      const priceText = formData.price || '$299';

      // Hero Section
      if (formData.tone === 'story-driven') {
        sections.push({
          section: 'Hero',
          content: [
            `Headline: From Struggling ${audience} to Confident Expert: Your Journey Starts Here`,
            `Subheadline: Discover how ${courseName} can transform your skills and unlock new opportunities in just weeks`,
            `CTA: Start Your Transformation Today →`,
          ],
        });
      } else if (formData.tone === 'educational') {
        sections.push({
          section: 'Hero',
          content: [
            `Headline: Master the Skills That Matter with ${courseName}`,
            `Subheadline: A comprehensive, research-backed approach to ${courseName.toLowerCase()} for ${audience}`,
            `CTA: Begin Your Learning Journey →`,
          ],
        });
      } else {
        sections.push({
          section: 'Hero',
          content: [
            `Headline: Transform Your Career with ${courseName} - Proven Results in 30 Days or Less`,
            `Subheadline: Join thousands of ${audience} who've already mastered these essential skills`,
            `CTA: Get Instant Access Now →`,
          ],
        });
      }

      // Problem Section
      sections.push({
        section: 'Problem / Pain Points',
        content: `Are you tired of feeling stuck in your career? Do you watch others succeed while you struggle to keep up? The truth is, the gap between where you are and where you want to be isn't your fault. You've been trying to learn through scattered resources, incomplete tutorials, and outdated information. What you need is a clear, proven path forward - and that's exactly what ${courseName} provides. No more confusion. No more wasted time. Just results.`,
      });

      // Solution Section
      sections.push({
        section: 'Solution / Course Introduction',
        content: `${courseName} is the comprehensive training program designed specifically for ${audience}. This isn't just another course - it's a complete transformation system that takes you from beginner to confident practitioner. ${
          formData.tone === 'story-driven'
            ?"I created this course after experiencing the same frustrations you're facing now. I know what it takes to break through, and I've distilled years of experience into a step-by-step framework that actually works."
            : formData.tone === 'educational'
            ? 'Built on proven pedagogical principles and industry best practices, this course delivers measurable results through structured learning modules and hands-on application.'
            :"We've eliminated all the guesswork and created a streamlined path to success. Follow the system, do the work, and watch your skills transform."
        }`,
      });

      // What You'll Get
      const outcomes = formData.keyOutcomes
        ? formData.keyOutcomes.split('\n').filter((o) => o.trim())
        : [
            'Complete mastery of core concepts and advanced techniques',
            'Real-world projects to build your portfolio',
            'Lifetime access to all course materials and updates',
            'Certificate of completion to showcase your achievement',
            'Private community access for networking and support',
          ];

      sections.push({
        section:"What You'll Get",
        content: outcomes,
      });

      // Social Proof
      sections.push({
        section: 'Social Proof / Testimonials',
        content: `"${courseName} completely changed my career trajectory. Within 3 months, I landed my dream role and negotiated a 40% salary increase. This course was worth every penny." - Sarah M., Course Graduate\n\n"I've tried other courses, but nothing compares to this. The structure, the content, the support - everything is world-class. Highly recommended!" - James K., Professional ${audience}\n\n"Clear, actionable, and effective. This is exactly what I needed to level up my skills." - Maria L., Career Switcher`,
      });

      // Pricing & Guarantee
      const defaultGuarantee ="30-Day Money-Back Guarantee: Try the entire course risk-free. If you're not completely satisfied, we'll refund every penny - no questions asked.";
      sections.push({
        section: 'Pricing & Guarantee',
        content: `Investment: ${priceText}\n\n${
          formData.bonusGuarantee || defaultGuarantee
        }\n\nBonus: Enroll today and receive exclusive access to our advanced masterclass series (Value: $199) absolutely free!`,
      });

      // Final CTA
      const finalCtaText = formData.tone === 'story-driven'
        ? 'Your future self is waiting on the other side of this decision. Take the leap.'
        : formData.tone === 'educational'
        ? 'Invest in your education today and reap the benefits for years to come.'
        :"Join the thousands who've already transformed their careers. The only question is: will you be next?";
      
      sections.push({
        section: 'Final Call-to-Action',
        content: `Don't let another day go by wondering"what if." ${finalCtaText}\n\nClick below to get instant access to ${courseName} and start your transformation today. See you inside!`,
      });

      setGeneratedCopy(sections);
      setIsGenerating(false);
    }, 1500);
  };

  const copyFullPage = () => {
    if (!generatedCopy) return;

    let text = `Sales Page Copy: ${formData.courseTitle}\n${'='.repeat(40)}\n\n`;
    generatedCopy.forEach((section) => {
      text += `${section.section}\n${'-'.repeat(section.section.length)}\n`;
      if (Array.isArray(section.content)) {
        section.content.forEach((item) => {
          text += `• ${item}\n`;
        });
      } else {
        text += `${section.content}\n`;
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    alert('Full sales page copy copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">Generate Sales Page Copy</h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Create compelling sales page content that converts visitors into students.
          </p>
        </div>

        {/* Course Title */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Course Title</label>
          <input
            type="text"
            value={formData.courseTitle}
            onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
            placeholder="e.g., Complete Digital Marketing Mastery"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Target Audience Persona */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Target Audience Persona
          </label>
          <textarea
            value={formData.audiencePersona}
            onChange={(e) => setFormData({ ...formData, audiencePersona: e.target.value })}
            placeholder="Describe your ideal student: their background, goals, challenges..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Key Outcomes/Benefits */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Key Outcomes / Benefits
          </label>
          <textarea
            value={formData.keyOutcomes}
            onChange={(e) => setFormData({ ...formData, keyOutcomes: e.target.value })}
            placeholder="One benefit per line..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Price</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="e.g., $299 or $49/month"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Bonus/Guarantee */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Optional Bonus / Guarantee Text
          </label>
          <textarea
            value={formData.bonusGuarantee}
            onChange={(e) => setFormData({ ...formData, bonusGuarantee: e.target.value })}
            placeholder="E.g., 60-day money-back guarantee, bonus materials included..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Tone Selector */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">Tone</label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          >
            <option value="high-conversion">High-conversion</option>
            <option value="story-driven">Story-driven</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateSalesCopy}
          disabled={isGenerating || !formData.courseTitle.trim()}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Sales Page Copy'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Sales Copy Draft</h4>

        {!generatedCopy ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-[#9CA3B5]">
              Fill in the course details and click"Generate Sales Page Copy" to create your
              content.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5 mb-6 max-h-96 overflow-y-auto">
              {generatedCopy.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
                  <h5 className="font-bold text-[#304DB5] mb-3 text-sm uppercase tracking-wide">
                    {section.section}
                  </h5>
                  {Array.isArray(section.content) ? (
                    <ul className="space-y-2">
                      {section.content.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-sm text-[#5F6473] leading-relaxed">
                          {item.startsWith('Headline:') ||
                          item.startsWith('Subheadline:') ||
                          item.startsWith('CTA:') ? (
                            <div>
                              <span className="font-semibold">
                                {item.split(':')[0]}:
                              </span>{' '}
                              {item.split(':').slice(1).join(':')}
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className="text-[#304DB5] mt-1">✓</span>
                              <span>{item}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#5F6473] leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={copyFullPage}
              className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Copy Full Page
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AISalesPageCopyTool;
