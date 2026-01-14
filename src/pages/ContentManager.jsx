import React, { useState, useEffect } from 'react';
import { Search, Trash2, Check, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContentManager() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContent();
  }, [activeTab, statusFilter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const type = activeTab === 'flagged' ? 'flagged' : activeTab;
      const response = await fetch(`/api/admin/content?type=${type}&status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      } else {
        console.error('Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId, contentType) => {
    if (!confirm(`Are you sure you want to delete this ${contentType}?`)) return;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contentType === 'post' ? { postId: contentId } : { commentId: contentId })
      });

      if (response.ok) {
        setContent(content.filter(item => item.id !== contentId));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleApprove = async (contentId, contentType) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contentType === 'post' ? { postId: contentId } : { commentId: contentId })
      });

      if (response.ok) {
        setContent(content.filter(item => item.id !== contentId));
      }
    } catch (error) {
      console.error('Error approving content:', error);
    }
  };

  const filteredContent = content.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.content?.toLowerCase().includes(searchLower) ||
      item.username?.toLowerCase().includes(searchLower) ||
      item.display_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
      </div>

      {/* Tabs */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'posts'
              ? 'bg-admin-accent text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} className="inline mr-2" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'comments'
              ? 'bg-admin-accent text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={18} className="inline mr-2" />
          Comments
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'flagged'
              ? 'bg-admin-accent text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <AlertTriangle size={18} className="inline mr-2" />
          Flagged
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by content or author..."
            className="w-full bg-admin-dark border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-admin-accent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-admin-dark border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-admin-accent outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="flagged">Flagged</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* Content List */}
      <div className="bg-admin-card border border-gray-800 rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredContent.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No content found</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                type={activeTab === 'flagged' ? item.content_type : activeTab.slice(0, -1)}
                onDelete={handleDelete}
                onApprove={activeTab === 'flagged' ? handleApprove : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentCard({ item, type, onDelete, onApprove }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentPreview = item.content?.length > 200
    ? item.content.slice(0, 200) + '...'
    : item.content;

  return (
    <div className="p-4 hover:bg-admin-dark/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-admin-accent/20 flex items-center justify-center text-admin-accent font-bold">
              {(item.display_name || item.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">
                {item.display_name || item.username || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500">
                {item.email || 'No email'} • {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
            {item.flagged && (
              <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded">
                Flagged
              </span>
            )}
          </div>
          <p className="text-gray-300 text-sm">
            {isExpanded ? item.content : contentPreview}
            {item.content?.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-admin-accent ml-2 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {onApprove && (
            <button
              onClick={() => onApprove(item.id, type)}
              className="p-2 text-green-500 hover:bg-green-900/20 rounded transition-colors"
              title="Approve"
            >
              <Check size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id, type)}
            className="p-2 text-red-500 hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}