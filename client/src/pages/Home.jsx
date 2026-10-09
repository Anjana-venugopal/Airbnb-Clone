import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState('Checking backend connection...');

  useEffect(() => {
    api.get('/health')
      .then((res) => setBackendStatus(`Connected: ${res.data.message}`))
      .catch((err) => setBackendStatus(`Disconnected: ${err.message}`));
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-900">Frontend Scaffolding Complete (Day 8)</h1>
        <p className="mt-2 text-gray-600">
          Backend Status: <span className="font-semibold text-emerald-600">{backendStatus}</span>
        </p>
      </div>
    </main>
  );
}
