import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import RefreshButton from '../components/RefreshButton';
import RealtimeIndicator from '../components/RealtimeIndicator';

export default function SupportDesk() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchReports();
    
    // Auto-refresh every 15 seconds if enabled (support tickets need frequent updates)
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchReports();
      }, 15000); // 15 seconds for support tickets
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const result = await reportsAPI.fetchReports();
      setRequests(result.reports || []);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching reports:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (id) => {
    if(confirm("Mark this ticket as Resolved?")) {
      try {
        await reportsAPI.updateReportStatus(id, 'Resolved');
        fetchReports();
      } catch (error) {
        alert('Error resolving ticket: ' + error.message);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Desk</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">Support tickets and service requests</p>
            <RealtimeIndicator isLive={autoRefresh} lastUpdate={lastUpdate} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh</span>
          </label>
          <RefreshButton onRefresh={fetchReports} disabled={loading} />
        </div>
      </div>
      <div className="space-y-4">
        {loading && requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Loading tickets...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No active support tickets.</div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-admin-card border border-gray-800 rounded-lg p-4 flex justify-between items-center hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${req.status === 'Resolved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                  {req.status === 'Resolved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{req.topic || req.subject || 'Support Request'}</h4>
                  <div className="text-sm text-gray-400 flex gap-3 mt-1">
                    <span>User ID: {req.userId || req.user || 'Unknown'}</span>
                    <span>•</span>
                    <span>
                      {req.timestamp 
                        ? (req.timestamp.toMillis 
                          ? new Date(req.timestamp.toMillis()).toLocaleString() 
                          : new Date(req.timestamp).toLocaleString())
                        : 'Pending...'}
                    </span>
                  </div>
                  {req.description && (
                    <p className="text-sm text-gray-500 mt-2">{req.description}</p>
                  )}
                </div>
              </div>
              
              {req.status !== 'Resolved' && (
                <button 
                  onClick={() => resolveTicket(req.id)}
                  className="px-4 py-2 bg-admin-accent hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
