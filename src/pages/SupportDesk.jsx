import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { reportsAPI } from '../utils/api';

export default function SupportDesk() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchReports();
    // Poll for updates every 30 seconds (since we can't use real-time listeners with API routes)
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const result = await reportsAPI.fetchReports();
      setRequests(result.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setRequests([]);
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
      <h2 className="text-2xl font-bold mb-6">Service Desk</h2>
      <div className="grid gap-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className={`p-2 rounded-full ${req.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                   {req.status === 'Resolved' ? <CheckCircle size={20} /> : <Clock size={20} />}
               </div>
               <div>
                   <h4 className="font-bold dark:text-white text-lg">{req.topic}</h4>
                   <div className="text-sm text-gray-500 flex gap-3">
                       <span>User ID: {req.userId}</span>
                       <span>•</span>
                       <span>{req.timestamp ? new Date(req.timestamp.toMillis()).toLocaleString() : 'Pending...'}</span>
                   </div>
               </div>
            </div>
            
            {req.status !== 'Resolved' && (
                <button 
                    onClick={() => resolveTicket(req.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    Mark Resolved
                </button>
            )}
          </div>
        ))}
        {requests.length === 0 && <div className="text-center py-10 text-gray-500">No active support tickets.</div>}
      </div>
    </div>
  );
}
