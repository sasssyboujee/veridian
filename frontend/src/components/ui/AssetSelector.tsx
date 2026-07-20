import React from 'react';
import { OnChainAsset } from '@/types/asset';
import { Button } from './Button';

interface AssetSelectorProps {
  assets: OnChainAsset[];
  selectedAsset: OnChainAsset | null;
  onSelect: (asset: OnChainAsset) => void;
  variant?: 'dropdown' | 'tabs';
  placeholder?: string;
  // Specific prop for Dropdown variant to show "idx" prefix or similar
  displayPrefix?: string;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedAsset,
  onSelect,
  variant = 'tabs',
  placeholder = 'SELECT ASSET',
  displayPrefix = ''
}) => {
  if (assets.length === 0) {
    return (
      <div style={{ color: 'var(--color-accent)', fontStyle: 'italic', fontSize: '0.9rem' }}>
        No assets available.
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div style={{ position: 'relative' }}>
        <select 
          value={selectedAsset?.address || ''} 
          onChange={(e) => {
            const selected = assets.find(a => a.address === e.target.value);
            if (selected) onSelect(selected);
          }}
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            padding: '10px 40px 10px 20px', 
            borderRadius: '100px', 
            border: 'none', 
            color: 'var(--color-bg-dark)', 
            fontWeight: 700, 
            appearance: 'none', 
            cursor: 'pointer', 
            outline: 'none', 
            fontFamily: 'var(--font-tech)', 
            boxShadow: '0 4px 12px rgba(0, 128, 128, 0.3)' 
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {assets.map(asset => (
            <option key={asset.address} value={asset.address}>
              {displayPrefix}{asset.symbol}
            </option>
          ))}
        </select>
        <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    );
  }

  // Tabs variant
  return (
    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
      {assets.map((asset) => (
        <Button 
          key={asset.address}
          variant={selectedAsset?.address === asset.address ? 'primary' : 'secondary'}
          onClick={() => onSelect(asset)}
          style={{ minWidth: '120px' }}
        >
          {displayPrefix}{asset.symbol.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};
