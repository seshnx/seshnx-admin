import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Plus, Edit2, Trash2, MapPin, Palette, Clock, Users as UsersIcon, ChevronDown, ChevronUp } from 'lucide-react';

export default function SchoolManager() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const [schoolStudents, setSchoolStudents] = useState({});
  const [schoolStaff, setSchoolStaff] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    primary_color: '#4f46e5',
    secondary_color: '#818cf8',
    required_hours: 100,
    description: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/schools', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      } else {
        console.error('Failed to fetch schools');
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      alert('Error loading schools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolDetails = async (schoolId) => {
    setLoadingDetails(true);
    try {
      // Fetch students
      const studentsResponse = await fetch(`/api/admin/schools/${schoolId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch staff (using the students endpoint structure for now)
      const staffResponse = await fetch(`/api/admin/schools/${schoolId}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setSchoolStudents(prev => ({ ...prev, [schoolId]: studentsData.students || [] }));
      }

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setSchoolStaff(prev => ({ ...prev, [schoolId]: staffData.staff || [] }));
      }
    } catch (error) {
      console.error('Error fetching school details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleExpand = async (schoolId) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null);
    } else {
      setExpandedSchool(schoolId);
      if (!schoolStudents[schoolId]) {
        await fetchSchoolDetails(schoolId);
      }
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchSchools();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create school');
      }
    } catch (error) {
      console.error('Error creating school:', error);
      alert('Error creating school: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolId: editingSchool.id,
          ...formData
        })
      });

      if (response.ok) {
        setShowModal(false);
        setEditingSchool(null);
        resetForm();
        fetchSchools();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update school');
      }
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
      const response = await fetch(`/api/admin/schools?schoolId=${schoolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSchools();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete school');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Error deleting school: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      primary_color: '#4f46e5',
      secondary_color: '#818cf8',
      required_hours: 100,
      description: ''
    });
  };

  const openCreateModal = () => {
    setEditingSchool(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      zip_code: school.zip_code || '',
      primary_color: school.primary_color || '#4f46e5',
      secondary_color: school.secondary_color || '#818cf8',
      required_hours: school.required_hours || 100,
      description: school.description || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">School Management</h2>
          <p className="text-gray-400 text-sm">Create and manage schools on the platform</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> New School
        </button>
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
        <div className="space-y-4">
          {schools.map(school => (
            <div key={school.id} className="bg-admin-card border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{school.name}</h3>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: school.primary_color || '#4f46e5' }}
                        title="Primary Color"
                      />
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      {school.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} /> {school.address}
                          {school.city && `, ${school.city}`}
                          {school.state && ` ${school.state}`}
                          {school.zip_code && ` ${school.zip_code}`}
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} /> {school.required_hours || 100} hours required
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersIcon size={14} /> {school.student_count || 0} students
                        </div>
                        {school.staff_count > 0 && (
                          <div className="flex items-center gap-2">
                            <GraduationCap size={14} /> {school.staff_count} staff
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/schools/${school.id}`)}
                      className="bg-admin-accent hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openEditModal(school)}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded text-sm flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    <button
                      onClick={() => toggleExpand(school.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                    >
                      {expandedSchool === school.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Students
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Student List */}
              {expandedSchool === school.id && (
                <div className="border-t border-gray-800 p-6 bg-admin-dark/30">
                  {loadingDetails ? (
                    <div className="text-center text-gray-400 py-4">Loading students...</div>
                  ) : (
                    <>
                      <h4 className="text-white font-semibold mb-4">Enrolled Students ({schoolStudents[school.id]?.length || 0})</h4>
                      {schoolStudents[school.id]?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {schoolStudents[school.id].map(student => (
                            <div key={student.id} className="bg-admin-card border border-gray-800 rounded p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-admin-accent/20 flex items-center justify-center text-admin-accent font-bold">
                                  {(student.display_name || student.first_name || student.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {student.display_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {student.status === 'Active' ? (
                                    <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded">Active</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-900/30 text-gray-400 rounded">{student.status}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No students enrolled in this school yet.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-admin-card border border-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-bold text-xl mb-4">
              {editingSchool ? 'Edit School' : 'Create New School'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">School Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none resize-none"
                  placeholder="School description (optional)"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                    placeholder="State"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                  placeholder="ZIP Code"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none font-mono text-sm"
                      placeholder="#4f46e5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none font-mono text-sm"
                      placeholder="#818cf8"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Required Hours</label>
                <input
                  type="number"
                  value={formData.required_hours}
                  onChange={(e) => setFormData({ ...formData, required_hours: parseInt(e.target.value) || 100 })}
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
                  resetForm();
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

