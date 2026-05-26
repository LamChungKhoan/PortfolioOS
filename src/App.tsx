/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortfolioTable } from './components/PortfolioTable';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-slate-300 font-sans antialiased relative overflow-hidden">
      {/* 3D Tech Background Elements */}
      <div className="absolute inset-0 tech-grid-bg pointer-events-none z-0"></div>
      <div className="absolute inset-0 scanlines z-50 pointer-events-none opacity-20"></div>
      <div className="scanner-beam pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/4"></div>

      <header className="relative z-10 h-14 border-b border-emerald-900/40 glass-panel px-6 flex items-center shrink-0">
        <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <div className="w-4 h-1.5 bg-black rounded-sm"></div>
        </div>
        <span className="font-bold tracking-tight font-display text-white text-xl mt-0.5" style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
          Portfolio<span className="text-emerald-500">OS</span>
        </span>
      </header>
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 selection:bg-emerald-500/30 relative z-10">
        <div className="max-w-[1600px] mx-auto perspective-1000">
          <PortfolioTable />
        </div>
      </main>
    </div>
  );
}
