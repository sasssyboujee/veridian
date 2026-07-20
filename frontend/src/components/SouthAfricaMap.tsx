"use client";
import React, { useEffect, useState } from 'react';

// Relative coordinates for some SA regions [x, y] in percentages
const REGIONS = [
  { name: "Cape Town", top: "85%", left: "20%" },
  { name: "Johannesburg", top: "35%", left: "65%" },
  { name: "Durban", top: "60%", left: "80%" },
  { name: "Port Elizabeth", top: "80%", left: "55%" },
  { name: "Bloemfontein", top: "55%", left: "50%" },
  { name: "Upington", top: "50%", left: "30%" }
];

export default function SouthAfricaMap() {
  const [particles, setParticles] = useState<{id: number, top: string, left: string, targetX: string, targetY: string, delay: number}[]>([]);

  useEffect(() => {
    // Generate particles that flow from nodes to center
    const newParticles: any[] = [];
    let idCounter = 0;
    
    // To make the math easier for CSS transform, we calculate the distance to 50% 50% 
    // We will just let the map container be standard size and use percentages
    
    REGIONS.forEach((region) => {
      // Create 4 particles per region with different delays
      for (let i = 0; i < 4; i++) {
        const startY = parseFloat(region.top);
        const startX = parseFloat(region.left);
        
        // Target is center (50%, 50%)
        const diffX = 50 - startX;
        const diffY = 50 - startY;
        
        newParticles.push({
          id: idCounter++,
          top: region.top,
          left: region.left,
          // CSS translates relative to the element's width, which is 4px.
          // To move across the container (e.g. 50% of container width), 
          // we need a multiplier or we can just use fixed container pixels.
          // Let's use a simpler approach: the animation uses CSS variables.
          // We assume a ~600px wide container for math. 600 * 50% = 300px.
          // Better: we can just animate top/left directly instead of transform for particles!
          targetX: "", // unused if animating top/left
          targetY: "",
          delay: Math.random() * 3
        });
      }
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative w-full h-64 md:h-80 bg-[#121418] rounded-xl border border-neutral/20 overflow-hidden flex items-center justify-center p-4">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgwVjB6bTEgMWgxOHYxOEgxVjF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-40"></div>

      {/* Abstract Map Outline (Optional, just regions are fine, but an SVG is cooler) */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
         {/* Very rough polygon of SA */}
         <polygon points="20,80 15,60 30,40 50,30 70,30 85,45 80,65 60,85 40,85" fill="var(--color-primary)" />
      </svg>

      {/* Title */}
      <div className="absolute top-4 left-4 z-30">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          Live Asset Pooling
        </h3>
        <p className="text-[10px] text-gray-500 font-mono mt-1">REAL-TIME YIELD AGGREGATION</p>
      </div>

      {/* The Central Pool Node */}
      <div className="pool-node group z-20">
        <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-bold text-accent opacity-75 group-hover:opacity-100 transition-opacity font-mono tracking-widest">
          CENTRAL LIQUIDITY POOL
        </div>
      </div>

      {/* Regional Nodes */}
      {REGIONS.map((region, i) => (
        <div key={i} className="absolute group z-10" style={{ top: region.top, left: region.left }}>
          <div className="map-node"></div>
          <div className="absolute top-3 -left-4 text-[9px] text-gray-400 font-mono whitespace-nowrap opacity-60 group-hover:opacity-100 group-hover:text-primary transition-colors bg-bg-dark/80 px-1 rounded">
            {region.name}
          </div>
        </div>
      ))}

      {/* Flowing Particles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flowToCenter {
          0% { transform: scale(1); opacity: 1; offset-distance: 0%; }
          100% { transform: scale(0.2); opacity: 0; offset-distance: 100%; top: 50%; left: 50%; }
        }
      `}} />
      
      {particles.map((p) => (
        <div 
          key={p.id} 
          className="absolute w-1.5 h-1.5 bg-success rounded-full z-15"
          style={{ 
            top: p.top, 
            left: p.left,
            animation: `flowToCenter 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1)`,
            animationDelay: `${p.delay}s`,
            boxShadow: '0 0 8px var(--color-success)'
          }}
        ></div>
      ))}
    </div>
  );
}
