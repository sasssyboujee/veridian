'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { WalletConnect } from '@/components/WalletConnect';
import { Sun, Tractor, Wind, ShieldCheck, MapPin, Activity, AlertCircle, CheckCircle2, FileCheck2, UserCheck, Scale, Factory, Box, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther, parseEther, decodeEventLog } from 'viem';
import { CONTRACT_ADDRESSES, MockUSDC_ABI, RWAFactory_ABI } from '@/lib/contracts';
import { fetchAssets, fetchTelemetrySummary, fetchTelemetryLogs } from '@/lib/api';
import { AssetSelector } from '@/components/ui/AssetSelector';
import { OnChainAsset } from '@/types/asset';

const mockYieldData = [
  { month: 'Jan', yield: 1200 },
  { month: 'Feb', yield: 1450 },
  { month: 'Mar', yield: 1300 },
  { month: 'Apr', yield: 1600 },
  { month: 'May', yield: 1850 },
  { month: 'Jun', yield: 2100 },
];

export default function OperationsPortal() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'issue'>('dashboard');
  
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  });

  const activeAssets = assets?.filter(a => a.status === 'active') || [];
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<OnChainAsset | null>(null);

  useEffect(() => {
    if (activeAssets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(activeAssets[0].id);
    }
  }, [activeAssets, selectedAssetId]);

  const activeTelemetryAsset = activeAssets.find(a => a.id === selectedAssetId) || activeAssets[0];
  // For escrow tab using OnChainAsset array
  const currentAsset = selectedAsset || (activeAssets.length > 0 ? (activeAssets[0] as unknown as OnChainAsset) : null);

  const { address } = useAccount();

  // --- DASHBOARD TAB STATE ---
  const queryClient = useQueryClient();
  const [oraclePayload, setOraclePayload] = useState<string | null>(null);
  const [isSlashing, setIsSlashing] = useState(false);
  const [isFetchingOracle, setIsFetchingOracle] = useState(false);

  const simulateTampering = async () => {
    if (!activeTelemetryAsset) return;
    setIsSlashing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/assets/${activeTelemetryAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stake_slashed: true, operator_stake_balance: 0 }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['assets'] });
      }
    } catch (e) {
      console.error(e);
    }
    setIsSlashing(false);
  };

  const triggerOracle = async () => {
    if (!activeTelemetryAsset) return;
    setIsFetchingOracle(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/yields/oracle/${activeTelemetryAsset.id}?api_key=dev-oracle-key-123`);
      if (res.ok) {
        const data = await res.json();
        setOraclePayload(JSON.stringify(data, null, 2));
      } else {
        setOraclePayload('// Error: Oracle Payload not available for this asset yet.');
      }
    } catch (e) {
      console.error(e);
      setOraclePayload('// Error fetching oracle data.');
    }
    setIsFetchingOracle(false);
  };

  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MockUSDC as `0x${string}`,
    abi: MockUSDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 }
  });

  const formattedUSDC = usdcBalance !== undefined ? Number(formatEther(usdcBalance as bigint)).toLocaleString() : '0';

  const { data: telemetrySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['telemetrySummary', activeTelemetryAsset?.id],
    queryFn: () => fetchTelemetrySummary(activeTelemetryAsset!.id),
    enabled: !!activeTelemetryAsset,
  });

  const { data: telemetryLogs } = useQuery({
    queryKey: ['telemetryLogs', activeTelemetryAsset?.id],
    queryFn: () => fetchTelemetryLogs(activeTelemetryAsset!.id),
    enabled: !!activeTelemetryAsset,
    refetchInterval: 5000,
  });

  const totalHoldings = assets?.reduce((sum, asset) => sum + (Number(asset.total_token_supply || 0) * 100), 0) || 0;
  const recentLog = telemetryLogs?.[0];

  const getIconForAsset = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('solar') || lower.includes('energy')) return <Sun size={18} />;
    if (lower.includes('farm') || lower.includes('harvest')) return <Tractor size={18} />;
    if (lower.includes('wind')) return <Wind size={18} />;
    if (lower.includes('real estate')) return <MapPin size={18} />;
    if (lower.includes('logistic')) return <Activity size={18} />;
    if (lower.includes('data') || lower.includes('datacenter')) return <Activity size={18} />;
    return <ShieldCheck size={18} />;
  };

  const getLocationForAsset = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('solar')) return 'Nevada, US';
    if (lower.includes('farm')) return 'Iowa, US';
    return 'Global';
  };

  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  useEffect(() => {
    if (recentLog?.tpm_signature) {
      setTerminalLines(prev => {
        const newLine = `> SIGNATURE_VERIFIED: ${recentLog.tpm_signature.substring(0, 24)}...`;
        const updated = [...prev, newLine];
        return updated.slice(-4);
      });
    }
  }, [recentLog]);



  // --- ISSUE TAB STATE ---
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('10000');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Please connect your wallet first.");
    
    setStatus('submitting');
    
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.RWAFactory as `0x${string}`,
        abi: RWAFactory_ABI,
        functionName: 'createAsset',
        args: [name, symbol, parseEther(supply)]
      });
      
      let tokenAddress = '';
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: RWAFactory_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'AssetCreated') {
              tokenAddress = (decoded.args as any).assetAddress;
              break;
            }
          } catch (e) {
            // Ignore other events
          }
        }
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/assets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          description: `Securitized RWA token representing ${name}`,
          token_address: tokenAddress || null,
          spv_entity: "Veridian SPV LLC",
          jurisdiction: "US",
          asset_type: "equipment",
          total_token_supply: Number(supply),
          status: "active",
          metadata: {}
        })
      });
      
      setStatus('success');
    } catch (error) {
      console.error(error);
      alert('Transaction failed. You must pass KYC first.');
      setStatus('idle');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-neutral)', padding: '4rem 2rem 2rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Logo size={80} color="#FFFFFF" />
          </div>
          <h1 className="text-h1 glow-text" style={{ marginBottom: '1.5rem' }}>
            Operations Portal
          </h1>
          <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '2rem', margin: '0 auto', maxWidth: '600px' }}>
            Manage asset telemetry, oversee legal multi-sig escrow, and initialize new asset tokenization tranches.
          </p>

          {/* Internal Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <Button variant={activeTab === 'dashboard' ? 'primary' : 'secondary'} onClick={() => setActiveTab('dashboard')}>
              LESSEE BILLING
            </Button>
            <Button variant={activeTab === 'issue' ? 'primary' : 'secondary'} onClick={() => setActiveTab('issue')}>
              INITIALIZE ASSET
            </Button>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1280px', width: '100%' }}>
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div>
                  <h2 className="text-h2" style={{ color: 'var(--color-tertiary)' }}>Lessee Billing & Telemetry</h2>
                  <p className="text-small" style={{ color: 'var(--color-accent)', marginTop: '0.5rem' }}>Monitor real-time consumption and maintenance bonds.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(118, 185, 0, 0.1)', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(118, 185, 0, 0.3)' }}>
                  <Activity size={16} color="var(--color-primary)" />
                  <span className="text-small" style={{ color: 'var(--color-primary)' }}>LIVE NETWORK: BASE SEPOLIA</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <Card className="tech-border hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>TOTAL PORTFOLIO VALUE</h3>
                  <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', lineHeight: 1 }}>
                    ${totalHoldings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </Card>
                <Card className="tech-border hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid var(--color-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>AVAILABLE LIQUIDITY</h3>
                      <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--color-tertiary)', fontFamily: 'var(--font-tech)', lineHeight: 1 }}>
                        {formattedUSDC} <span style={{ fontSize: '1.5rem', color: 'var(--color-accent)' }}>USDC</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Left: Asset List & Telemetry */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <Card className="tech-border" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0, 191, 255, 0.2)', backgroundColor: 'rgba(0, 191, 255, 0.05)' }}>
                      <h3 className="text-h2" style={{ color: 'var(--color-tertiary)' }}>Hardware Telemetry</h3>
                      <p className="text-small" style={{ color: 'var(--color-accent)', marginTop: '0.25rem' }}>Live readings from TPM 2.0 Secure Enclaves</p>
                    </div>
                    
                    <div style={{ display: 'flex', minHeight: '400px' }}>
                      <div style={{ width: '35%', borderRight: '1px solid var(--color-neutral)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        {assetsLoading ? (
                          <div style={{ padding: '1.5rem', color: 'var(--color-accent)' }}>Loading assets...</div>
                        ) : activeAssets?.length === 0 ? (
                          <div style={{ padding: '1.5rem', color: 'var(--color-accent)' }}>No active assets.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeAssets?.map(asset => (
                              <div key={asset.id} onClick={() => setSelectedAssetId(asset.id)} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral)', cursor: 'pointer', backgroundColor: activeTelemetryAsset?.id === asset.id ? 'rgba(118,185,0,0.1)' : 'transparent', borderLeft: activeTelemetryAsset?.id === asset.id ? '4px solid var(--color-primary)' : '4px solid transparent', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ color: activeTelemetryAsset?.id === asset.id ? 'var(--color-primary)' : 'var(--color-accent)' }}>{getIconForAsset(asset.name)}</div>
                                  <div>
                                    <div className="text-body" style={{ fontWeight: 700, color: activeTelemetryAsset?.id === asset.id ? 'var(--color-tertiary)' : 'var(--color-accent)' }}>{asset.symbol || asset.name}</div>
                                    <div className="text-small" style={{ color: 'var(--color-accent)', marginTop: '4px' }}>{getLocationForAsset(asset.name)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, padding: '2.5rem' }}>
                        {activeTelemetryAsset ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 className="text-h1 glow-text" style={{ color: 'var(--color-primary)', fontSize: '1.75rem' }}>{activeTelemetryAsset.name}</h4>
                              {activeTelemetryAsset.stake_slashed ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)', backgroundColor: 'rgba(207,32,47,0.1)', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--color-error)' }}>
                                  <AlertCircle size={14} /> <span className="text-small">SLA BREACHED</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', backgroundColor: 'rgba(110,250,95,0.1)', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--color-success)' }}>
                                  <CheckCircle2 size={14} /> <span className="text-small">SLA COMPLIANT</span>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                              <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-neutral)' }}>
                                <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '8px' }}>UNITS CONSUMED</div>
                                <div style={{ fontSize: '2.25rem', color: 'var(--color-tertiary)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                                  {summaryLoading ? '...' : (telemetrySummary?.total_operating_hours?.toLocaleString() || 0)} <span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}>kWh</span>
                                </div>
                              </div>
                              <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-neutral)' }}>
                                <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '8px' }}>UTILIZATION RATE</div>
                                <div style={{ fontSize: '2.25rem', color: 'var(--color-tertiary)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                                  {summaryLoading ? '...' : ((telemetrySummary?.avg_utilization_rate || 0) * 100).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}>%</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(118, 185, 0, 0.3)', borderRadius: '12px', padding: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '0.85rem' }}>
                              <div style={{ color: 'var(--color-accent)', borderBottom: '1px dashed var(--color-neutral)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>// HRoT TPM 2.0 ENCLAVE</span>
                                <span>{activeTelemetryAsset.id.split('-')[0]}</span>
                              </div>
                              <div style={{ minHeight: '90px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {terminalLines.length === 0 ? (
                                  <div style={{ color: 'var(--color-primary)' }}>Awaiting telemetry sync...</div>
                                ) : (
                                  terminalLines.map((line, idx) => (
                                    <div key={idx} style={{ color: 'var(--color-success)', opacity: idx === terminalLines.length - 1 ? 1 : 0.6 }}>{line}</div>
                                  ))
                                )}
                                <div style={{ color: 'var(--color-success)', animation: 'blink 1s step-end infinite' }}>_</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--color-accent)', textAlign: 'center', marginTop: '6rem' }}>Select an asset to view live telemetry</div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right: Yield Chart & operator stake */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <Card className="tech-border hover-lift" style={{ padding: '2rem' }}>
                    <h3 className="text-h2" style={{ color: 'var(--color-tertiary)', marginBottom: '1.5rem' }}>Historical Yield</h3>
                    <div style={{ height: '260px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockYieldData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral)" opacity={0.5} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-accent)', fontFamily: 'var(--font-tech)' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-accent)', fontFamily: 'var(--font-tech)' }} tickFormatter={(val) => `$${val}`} />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)' }} />
                          <Bar dataKey="yield" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {activeTelemetryAsset && (
                    <Card className="tech-border hover-lift" style={{ padding: '2rem', backgroundColor: 'rgba(118, 185, 0, 0.05)', border: '1px solid rgba(118, 185, 0, 0.2)' }}>
                      <h3 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Maintenance Bond</h3>
                      <p className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>Slashed if Lessee tampers with hardware</p>
                      
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-tech)', color: activeTelemetryAsset.stake_slashed ? 'var(--color-error)' : 'var(--color-success)' }}>
                        {activeTelemetryAsset.operator_stake_balance?.toLocaleString() || 0} <span style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>USDC</span>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
              
              {/* Admin Controls Area */}
              <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid var(--color-neutral)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <Card style={{ padding: '2rem', border: '1px dashed var(--color-error)' }}>
                  <h3 className="text-h2" style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>Simulate SLA Breach</h3>
                  <p className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Simulate a fraudulent telemetry report from the hardware (variance &gt; 5%). This instantly triggers the slashing conditions.
                  </p>
                  <Button variant="secondary" onClick={simulateTampering} disabled={isSlashing || activeTelemetryAsset?.stake_slashed || !activeTelemetryAsset} style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                    {isSlashing ? 'Slashing...' : 'Simulate Hardware Tampering'}
                  </Button>
                </Card>

                <Card style={{ padding: '2rem', border: '1px dashed var(--color-primary)' }}>
                  <h3 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Decentralized Oracle Network</h3>
                  <p className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Simulate Chainlink Functions querying the backend for the deterministic yield payload before pushing on-chain.
                  </p>
                  <Button variant="primary" onClick={triggerOracle} disabled={isFetchingOracle || !activeTelemetryAsset}>
                    {isFetchingOracle ? 'Fetching...' : 'Trigger Oracle Yield Payout'}
                  </Button>
                  {oraclePayload && (
                    <div style={{ marginTop: '1.5rem', backgroundColor: '#0a0a0a', border: '1px solid var(--color-neutral)', borderRadius: '8px', padding: '1rem', overflowX: 'auto' }}>
                      <pre style={{ color: 'var(--color-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-tech)' }}>
                        {oraclePayload}
                      </pre>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}



          {/* ISSUE TAB */}
          {activeTab === 'issue' && (
            <div style={{ display: 'flex', gap: '4rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <span className="text-small" style={{ color: 'var(--color-primary)', letterSpacing: '2px' }}>ASSET ISSUANCE PROTOCOL</span>
                  <h2 className="text-h1 glow-text" style={{ marginTop: '1rem', marginBottom: '1.5rem', fontSize: '2.5rem' }}>Tokenize New Assets</h2>
                  <p className="text-body" style={{ color: 'var(--color-accent)', lineHeight: 1.8 }}>
                    Deploy compliant, fully programmable security tokens tied to physical hardware. Our infrastructure automatically handles liquidity pools, on-chain governance, and KYC whitelists.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--rounded-base)', backgroundColor: 'rgba(0, 128, 128, 0.1)', color: 'var(--color-primary)' }}><Shield size={20} /></div>
                    <div>
                      <h4 className="text-body" style={{ fontWeight: 700, color: 'var(--color-tertiary)' }}>Regulatory Compliant</h4>
                      <p className="text-small" style={{ color: 'var(--color-accent)' }}>ERC-3643 standard ensures transfers only occur between KYC-verified participants.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--rounded-base)', backgroundColor: 'rgba(0, 128, 128, 0.1)', color: 'var(--color-primary)' }}><Activity size={20} /></div>
                    <div>
                      <h4 className="text-body" style={{ fontWeight: 700, color: 'var(--color-tertiary)' }}>Instant Liquidity</h4>
                      <p className="text-small" style={{ color: 'var(--color-accent)' }}>An automated market maker (AMM) pool is initialized automatically upon token deployment.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--rounded-base)', backgroundColor: 'rgba(0, 128, 128, 0.1)', color: 'var(--color-primary)' }}><Box size={20} /></div>
                    <div>
                      <h4 className="text-body" style={{ fontWeight: 700, color: 'var(--color-tertiary)' }}>Governance Ready</h4>
                      <p className="text-small" style={{ color: 'var(--color-accent)' }}>A dedicated DAO contract is linked to your asset to manage IoT parameters and yields.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Card className="tech-border hover-lift" style={{ width: '100%', padding: '2.5rem', backgroundColor: 'var(--color-secondary)' }}>
                  {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(118, 185, 0, 0.1)', border: '1px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle2 color="var(--color-success)" size={32} />
                      </div>
                      <h3 className="text-h2" style={{ marginBottom: '0.5rem', color: 'var(--color-tertiary)' }}>Asset Registered!</h3>
                      <p className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '2rem' }}>
                        Your RWA token is live on Base Sepolia. The liquidity pool and governance contracts have been initialized.
                      </p>
                      <Button onClick={() => setStatus('idle')} style={{ width: '100%', padding: '1rem' }}>MINT ANOTHER ASSET</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <h3 className="text-h2" style={{ color: 'var(--color-tertiary)', marginBottom: '0.5rem' }}>Deployment Configuration</h3>
                        <p className="text-small" style={{ color: 'var(--color-accent)' }}>Enter the parameters for your new RWA index token.</p>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="text-small" style={{ color: 'var(--color-tertiary)', fontWeight: 600 }}>Asset Name</label>
                        <input required placeholder="e.g. Solar Plant Alpha" value={name} onChange={(e) => setName(e.target.value)} style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'} />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label className="text-small" style={{ color: 'var(--color-tertiary)', fontWeight: 600 }}>Token Symbol</label>
                          <input required placeholder="e.g. SPA" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label className="text-small" style={{ color: 'var(--color-tertiary)', fontWeight: 600 }}>Initial Supply</label>
                          <input type="number" required placeholder="100000" value={supply} onChange={(e) => setSupply(e.target.value)} style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'} />
                        </div>
                      </div>
                      
                      <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 128, 128, 0.05)', borderRadius: 'var(--rounded-base)', border: '1px dashed var(--color-primary)', marginTop: '0.5rem' }}>
                        <p className="text-small" style={{ color: 'var(--color-accent)' }}>
                          <strong>Note:</strong> By deploying, you automatically become the Owner Agent. Your address must be whitelisted in the Identity Registry.
                        </p>
                      </div>

                      <Button type="submit" disabled={status === 'submitting'} style={{ marginTop: '0.5rem', padding: '1rem' }}>
                        {status === 'submitting' ? 'DEPLOYING CONTRACTS...' : 'EXECUTE DEPLOYMENT'}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink { 50% { opacity: 0; } }
      `}} />
    </div>
  );
}
