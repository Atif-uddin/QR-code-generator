/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity, ExternalLink, Globe, Smartphone, Clock, QrCode } from 'lucide-react';
import { QRRecord, ScanLog } from '@/types/qr';

export default function QRDetailsPage() {
  const { uniqueCode } = useParams();
  const router = useRouter();
  
  const [qrDetails, setQrDetails] = useState<QRRecord | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'deactivate'|'activate'} | null>(null);
  
  const fetchData = async (code: string) => {
    setLoading(true);
    try {
      // Fetch details (GET /api/qr/:uniqueCode)
      const detailsRes = await fetch(`/api/qr/${code}`);
      const detailsData = await detailsRes.json();
      if (detailsRes.ok) {
        setQrDetails(detailsData);
      }
      
      // Fetch logs (GET /api/qr/:uniqueCode/scan-logs)
      const logsRes = await fetch(`/api/qr/${code}/scan-logs?limit=50`);
      const logsData = await logsRes.json();
      if (logsRes.ok && logsData.data) {
        setScanLogs(logsData.data);
      }
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uniqueCode) {
      fetchData(uniqueCode as string);
    }
  }, [uniqueCode]);

  const handleDeactivate = () => {
    setConfirmModal({ isOpen: true, action: 'deactivate' });
  };

  const executeDeactivate = async () => {
    const res = await fetch(`/api/qr/${qrDetails?.uniqueCode}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmModal(null);
      fetchData(qrDetails!.uniqueCode); // Refresh
    }
  };

  const handleActivate = () => {
    setConfirmModal({ isOpen: true, action: 'activate' });
  };

  const executeActivate = async () => {
    const res = await fetch(`/api/qr/${qrDetails?.uniqueCode}/activate`, { method: 'PATCH' });
    if (res.ok) {
      setConfirmModal(null);
      fetchData(qrDetails!.uniqueCode); // Refresh
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!qrDetails) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">QR Code not found</h2>
        <button onClick={() => router.push('/qrs')} className="mt-4 text-indigo-600 hover:underline">
          Go back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">      

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/qrs')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              QR Analytics: {qrDetails.label || qrDetails.uniqueCode}
            </h1>
            <p className="text-slate-500 text-sm">Detailed scan statistics and history</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {qrDetails.isActive ? (
            <button onClick={handleDeactivate} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
              Deactivate QR
            </button>
          ) : (
            <button onClick={handleActivate} className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
              Activate QR
            </button>
          )}

          <a 
            href={`/verify/${uniqueCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Test Verify Link
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Overview */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 inline-block">
              <img src={qrDetails.imageStoragePath} alt="QR" className="w-40 h-40 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{qrDetails.label || 'Unnamed QR'}</h2>
            <p className="font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm mb-4">{qrDetails.uniqueCode}</p>
            
            <div className="w-full text-left space-y-3 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination</label>
                <div className="text-sm text-slate-700 truncate" title={qrDetails.originalUrl}>
                  {qrDetails.originalUrl}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qrDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {qrDetails.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
            <h3 className="text-indigo-100 font-medium mb-1">Total Scans</h3>
            <div className="text-5xl font-bold">{qrDetails.scanCount}</div>
          </div>
        </div>

        {/* Scan History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Recent Scans (Last 50)</h2>
            </div>
            <div className="overflow-y-auto flex-1 max-h-[600px]">
              {scanLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Globe className="w-12 h-12 mb-3 text-slate-300" />
                  <p>No scans recorded yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {scanLogs.map((log, index) => (
                    <li key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{log.ipAddress}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs" title={log.userAgent}>{log.userAgent}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(log.scannedAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {confirmModal.action === 'deactivate' ? 'Deactivate QR Code?' : 'Activate QR Code?'}
            </h3>
            <p className="text-slate-600 mb-6">
              {confirmModal.action === 'deactivate' 
                ? 'Are you sure you want to deactivate this QR? Scans will show a deactivated message and redirects will stop.' 
                : 'Are you sure you want to reactivate this QR? It will resume redirecting users to the destination URL.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action === 'deactivate' ? executeDeactivate : executeActivate}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmModal.action === 'deactivate' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
