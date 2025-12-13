import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Edit2, Trash2, Palette } from 'lucide-react';
import { schoolsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function SchoolDetail() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    courses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchool();
    fetchStats();
  }, [schoolId]);

  const fetchSchool = async () => {
    try {
      const result = await schoolsAPI.fetchSchools();
      const foundSchool = result.schools?.find(s => s.id === schoolId);
      setSchool(foundSchool);
    } catch (error) {
      console.error('Error fetching school:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // TODO: Fetch actual stats from Firestore
    // For now, placeholder
    setStats({
      students: 0,
      staff: 0,
      courses: 0
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }
    try {
      await schoolsAPI.deleteSchool(schoolId);
      navigate('/schools');
    } catch (error) {
      alert('Error deleting school: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading school...</div>;
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">School not found</p>
        <button onClick={() => navigate('/schools')} className="text-admin-accent hover:underline">
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/schools')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} /> Back to Schools
      </button>

      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{school.name}</h2>
            {school.address && (
              <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                <MapPin size={14} /> {school.address}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/schools?edit=${schoolId}`)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit2 size={18} /> Edit
            </button>
            {isSuperAdmin && (
              <button
                onClick={handleDelete}
                className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-900 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Students</div>
            <div className="text-2xl font-bold text-white">{stats.students}</div>
          </div>
          <div className="bg-gray-900 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Staff</div>
            <div className="text-2xl font-bold text-white">{stats.staff}</div>
          </div>
          <div className="bg-gray-900 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Courses</div>
            <div className="text-2xl font-bold text-white">{stats.courses}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-bold mb-3">School Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock size={16} className="text-gray-500" />
                <span>Required Hours: {school.requiredHours || 100}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Palette size={16} className="text-gray-500" />
                <span>Primary Color: </span>
                <div
                  className="w-6 h-6 rounded border border-gray-700"
                  style={{ backgroundColor: school.primaryColor || '#4f46e5' }}
                />
                <span className="font-mono text-xs">{school.primaryColor || '#4f46e5'}</span>
              </div>
              {school.createdAt && (
                <div className="text-gray-400 text-xs mt-4">
                  Created: {new Date(school.createdAt.toMillis?.() || school.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">School Admins</h3>
            <div className="bg-gray-900 rounded p-4">
              {school.admins && school.admins.length > 0 ? (
                <ul className="space-y-2">
                  {school.admins.map((adminId, idx) => (
                    <li key={idx} className="text-gray-300 text-sm font-mono">{adminId}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No school admins assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* School Collections Placeholder */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">School Data</h3>
        <div className="text-gray-400 text-sm">
          School-specific data (courses, students, staff, etc.) will be displayed here.
          This data is managed through the main webapp's EDU Dashboard.
        </div>
      </div>
    </div>
  );
}

