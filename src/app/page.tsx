"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-100 p-6 rounded-full shadow-inner mb-4">
        <QrCode className="w-24 h-24 text-indigo-600" />
      </div>
      
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Enterprise QR Code <span className="text-indigo-600">Manager</span>
        </h1>
        <p className="text-lg text-slate-600">
          Create, track, and manage dynamic high-resolution QR codes. Designed for high availability and strict routing compliance.
        </p>
      </div>

      <div className="pt-8">
        <button 
          onClick={() => router.push('/generate')}
          className="group flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
        >
          Generate QR
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
