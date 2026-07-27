"use client";
import React, { useState, useEffect } from 'react';
import { Printer, LayoutGrid, CheckSquare, Download } from 'lucide-react';
import { QRRecord } from '@/types/qr';

export default function PrintLayoutPage() {
  const [qrList, setQrList] = useState<QRRecord[]>([]);
  const [selectedQRs, setSelectedQRs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [config, setConfig] = useState({
    paperSize: 'A4',
    columns: 3,
    rows: 4,
    showLabel: true,
    showUniqueCode: true,
    margin: 20,
    padding: 10,
  });

  useEffect(() => {
    fetchQRs();
  }, []);

  const fetchQRs = async () => {
    try {
      const res = await fetch('/api/qr?limit=100'); // fetch more for printing
      const data = await res.json();
      if (data.data) setQrList(data.data.filter((q: QRRecord) => q.isActive));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (code: string) => {
    setSelectedQRs(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleGeneratePrint = async () => {
    if (selectedQRs.length === 0) return alert('Select at least one QR code');
    setLoading(true);
    setDownloadUrl(null);
    try {
      const res = await fetch('/api/qr/print-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, qrCodes: selectedQRs })
      });
      
      if (!res.ok) throw new Error('Failed to generate print layout');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      console.error(error);
      alert('Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Settings Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <LayoutGrid className="w-5 h-5 text-indigo-500 mr-2" />
            <h2 className="text-xl font-bold text-slate-800">Layout Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
              <select value={config.paperSize} onChange={e => setConfig({...config, paperSize: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm">
                <option value="A4">A4 (Standard)</option>
                <option value="A5">A5 (Half-size)</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Columns</label>
                <input type="number" min="1" max="10" value={config.columns} onChange={e => setConfig({...config, columns: parseInt(e.target.value) || 1})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rows</label>
                <input type="number" min="1" max="20" value={config.rows} onChange={e => setConfig({...config, rows: parseInt(e.target.value) || 1})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={config.showLabel} onChange={e => setConfig({...config, showLabel: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Print Custom Label</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={config.showUniqueCode} onChange={e => setConfig({...config, showUniqueCode: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Print Unique Code</span>
              </label>
            </div>

            <button onClick={handleGeneratePrint} disabled={loading || selectedQRs.length === 0} className="w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors">
              <Printer className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate PDF / Image'}
            </button>

            {downloadUrl && (
              <a href={downloadUrl} download={`print-layout-${Date.now()}`} className="w-full mt-2 flex justify-center items-center py-3 px-4 border border-indigo-200 rounded-xl shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Download Layout
              </a>
            )}
          </div>
        </div>
      </div>

      {/* QR Selection Panel */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <CheckSquare className="w-5 h-5 text-indigo-500 mr-2" />
              Select QRs to Print ({selectedQRs.length})
            </h2>
            <button onClick={() => setSelectedQRs(qrList.map(q => q.uniqueCode))} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Select All</button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {qrList.map(qr => (
                <div 
                  key={qr.uniqueCode} 
                  onClick={() => toggleSelect(qr.uniqueCode)}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${selectedQRs.includes(qr.uniqueCode) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                    <img src={qr.imageStoragePath} alt={qr.label || qr.uniqueCode} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate">{qr.label || 'Unnamed'}</div>
                  <div className="text-xs text-slate-500 font-mono truncate">{qr.uniqueCode}</div>
                </div>
              ))}
              {qrList.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-500">
                  No active QR codes found. Go to Dashboard to generate some.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
