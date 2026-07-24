import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from './ui/Card';

export interface YieldData {
  net_yield: string | number;
  champions_fee: string | number;
  opportunity_fee: string | number;
  core_fee: string | number;
}

interface YieldWaterfallProps {
  latestYield: YieldData;
}

export function YieldWaterfall({ latestYield }: YieldWaterfallProps) {
  if (!latestYield) return null;

  return (
    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-neutral)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
        <Activity color="var(--color-tertiary)" size={24} />
        <h3 className="text-h2" style={{ color: 'var(--color-tertiary)' }}>Automated Yield Distribution (75/8/7/5/5 Waterfall)</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <Card style={{ padding: '1.5rem', border: '1px solid var(--color-success)', backgroundColor: 'rgba(110,250,95,0.05)' }}>
          <div className="text-small" style={{ color: 'var(--color-success)', marginBottom: '8px', fontWeight: 600 }}>INVESTOR NET YIELD (75%)</div>
          <div style={{ fontSize: '2rem', color: 'var(--color-success)', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            ${Number(latestYield.net_yield).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{fontSize: '1rem'}}>USDC</span>
          </div>
        </Card>
        <Card style={{ padding: '1.5rem', border: '1px solid var(--color-primary)' }}>
          <div className="text-small" style={{ color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>O&M (8%)</div>
          <div style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            ${(Number(latestYield.champions_fee) * (8/15)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{fontSize: '1rem'}}>USDC</span>
          </div>
        </Card>
        <Card style={{ padding: '1.5rem', border: '1px solid var(--color-primary)' }}>
          <div className="text-small" style={{ color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>RESERVES (7%)</div>
          <div style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            ${(Number(latestYield.champions_fee) * (7/15)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{fontSize: '1rem'}}>USDC</span>
          </div>
        </Card>
        <Card style={{ padding: '1.5rem', border: '1px solid var(--color-primary)' }}>
          <div className="text-small" style={{ color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>EXPANSION FUND (5%)</div>
          <div style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            ${Number(latestYield.opportunity_fee).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{fontSize: '1rem'}}>USDC</span>
          </div>
        </Card>
        <Card style={{ padding: '1.5rem', border: '1px solid var(--color-primary)' }}>
          <div className="text-small" style={{ color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>PLATFORM FEE (5%)</div>
          <div style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            ${Number(latestYield.core_fee).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{fontSize: '1rem'}}>USDC</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
