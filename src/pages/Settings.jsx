import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../utils/api';

export default function Settings() {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    inviteRequired: false,
    maxSchoolsPerAdmin: 10,
    defaultRequiredHours: 100,
    platformName: 'SeshNx',
    supportEmail: 'support@seshnx.com',
    announcementTitle: '',
    announcementMessage: '',
    announcementActive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const result = await settingsAPI.fetchSettings();
      setSettings({ ...settings, ...result.settings });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      await settingsAPI.updateSettings(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
          <p className="text-gray-400 text-sm mt-1">Configure platform-wide settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>
      </div>

      {saveStatus === 'success' && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} /> Settings saved successfully
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> Error saving settings. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Settings */}
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <SettingsIcon size={20} /> System Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Maintenance Mode</label>
                <p className="text-gray-400 text-xs">Disable platform access for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Registration Enabled</label>
                <p className="text-gray-400 text-xs">Allow new user registrations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registrationEnabled}
                  onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-accent"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Invite Required</label>
                <p className="text-gray-400 text-xs">Require invite code for registration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inviteRequired}
                  onChange={(e) => setSettings({ ...settings, inviteRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-accent"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Platform Configuration */}
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold text-lg mb-4">Platform Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Max Schools Per Admin</label>
              <input
                type="number"
                value={settings.maxSchoolsPerAdmin}
                onChange={(e) => setSettings({ ...settings, maxSchoolsPerAdmin: parseInt(e.target.value) || 0 })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Default Required Hours</label>
              <input
                type="number"
                value={settings.defaultRequiredHours}
                onChange={(e) => setSettings({ ...settings, defaultRequiredHours: parseInt(e.target.value) || 0 })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Global Announcement */}
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-white font-bold text-lg mb-4">Global Announcement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Show Announcement</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.announcementActive}
                  onChange={(e) => setSettings({ ...settings, announcementActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-accent"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Announcement Title</label>
              <input
                type="text"
                value={settings.announcementTitle}
                onChange={(e) => setSettings({ ...settings, announcementTitle: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Announcement Message</label>
              <textarea
                value={settings.announcementMessage}
                onChange={(e) => setSettings({ ...settings, announcementMessage: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                rows="4"
                placeholder="Enter announcement message"
              />
            </div>
          </div>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 p-4 rounded-lg">
          <AlertCircle size={20} className="inline mr-2" />
          Only Super Admins can modify platform settings.
        </div>
      )}
    </div>
  );
}

