"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, Plus, RefreshCw, Coins, ShieldAlert, ShieldCheck, Shield, Terminal } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';

// Reliable TopoJSON source for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface AssetNode {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'agri' | 'logistics';
  region: 'ZA' | 'NA' | 'EU' | 'AU';
  coordinates: [number, number]; // [Longitude, Latitude]
  capacity: string;
  status: 'new' | 'pooling' | 'pooled';
  value: number;
  tpmStatus: 'verified' | 'warning' | 'compromised';
}

const REGION_NAMES = {
  ZA: 'South Africa',
  NA: 'North America',
  EU: 'Europe',
  AU: 'Australia'
};

// [Longitude, Latitude]
const INITIAL_POOLS = {
  ZA: { name: "ZA Regional Pool", coordinates: [24.0, -29.0], assets: 75 },
  NA: { name: "NA Infrastructure Pool", coordinates: [-95.0, 38.0], assets: 75 },
  EU: { name: "EU Green Energy Pool", coordinates: [10.0, 48.0], assets: 75 },
  AU: { name: "AU Agriculture Pool", coordinates: [134.0, -24.0], assets: 75 }
};

// Helper to dynamically generate hundreds of nodes for a dense map aesthetic
const generateDenseAssets = (): AssetNode[] => {
  const generated: AssetNode[] = [];
  const types = ['solar', 'wind', 'agri', 'logistics'] as const;
  
  let idCounter = 1000;
  
  for (const [regionKey, pool] of Object.entries(INITIAL_POOLS)) {
    const poolCenter = pool.coordinates;
    for (let i = 0; i < pool.assets; i++) {
      // Gaussian distribution around the pool center for organic clustering
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      
      const offsetLng = z0 * 1.5; // Tighter 1.5 degree spread to stay on landmasses
      const offsetLat = z1 * 1.5;
      
      const type = types[Math.floor(Math.random() * types.length)];
      
      // 85% verified, 10% warning, 5% compromised
      const statusRoll = Math.random();
      const tpmStatus = statusRoll > 0.95 ? 'compromised' : (statusRoll > 0.85 ? 'warning' : 'verified');
      
      generated.push({
        id: (idCounter++).toString(),
        name: `${regionKey}-${type.toUpperCase()} Node ${idCounter}`,
        type,
        region: regionKey as any,
        coordinates: [poolCenter[0] + offsetLng, poolCenter[1] + offsetLat],
        capacity: `${Math.floor(Math.random() * 500 + 100)} kW`,
        status: 'pooled',
        value: Math.floor(Math.random() * 50000 + 10000),
        tpmStatus
      });
    }
  }
  return generated;
};

