import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';

const OrgBrandingPage: React.FC = () => {
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState({
    primary: '#F97316',
    secondary: '#DC2626',
    accent: '#FB923C'
  });
  const [brandSettings, setBrandSettings] = useState({
    companyName: 'Acme Corporation',
    tagline: 'Innovation Through Learning',
    welcomeMessage: 'Welcome to Acme Learning Portal',
    emailFooter: 'Best regards,\nThe Acme Learning Team'
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log('Saving branding settings:', { brandColors, brandSettings, logoFile });
    alert('Branding settings saved successfully!');
  };

  return (
    <OrgOwnerAppLayout>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Organization Branding</h1>
              <p className="text-[#5F6473]">Customize the look and feel of your learning portal</p>
            </div>
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              💾 Save Changes
            </button>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <h3 className="font-bold text-[#111827] mb-4">Preview</h3>
            <div className="bg-white rounded-xl p-6 shadow-md" style={{ borderTop: `4px solid ${brandColors.primary}` }}>
              <div className="flex items-center gap-4 mb-4">
                {logoFile ? (
                  <img src={logoFile} alt="Logo" className="w-16 h-16 object-contain rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg flex items-center justify-center text-2xl">
                    🏢
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: brandColors.primary }}>
                    {brandSettings.companyName}
                  </h2>
                  <p className="text-sm text-[#5F6473]">{brandSettings.tagline}</p>
                </div>
              </div>
              <p className="text-[#111827] mb-4">{brandSettings.welcomeMessage}</p>
              <button 
                className="px-6 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: brandColors.primary }}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Company Logo</h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-[#E5E7EB] rounded-xl flex items-center justify-center overflow-hidden">
                {logoFile ? (
                  <img src={logoFile} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-4xl">🏢</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#5F6473] mb-3">
                  Upload your organization's logo. Recommended size: 512x512px, PNG or SVG format.
                </p>
                <label className="inline-block px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  Upload Logo
                </label>
                {logoFile && (
                  <button
                    onClick={() => setLogoFile(null)}
                    className="ml-2 px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColors.primary}
                    onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                    className="w-16 h-16 rounded-lg border border-[#E5E7EB] cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandColors.primary}
                      onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                      className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColors.secondary}
                    onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                    className="w-16 h-16 rounded-lg border border-[#E5E7EB] cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandColors.secondary}
                      onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                      className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColors.accent}
                    onChange={(e) => setBrandColors({ ...brandColors, accent: e.target.value })}
                    className="w-16 h-16 rounded-lg border border-[#E5E7EB] cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandColors.accent}
                      onChange={(e) => setBrandColors({ ...brandColors, accent: e.target.value })}
                      className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Text Settings */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Text & Messaging</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={brandSettings.companyName}
                  onChange={(e) => setBrandSettings({ ...brandSettings, companyName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={brandSettings.tagline}
                  onChange={(e) => setBrandSettings({ ...brandSettings, tagline: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Welcome Message
                </label>
                <textarea
                  rows={3}
                  value={brandSettings.welcomeMessage}
                  onChange={(e) => setBrandSettings({ ...brandSettings, welcomeMessage: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Email Footer
                </label>
                <textarea
                  rows={4}
                  value={brandSettings.emailFooter}
                  onChange={(e) => setBrandSettings({ ...brandSettings, emailFooter: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Additional Options</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-[#111827]">Show Company Logo in Certificates</p>
                  <p className="text-sm text-[#5F6473]">Display your logo on learner certificates</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-[#111827]">Custom Email Sender Name</p>
                  <p className="text-sm text-[#5F6473]">Use company name in email notifications</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-[#111827]">Hide NexSkill Branding</p>
                  <p className="text-sm text-[#5F6473]">Remove NexSkill branding from learner view (Enterprise only)</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </OrgOwnerAppLayout>
  );
};

export default OrgBrandingPage;
