import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Calendar, Shield, GraduationCap, Edit2, Save, X } from 'lucide-react';
import { usersAPI } from '../utils/api';
import { db, APP_ID } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { schoolsAPI } from '../utils/api';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [user, setUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ schoolId: '' });

  useEffect(() => {
    fetchUser();
    fetchSchools();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const result = await usersAPI.fetchUsers();
      const foundUser = result.users?.find(u => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
        setFormData({ schoolId: foundUser.schoolId || '' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const result = await schoolsAPI.fetchSchools();
      setSchools(result.schools || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleLinkSchool = async () => {
    try {
      // TODO: Use API route for this
      const profileRef = doc(db, user.profilePath);
      await updateDoc(profileRef, { schoolId: formData.schoolId || null });
      setUser({ ...user, schoolId: formData.schoolId || null });
      setEditing(false);
      alert('School linked successfully');
    } catch (error) {
      console.error('Error linking school:', error);
      alert('Error linking school: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading user...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">User not found</p>
        <button onClick={() => navigate('/users')} className="text-admin-accent hover:underline">
          Back to Users
        </button>
      </div>
    );
  }

  const linkedSchool = schools.find(s => s.id === user.schoolId);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} /> Back to Users
      </button>

      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user.firstName || 'N/A'} {user.lastName || ''}
            </h2>
            <p className="text-gray-400 text-sm font-mono mt-1">{user.id}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Edit2 size={18} /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={18} className="text-gray-500" />
                <span>{user.email || 'N/A'}</span>
              </div>
              {user.city && user.state && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin size={18} className="text-gray-500" />
                  <span>{user.city}, {user.state}</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar size={18} className="text-gray-500" />
                  <span>Joined {new Date(user.createdAt.toMillis?.() || user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-white font-bold mb-4">Roles & Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.accountTypes?.map(role => (
                <span
                  key={role}
                  className={`px-3 py-1 rounded text-sm font-bold border ${
                    role === 'SuperAdmin'
                      ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
                      : role === 'GAdmin'
                      ? 'bg-purple-900/30 text-purple-300 border-purple-800'
                      : role === 'EDUAdmin'
                      ? 'bg-blue-900/30 text-blue-300 border-blue-800'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}
                >
                  {role}
                </span>
              ))}
              {(!user.accountTypes || user.accountTypes.length === 0) && (
                <span className="text-gray-500 text-sm">No roles assigned</span>
              )}
            </div>
          </div>

          {/* School Link */}
          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <GraduationCap size={20} /> School Assignment
            </h3>
            {editing ? (
              <div className="flex gap-3">
                <select
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="flex-1 bg-black border border-gray-700 rounded p-2 text-white focus:border-admin-accent outline-none"
                >
                  <option value="">No School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleLinkSchool}
                  className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save size={18} /> Save
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 rounded p-4">
                {linkedSchool ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{linkedSchool.name}</p>
                      <p className="text-gray-400 text-sm">{linkedSchool.address}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/schools/${linkedSchool.id}`)}
                      className="text-admin-accent hover:underline text-sm"
                    >
                      View School →
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400">No school assigned</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