export default function AssetMapPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [initialAssets, setInitialAssets] = useState<AssetNode[]>([]);
  const [assets, setAssets] = useState<AssetNode[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  
  // Cinematic Map State
  const [mapPosition, setMapPosition] = useState<{ coordinates: [number, number], zoom: number }>({ coordinates: [10, 10], zoom: 1 });

  // Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'solar' | 'wind' | 'agri' | 'logistics'>('solar');
  const [newRegion, setNewRegion] = useState<'ZA' | 'NA' | 'EU' | 'AU'>('ZA');
  const [newCapacity, setNewCapacity] = useState('500 kW');
  const [newValue, setNewValue] = useState(50000);

  // Demo Lifecycle States
  const [demoStep, setDemoStep] = useState<1 | 2 | 3>(1);
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);
  const [payoutLogs, setPayoutLogs] = useState<{investors: number, opsMaint: number, insurance: number, expansion: number, platform: number}>({ investors: 0, opsMaint: 0, insurance: 0, expansion: 0, platform: 0 });
  const [showPayoutAnimation, setShowPayoutAnimation] = useState(false);
  const [clickedAssetId, setClickedAssetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate random data ONCE on client mount to avoid React SSR Hydration errors
  useEffect(() => {
    const generated = generateDenseAssets();
    setInitialAssets(generated);
    setAssets(generated);
    setIsMounted(true);
  }, []);

  const getTpmColor = (status: string) => {
    switch (status) {
      case 'verified': return "#34d399"; // emerald-400
      case 'warning': return "#fbbf24"; // amber-400
      case 'compromised': return "#ef4444"; // red-500
      default: return "#94a3b8";
    }
  };

  const handleRegionChange = (regionKey: string) => {
    setFilterRegion(regionKey);
    if (regionKey === 'all') {
      setMapPosition({ coordinates: [10, 10], zoom: 1 });
    } else {
      const coords = INITIAL_POOLS[regionKey as keyof typeof INITIAL_POOLS].coordinates;
      setMapPosition({ coordinates: coords as [number, number], zoom: 5 }); // Cinematic close up zoom
    }
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return alert("Please enter asset name.");

    // Auto-focus the map on the region we are deploying to
    handleRegionChange(newRegion);

    const regionCenter = INITIAL_POOLS[newRegion].coordinates;
    const offsetLng = (Math.random() - 0.5) * 8;
    const offsetLat = (Math.random() - 0.5) * 8;

    const newAsset: AssetNode = {
      id: Date.now().toString(),
      name: newName,
      type: newType,
      region: newRegion,
      coordinates: [regionCenter[0] + offsetLng, regionCenter[1] + offsetLat],
      capacity: newCapacity,
      status: 'new',
      value: newValue,
      tpmStatus: 'verified' // Start as verified
    };

    setAssets(prev => [...prev, newAsset]);
    setCreatedAssetId(newAsset.id);
    setNewName('');
    setDemoStep(2);
  };

  const handleInitiatePooling = () => {
    if (!createdAssetId) return;
    
    setAssets(prev => prev.map(a => {
      if (a.id === createdAssetId) {
        return { ...a, status: 'pooling' };
      }
      return a;
    }));

    setTimeout(() => {
      setAssets(prev => prev.map(a => {
        if (a.id === createdAssetId) {
          return { ...a, status: 'pooled' };
        }
        return a;
      }));
      setDemoStep(3); 
    }, 2500); 
  };

  const handleTriggerPayout = () => {
    setShowPayoutAnimation(true);
    let count = 0;

    const interval = setInterval(() => {
      count += 50;
      setPayoutLogs({
        investors: count * 0.75,
        opsMaint: count * 0.08,
        insurance: count * 0.07,
        expansion: count * 0.05,
        platform: count * 0.05
      });
      if (count >= 1000) {
        clearInterval(interval);
        setTimeout(() => setShowPayoutAnimation(false), 3000);
      }
    }, 100);
  };

  const handleResetDemo = () => {
    setAssets(initialAssets);
    setCreatedAssetId(null);
    setDemoStep(1);
    setPayoutLogs({ investors: 0, opsMaint: 0, insurance: 0, expansion: 0, platform: 0 });
    setShowPayoutAnimation(false);
    handleRegionChange('all');
  };

  const filteredAssets = assets.filter(a => {
    const matchType = filterType === 'all' || a.type === filterType;
    const matchRegion = filterRegion === 'all' || a.region === filterRegion;
    return matchType && matchRegion;
  });

  if (!isMounted) return null; // Avoid SSR hydration mismatches with random SVGs

  return (
    <div style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh', color: 'var(--color-tertiary)' }}>
      {/* 
        Glassmorphism hack for the background: 
        We rely on the map being large, but Next.js usually constrains main.
        We'll keep the standard layout but add heavy backdrop filters to the cards.
      */}

      <main style={{ padding: '3rem 1.5rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }} className="investor-main">
        
        {/* Header Block */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="map-header">
          <div>
            <h1 className="text-h1 glow-text">Asset Command Center</h1>
            <p className="text-body" style={{ color: 'var(--color-accent)', marginTop: '0.5rem' }}>
              High-Density Topology, TPM security monitoring, and dynamic spatial yields.
            </p>
          </div>
          
          <Button variant="secondary" onClick={handleResetDemo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> RESET DEMO
          </Button>
        </div>

        <div className="responsive-grid-sidebar">
          
          {/* LEFT PANEL: Interactive Demo Lifecycle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Step Indicators (Glassmorphism) */}
            <div className="border border-[#008080]/30 rounded-xl p-6 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60 flex flex-col gap-4">
              <h3 className="text-xs tracking-widest uppercase text-[#008080] font-bold">LIFECYCLE PROGRESS</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: demoStep === 1 ? 1 : 0.5 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: demoStep === 1 ? 'var(--color-primary)' : 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>1</div>
                  <span className="text-sm font-mono" style={{ fontWeight: demoStep === 1 ? 'bold' : 'normal' }}>Deploy Secure IoT Device</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: demoStep === 2 ? 1 : 0.5 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: demoStep === 2 ? 'var(--color-primary)' : 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>2</div>
                  <span className="text-sm font-mono" style={{ fontWeight: demoStep === 2 ? 'bold' : 'normal' }}>Connect to Network Web</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: demoStep === 3 ? 1 : 0.5 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: demoStep === 3 ? 'var(--color-primary)' : 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>3</div>
                  <span className="text-sm font-mono" style={{ fontWeight: demoStep === 3 ? 'bold' : 'normal' }}>Simulate Yield Distribution</span>
                </div>
              </div>
            </div>

            {/* Stage 1 Form (Glassmorphism) */}
            {demoStep === 1 && (
              <div className="border border-[#008080]/30 rounded-xl p-6 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                  <Plus size={20} className="text-[#008080]" />
                  1. Deploy IoT Hardware
                </h2>
                <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="text-xs tracking-widest text-[#008080] block mb-2" style={{ display: 'block', marginBottom: '8px' }}>ASSET NAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Western Cape Solar Array 5"
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', backgroundColor: '#111827', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#008080'}
                      onBlur={e => e.target.style.borderColor = '#374151'}
                    />
                  </div>

                  <div className="map-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="text-xs tracking-widest text-[#008080] block mb-2" style={{ display: 'block', marginBottom: '8px' }}>ASSET TYPE</label>
                      <select 
                        value={newType} 
                        onChange={e => setNewType(e.target.value as any)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', backgroundColor: '#111827', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#008080'}
                        onBlur={e => e.target.style.borderColor = '#374151'}
                      >
                        <option value="solar">Solar Panel</option>
                        <option value="wind">Windmill</option>
                        <option value="agri">Agri Tractor</option>
                        <option value="logistics">Truck Fleet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs tracking-widest text-[#008080] block mb-2" style={{ display: 'block', marginBottom: '8px' }}>REGION</label>
                      <select 
                        value={newRegion} 
                        onChange={e => setNewRegion(e.target.value as any)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', backgroundColor: '#111827', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#008080'}
                        onBlur={e => e.target.style.borderColor = '#374151'}
                      >
                        <option value="ZA">South Africa</option>
                        <option value="NA">North America</option>
                        <option value="EU">Europe</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>

                  <div className="map-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="text-xs tracking-widest text-[#008080] block mb-2" style={{ display: 'block', marginBottom: '8px' }}>CAPACITY</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 500 kW"
                        value={newCapacity} 
                        onChange={e => setNewCapacity(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', backgroundColor: '#111827', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#008080'}
                        onBlur={e => e.target.style.borderColor = '#374151'}
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-widest text-[#008080] block mb-2" style={{ display: 'block', marginBottom: '8px' }}>VALUE (USD)</label>
                      <input 
                        type="number" 
                        value={newValue} 
                        onChange={e => setNewValue(Number(e.target.value))} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', backgroundColor: '#111827', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#008080'}
                        onBlur={e => e.target.style.borderColor = '#374151'}
                      />
                    </div>
                  </div>

                  <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>ONBOARD & DEPLOY</Button>
                </form>
              </div>
            )}

            {/* Stage 2 Action */}
            {demoStep === 2 && (
              <div className="border border-[#008080]/30 rounded-xl p-6 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60 animate-fade-in">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Database size={20} className="text-[#008080]" />
                  2. Network Connection
                </h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed font-mono">
                  The hardware asset has been successfully pinged and its TPM checks passed. 
                  Now, initiate the network bridge to connect the asset into the regional web and unlock liquidity.
                </p>
                <Button onClick={handleInitiatePooling} style={{ width: '100%' }}>ESTABLISH WEB LINK</Button>
              </div>
            )}

            {/* Stage 3 Action */}
            {demoStep === 3 && (
              <div className="border border-[#008080]/30 rounded-xl p-6 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60 animate-fade-in">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Coins size={20} className="text-[#34d399]" />
                  3. Distribute Yield
                </h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed font-mono">
                  The physical asset is now connected into the overarching Web structure. 
                  Simulate physical revenue generation being dynamically split to stakeholders.
                </p>

                <Button onClick={handleTriggerPayout} style={{ width: '100%', marginBottom: '2rem' }}>TRIGGER $1,000 YIELD</Button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-neutral)', paddingBottom: '0.5rem' }}>
                    <span className="text-sm text-gray-400">75% Investors:</span>
                    <span className="text-body font-mono text-[#34d399]" style={{ fontWeight: 'bold' }}>${payoutLogs.investors.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-neutral)', paddingBottom: '0.5rem' }}>
                    <span className="text-sm text-gray-400">8% Operations & Maint.:</span>
                    <span className="text-body font-mono text-[#008080]" style={{ fontWeight: 'bold' }}>${payoutLogs.opsMaint.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-neutral)', paddingBottom: '0.5rem' }}>
                    <span className="text-sm text-gray-400">7% Insurance & Reserves:</span>
                    <span className="text-body font-mono text-gray-300" style={{ fontWeight: 'bold' }}>${payoutLogs.insurance.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-neutral)', paddingBottom: '0.5rem' }}>
                    <span className="text-sm text-gray-400">5% Expansion:</span>
                    <span className="text-body font-mono text-blue-400" style={{ fontWeight: 'bold' }}>${payoutLogs.expansion.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-neutral)', paddingBottom: '0.5rem' }}>
                    <span className="text-sm text-gray-400">5% Platform Operations:</span>
                    <span className="text-body font-mono text-purple-400" style={{ fontWeight: 'bold' }}>${payoutLogs.platform.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Asset Details Panel */}
            {clickedAssetId && (() => {
              const selectedAsset = assets.find(a => a.id === clickedAssetId);
              if (!selectedAsset) return null;
              return (
                <div className="border border-[#008080]/30 rounded-xl p-6 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60 animate-fade-in mt-2">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                    <Database size={20} className="text-[#008080]" />
                    Asset Details
                  </h2>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between border-b border-[#1a4040] pb-2">
                      <span className="text-sm text-gray-400">Name:</span>
                      <span className="text-sm font-bold text-white truncate max-w-[180px] text-right">{selectedAsset.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1a4040] pb-2">
                      <span className="text-sm text-gray-400">Type:</span>
                      <span className="text-sm font-mono text-gray-200">{selectedAsset.type.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1a4040] pb-2">
                      <span className="text-sm text-gray-400">Capacity:</span>
                      <span className="text-sm font-mono text-gray-200">{selectedAsset.capacity}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1a4040] pb-2">
                      <span className="text-sm text-gray-400">Value:</span>
                      <span className="text-sm font-mono text-[#6EFA5F]">${selectedAsset.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1a4040] pb-2">
                      <span className="text-sm text-gray-400">TPM Status:</span>
                      <span className="text-sm font-mono font-bold" style={{ color: getTpmColor(selectedAsset.tpmStatus) }}>
                        {selectedAsset.tpmStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* RIGHT PANEL: Global Geographic Map Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            
            {/* Filters Toggles (Glassmorphism) */}
            <div className="border border-[#008080]/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl bg-[#0a1919]/60 flex gap-8 flex-wrap items-center relative z-10">
            <div className="map-filters" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="text-xs tracking-widest text-[#008080]">ASSET FIELD:</span>
                <div className="map-filter-buttons" style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                  {['all', 'solar', 'wind', 'agri', 'logistics'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setFilterType(t)}
                      style={{ 
                        padding: '6px 16px', 
                        borderRadius: '6px', 
                        border: 'none', 
                        backgroundColor: filterType === t ? 'var(--color-primary)' : 'transparent', 
                        color: filterType === t ? '#000' : 'var(--color-accent)',
                        cursor: 'pointer',
                        fontWeight: filterType === t ? 'bold' : 'normal',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-tech)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="text-xs tracking-widest text-[#008080]">REGION:</span>
                <div className="map-filter-buttons" style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                  {['all', 'ZA', 'NA', 'EU', 'AU'].map((r) => (
                    <button 
                      key={r}
                      onClick={() => handleRegionChange(r)}
                      style={{ 
                        padding: '6px 16px', 
                        borderRadius: '6px', 
                        border: 'none', 
                        backgroundColor: filterRegion === r ? 'var(--color-primary)' : 'transparent', 
                        color: filterRegion === r ? '#000' : 'var(--color-accent)',
                        cursor: 'pointer',
                        fontWeight: filterRegion === r ? 'bold' : 'normal',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-tech)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {r === 'all' ? 'GLOBAL' : REGION_NAMES[r as keyof typeof REGION_NAMES] || r}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="map-container" style={{ height: '700px', position: 'relative', border: '1px solid rgba(0,128,128,0.3)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 50px rgba(0,128,128,0.15)', backgroundColor: '#0A0D10' }}>
              
              {/* Zoom Controls */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => setMapPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 10) }))}
                  style={{ backgroundColor: 'rgba(10,25,25,0.8)', border: '1px solid #008080', color: '#008080', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
                <button 
                  onClick={() => setMapPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }))}
                  style={{ backgroundColor: 'rgba(10,25,25,0.8)', border: '1px solid #008080', color: '#008080', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  -
                </button>
              </div>

              {/* Subtle Grid Background */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQwIDBoLTQwXY0MGg0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]"></div>

              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 120, center: [10, 10] }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup 
                  zoom={mapPosition.zoom} 
                  center={mapPosition.coordinates}
                  onMoveStart={() => setIsDragging(true)}
                  onMoveEnd={(position) => {
                    setIsDragging(false);
                    setMapPosition({ coordinates: position.coordinates, zoom: position.zoom });
                  }}
                  style={{ transition: isDragging ? 'none' : 'transform 800ms ease-in-out' }}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#0F171A"
                          stroke="#008080"
                          strokeWidth={0.3}
                          strokeOpacity={0.3}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#132124", outline: "none", transition: "all 250ms" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {/* Draw Hub & Spoke Web Topology Lines */}
                  {filteredAssets.map(asset => {
                    const poolCoords = INITIAL_POOLS[asset.region].coordinates as [number, number];
                    
                    // Connected/Active links (Faint neural network look)
                    if (asset.status === 'pooled') {
                      return (
                        <Line
                          key={`web-line-${asset.id}`}
                          from={asset.coordinates}
                          to={poolCoords}
                          stroke={getTpmColor(asset.tpmStatus)}
                          strokeWidth={0.2}
                          strokeOpacity={0.2}
                          style={{ vectorEffect: 'non-scaling-stroke' }} // Keeps lines thin even when zoomed
                        />
                      );
                    }
                    // Currently establishing link
                    if (asset.status === 'pooling') {
                      return (
                        <Line
                          key={`web-line-${asset.id}`}
                          from={asset.coordinates}
                          to={poolCoords}
                          stroke="#22d3ee" // Cyan connection beam
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          className="animate-pulse"
                          style={{ vectorEffect: 'non-scaling-stroke' }}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Pool Markers (The Hubs with Radar pulses) */}
                  {Object.entries(INITIAL_POOLS).map(([key, pool]) => {
                    if (filterRegion !== 'all' && filterRegion !== key) return null;
                    return (
                      <Marker key={key} coordinates={pool.coordinates as [number, number]}>
                        
                        {/* Radar Pulses */}
                        <circle r={25} fill="none" stroke="#008080" strokeWidth={1} className="animate-ping" style={{ animationDuration: '3s' }} vectorEffect="non-scaling-stroke" />
                        <circle r={15} fill="#008080" fillOpacity={0.2} stroke="#008080" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                        
                        {/* Core Hub */}
                        <circle r={4} fill="#008080" />
                        
                        {/* Payout Particles */}
                        {showPayoutAnimation && (
                          <g>
                            {[...Array(24)].map((_, i) => (
                              <circle
                                key={`p-${i}`}
                                r={1.5}
                                fill="#6EFA5F"
                                className="animate-ping"
                                style={{
                                  animationDelay: `${Math.random() * 2}s`,
                                  animationDuration: '1.5s',
                                  vectorEffect: 'non-scaling-stroke'
                                }}
                              />
                            ))}
                          </g>
                        )}

                        <text
                          textAnchor="middle"
                          y={-12}
                          style={{ fontFamily: "var(--font-tech)", fill: "#fff", fontSize: "4px", fontWeight: "bold" }}
                        >
                          {pool.name}
                        </text>
                      </Marker>
                    );
                  })}

                  {/* Individual Asset Nodes */}
                  {filteredAssets.map((asset) => {
                    let fillColor = getTpmColor(asset.tpmStatus);
                    
                    // Smooth Resizing logic: Base radius / Zoom level (keeps dots tiny when zoomed in)
                    let r = Math.max(0.5, 2.5 / mapPosition.zoom); 
                    let stroke = "none";

                    if (asset.status === 'new') {
                      fillColor = "#22d3ee"; // Cyber Cyan
                      r = Math.max(1, 4 / mapPosition.zoom);
                      stroke = "#fff";
                    } else if (asset.tpmStatus !== 'verified') {
                      r = Math.max(1, 3.5 / mapPosition.zoom); // Make compromised nodes slightly larger to stand out
                    }

                    // Hover tooltips rendered as foreignObjects on top of the SVG elements
                    return (
                      <Marker 
                        key={asset.id} 
                        coordinates={asset.coordinates}
                        onClick={() => setClickedAssetId(asset.id === clickedAssetId ? null : asset.id)}
                        style={{ default: { cursor: 'pointer', outline: 'none' }, hover: { cursor: 'pointer', outline: 'none' }, pressed: { cursor: 'pointer', outline: 'none' } }}
                      >
                        <circle r={r} fill={fillColor} stroke={stroke} strokeWidth={0.5} className={asset.status === 'new' ? 'animate-bounce' : ''} />
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>

            </div>

            {/* Bottom Legend (TPM Status Based) */}
            <div className="map-legend" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }}></div>
                <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>New Deployment</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>TPM Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="#fbbf24" />
                <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Latency Warning</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="#ef4444" />
                <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Hardware Compromised</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
