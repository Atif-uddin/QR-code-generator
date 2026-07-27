import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QrCode, LayoutDashboard, Printer } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TalentYug QR Manager',
  description: 'Enterprise QR Code Generator and Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <a href="/" className="flex-shrink-0 flex items-center cursor-pointer group">
                  <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-700 transition-colors">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <span className="ml-3 font-bold text-xl tracking-tight text-slate-900">
                    QR<span className="text-indigo-600">Manager</span>
                  </span>
                </a>
                <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                  <a href="/generate" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR
                  </a>
                  <a href="/qrs" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Generated QRs
                  </a>
                  <a href="/print-layout" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Layout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
            <p className="text-sm text-slate-500">
              © 2025 TalentYug Private Limited - Technical Assessment
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
