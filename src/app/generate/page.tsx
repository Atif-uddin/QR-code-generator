"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, Link as LinkIcon, QrCode } from 'lucide-react';

export default function GenerateQRPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    originalUrl: '',
    label: '',
    dotShape: 'square',
    eyeOuterShape: 'square',
    eyeInnerShape: 'square',
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    overallShape: 'square',
    errorCorrection: 'H',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = undefined;
      
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('logo', logoFile);
        const uploadRes = await fetch('/api/qr/upload-logo', {
          method: 'POST',
          body: logoData
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.logoUrl) {
          logoUrl = uploadJson.logoUrl;
        }
      }

      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, logoUrl })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate');
      
      // Redirect to the list to see it
      router.push('/qrs');
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      alert('Failed to generate QR: ' + msg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center mb-6">
          <Settings className="w-5 h-5 text-indigo-500 mr-2" />
          <h2 className="text-xl font-bold text-slate-800">Create New QR</h2>
        </div>
        
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="url" 
                required
                value={formData.originalUrl}
                onChange={e => setFormData({...formData, originalUrl: e.target.value})}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                placeholder="https://your-link.com" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Label (Optional)</label>
            <input 
              type="text" 
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              placeholder="e.g. Office Door Sticker" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pattern Shape</label>
              <select value={formData.dotShape} onChange={e => setFormData({...formData, dotShape: e.target.value})} className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="square">Square</option>
                <option value="rounded">Rounded</option>
                <option value="dots">Dots</option>
                <option value="classy">Classy</option>
                <option value="classy-rounded">Classy Rounded</option>
                <option value="extra-rounded">Extra Rounded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Overall Frame</label>
              <select value={formData.overallShape} onChange={e => setFormData({...formData, overallShape: e.target.value})} className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="rounded-rectangle">Rounded Rectangle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eye Frame Shape</label>
              <select value={formData.eyeOuterShape} onChange={e => setFormData({...formData, eyeOuterShape: e.target.value})} className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="square">Square</option>
                <option value="rounded">Rounded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eye Inner Shape</label>
              <select value={formData.eyeInnerShape} onChange={e => setFormData({...formData, eyeInnerShape: e.target.value})} className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="square">Square</option>
                <option value="dot">Dot</option>
                <option value="rounded">Rounded</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Foreground Color</label>
              <div className="flex items-center space-x-2">
                <input type="color" value={formData.fgColor} onChange={e => setFormData({...formData, fgColor: e.target.value})} className="h-9 w-12 rounded cursor-pointer border border-slate-300 p-1" />
                <input type="text" value={formData.fgColor} onChange={e => setFormData({...formData, fgColor: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Background Color</label>
              <div className="flex items-center space-x-2">
                <input type="color" value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="h-9 w-12 rounded cursor-pointer border border-slate-300 p-1" />
                <input type="text" value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Embedded Logo (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">{logoFile ? logoFile.name : "PNG, JPG up to 2MB"}</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            {loading ? 'Generating...' : 'Generate High-Res QR Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
