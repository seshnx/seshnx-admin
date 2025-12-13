import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Edit2, Trash2, MapPin, Palette, Clock } from 'lucide-react';
import { schoolsAPI } from '../utils/api';
import RefreshButton from '../components/RefreshButton';
import RealtimeIndicator from '../components/RealtimeIndicator';

export default function SchoolManager() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    primaryColor: '#4f46e5',
    requiredHours: 100
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const result = await schoolsAPI.fetchSchools();
      setSchools(result.schools || []);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching schools:', error);
      alert('Error loading schools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const result = await schoolsAPI.createSchool({
        name: formData.name,
        address: formData.address,
        primaryColor: formData.primaryColor,
        requiredHours: formData.requiredHours
      });

      setShowModal(false);
      setFormData({ name: '', address: '', primaryColor: '#4f46e5', requiredHours: 100 });
      fetchSchools();
    } catch (error) {
      console.error('Error creating school:', error);
      alert('Error creating school: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    try {
      await schoolsAPI.updateSchool(editingSchool.id, {
        name: formData.name,
        address: formData.address,
        primaryColor: formData.primaryColor,
        requiredHours: formData.requiredHours
      });
      setShowModal(false);
      setEditingSchool(null);
      setFormData({ name: '', address: '', primaryColor: '#4f46e5', requiredHours: 100 });
      fetchSchools();
    } catch (error) {
      console.error('Error updating school:', error);
      alert('Error updating school: ' + error.message);
    }
  };

  const handleDelete = async (schoolId) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }
    try {
      await schoolsAPI.deleteSchool(schoolId);
      fetchSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Error deleting school: ' + error.message);
    }
  };

  const openCreateModal = () => {
    setEditingSchool(null);
    setFormData({ name: '', address: '', primaryColor: '#4f46e5', requiredHours: 100 });
    setShowModal(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      address: school.address || '',
      primaryColor: school.primaryColor || '#4f46e5',
      requiredHours: school.requiredHours || 100
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">School Management</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">Create and manage schools on the platform</p>
            <RealtimeIndicator lastUpdate={lastUpdate} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={fetchSchools} disabled={loading} />
          <button
            onClick={openCreateModal}
            className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> New School
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading schools...</div>
      ) : schools.length === 0 ? (
        <div className="bg-admin-card border border-gray-800 rounded-lg p-12 text-center">
          <GraduationCap size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-bold mb-2">No Schools Yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first school to get started</p>
          <button onClick={openCreateModal} className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            Create School
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map(school => (
            <div key={school.id} className="bg-admin-card border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{school.name}</h3>
                  <div className="space-y-1 text-sm text-gray-400">
                    {school.address && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} /> {school.address}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock size={14} /> {school.requiredHours || 100} hours required
                    </div>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: school.primaryColor || '#4f46e5' }}
                  title="Primary Color"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/schools/${school.id}`)}
                  className="flex-1 bg-admin-accent hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  View Details
                </button>
                <button
                  onClick={() => openEditModal(school)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(school.id)}
                  className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-admin-card border border-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-white font-bold text-xl mb-4">
              {editingSchool ? 'Edit School' : 'Create New School'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">School Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="Enter school address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none font-mono text-sm"
                    placeholder="#4f46e5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Required Hours</label>
                <input
                  type="number"
                  value={formData.requiredHours}
                  onChange={(e) => setFormData({ ...formData, requiredHours: parseInt(e.target.value) || 100 })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="100"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSchool(null);
                  setFormData({ name: '', address: '', primaryColor: '#4f46e5', requiredHours: 100 });
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={editingSchool ? handleUpdate : handleCreate}
                className="flex-1 bg-admin-accent hover:bg-blue-600 text-white py-2 rounded"
                disabled={!formData.name}
              >
                {editingSchool ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

