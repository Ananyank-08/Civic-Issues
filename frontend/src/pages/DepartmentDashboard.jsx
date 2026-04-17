import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconSrc from 'leaflet/dist/images/marker-icon.png';
import iconRetinaSrc from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadowSrc from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: iconSrc,
  iconRetinaUrl: iconRetinaSrc,
  shadowUrl: iconShadowSrc,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DepartmentDashboard() {
  const { user } = useSelector(state => state.auth);
  const [complaints, setComplaints] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse department id from token if we stored it, else we need the backend to filter it.
  // The backend already filters based on user id for DEPARTMENT_STAFF.
  const deptId = user?.departmentId || '';

  useEffect(() => {
    fetchDepartmentComplaints();
  }, [selectedStatus]);

  const fetchDepartmentComplaints = async () => {
    try {
      setLoading(true);
      // We pass the deptId to the generic endpoint. 
      // Assuming a staff belongs to one department.
      // If we don't have it on frontend, we can fetch all and backend will filter, 
      // but let's assume we can fetch by dept_id or backend handles generic empty dept id if missing.
      const url = selectedStatus === 'all' 
        ? `/departments/${deptId || 'mine'}/complaints`
        : `/departments/${deptId || 'mine'}/complaints?status=${selectedStatus}`;
      
      const { data } = await api.get(url);
      setComplaints(data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId, newStatus, notes = '') => {
    try {
      const res = await api.patch(`/complaints/${complaintId}/status`, { status: newStatus, notes });
      if (res.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchDepartmentComplaints(); 
        if (selectedComplaint?.id === complaintId) {
            setSelectedComplaint({...selectedComplaint, status: newStatus});
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status.toLowerCase().replace(' ', '_')] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-bg-dark pt-28 pb-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white">Department Dashboard</h1>
          <p className="text-slate-400 font-medium">Manage and resolve civic issues assigned to your unit.</p>
        </header>

        <div className="flex gap-4">
          {['all', 'Pending', 'In Progress', 'Resolved'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${
                selectedStatus === status
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-bg-card border-white/5 text-text-muted hover:border-white/10 hover:text-white'
              }`}
            >
              {status === 'all' ? 'View All' : `View ${status.replace('_', ' ')}`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
          
          <div className="bg-bg-card border border-white/5 rounded-3xl p-6 flex flex-col h-full shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">
              Assigned Issues <span className="text-primary bg-primary/10 ml-2 px-3 py-1 rounded-full text-sm">{complaints.length}</span>
            </h2>

            {loading ? (
              <div className="flex-1 flex justify-center items-center text-text-muted font-medium">Loading...</div>
            ) : complaints.length === 0 ? (
              <div className="flex-1 flex justify-center items-center text-text-muted font-medium">No complaints found.</div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {complaints.map(complaint => (
                  <motion.div
                    whileHover={{ y: -2 }}
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`p-5 rounded-2xl cursor-pointer transition-all border-l-4 ${
                      selectedComplaint?.id === complaint.id
                        ? 'bg-white/5 border-primary shadow-lg'
                        : 'bg-white/[0.02] border-transparent hover:bg-white-[0.04]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">
                        Issue #{complaint.id.substring(0,6)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-primary font-bold text-sm mb-3 bg-primary/10 inline-block px-3 py-1 rounded-lg">{complaint.finalCategory || complaint.nlpCategory}</p>
                    <p className="text-text-muted text-xs truncate max-w-sm mb-3">{complaint.description}</p>
                    <div className="flex text-text-muted text-[10px] font-bold uppercase tracking-wider justify-between items-center opacity-60">
                        <span>📍 {complaint.location?.lat?.toFixed(4) || 0}, {complaint.location?.lng?.toFixed(4) || 0}</span>
                        <span>📅 {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-card border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl">
            {selectedComplaint ? (
              <div className="flex flex-col h-full gap-6">
                <h2 className="text-xl font-bold text-white mb-2">Location & Actions</h2>
                <div className="flex-1 min-h-[300px] bg-black/20 rounded-2xl overflow-hidden border border-white/5 relative z-0">
                  {selectedComplaint.location?.lat && (
                     <MapContainer
                        center={[selectedComplaint.location.lat, selectedComplaint.location.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        key={selectedComplaint.id}
                     >
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <Marker position={[selectedComplaint.location.lat, selectedComplaint.location.lng]}>
                        <Popup>
                            <strong>{selectedComplaint.finalCategory || selectedComplaint.nlpCategory}</strong><br />
                            {selectedComplaint.description}
                        </Popup>
                     </Marker>
                     </MapContainer>
                  )}
                </div>

                <div className="flex flex-col gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Issue Overview</span>
                        <p className="text-white text-sm font-medium">{selectedComplaint.description}</p>
                     </div>
                     {selectedComplaint.imageUrl && (
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Evidence</span>
                            <img src={`${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api').replace('/api', '')}${selectedComplaint.imageUrl}`} alt="Issue" className="w-full max-h-24 rounded-lg object-cover" />
                        </div>
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Update Resolution Status</span>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => updateStatus(selectedComplaint.id, 'Pending')} className="bg-white/5 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 py-3 rounded-xl font-bold text-sm transition-all focus:ring-2 focus:ring-yellow-500/50">
                      Pending
                    </button>
                    <button onClick={() => updateStatus(selectedComplaint.id, 'In Progress')} className="bg-white/5 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 py-3 rounded-xl font-bold text-sm transition-all focus:ring-2 focus:ring-blue-500/50">
                      In Progress
                    </button>
                    <button onClick={() => updateStatus(selectedComplaint.id, 'Resolved')} className="bg-white/5 hover:bg-green-500/20 text-green-500 border border-green-500/30 py-3 rounded-xl font-bold text-sm transition-all focus:ring-2 focus:ring-green-500/50">
                      Resolved
                    </button>
                  </div>
                </div>

                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedComplaint.location?.lat || 0},${selectedComplaint.location?.lng || 0}`, '_blank')} className="btn-primary w-full py-4 text-base mt-auto">
                  🗺️ Get Directions (Google Maps)
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted font-medium bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
                <p>Select an issue from the left to view location & take action</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
