'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Activity, Percent, Info, Network, Cpu, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, encodeFunctionData } from 'viem';
import { MockUSDC_ABI, RWAToken_ABI, RWALiquidityPool_ABI, RWAGovernor_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useDeployedAssets } from '@/hooks/useDeployedAssets';
import { AssetSelector } from '@/components/ui/AssetSelector';
import { OnChainAsset } from '@/types/asset';

export default function InvestorHub() {
  const [activeTab, setActiveTab] = useState<'market' | 'vault' | 'governance'>('market');
  
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { assets } = useDeployedAssets();

  const [selectedAsset, setSelectedAsset] = useState<OnChainAsset | null>(null);
  const activeAsset = selectedAsset || (assets.length > 0 ? assets[0] : null);

  // --- MARKET TAB STATE ---
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');

  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPayAmount(val);
    setReceiveAmount(val ? (Number(val) / 100).toString() : '');
  };

  const handleReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReceiveAmount(val);
    setPayAmount(val ? (Number(val) * 100).toString() : '');
  };

  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: CONTRACT_ADDRESSES.MockUSDC as `0x${string}`,
    abi: MockUSDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 }
  });

  const { data: activeAssetBalance, refetch: refetchAsset } = useReadContract({
    address: activeAsset?.address as `0x${string}`,
    abi: RWAToken_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!activeAsset, refetchInterval: 3000 }
  });

  const formattedUSDC = usdcBalance !== undefined ? Number(formatEther(usdcBalance as bigint)).toLocaleString() : '0';
  const formattedActiveBalance = activeAssetBalance !== undefined ? Number(formatEther(activeAssetBalance as bigint)).toLocaleString() : '0';

  const buyMockUSDC = async () => {
    if (!address) return alert("Please connect your wallet first.");
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MockUSDC as `0x${string}`,
        abi: MockUSDC_ABI,
        functionName: 'buyWithUZHETH',
        value: parseEther('0.001')
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      alert('Successfully bought 1,000 USDC!');
      refetchUSDC();
    } catch (e) {
      console.error(e);
      alert('Transaction failed.');
    }
  };

  const handleReviewSwap = async () => {
    if (!address || !activeAsset || !activeAsset.poolAddress) return alert("Please connect your wallet and select a valid asset pool.");
    if (!payAmount || Number(payAmount) <= 0) return alert("Please enter an amount.");
    try {
      const approveHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MockUSDC as `0x${string}`,
        abi: MockUSDC_ABI,
        functionName: 'approve',
        args: [activeAsset.poolAddress as `0x${string}`, parseEther(payAmount)]
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
      const swapHash = await writeContractAsync({
        address: activeAsset.poolAddress as `0x${string}`,
        abi: RWALiquidityPool_ABI,
        functionName: 'swap',
        args: [CONTRACT_ADDRESSES.MockUSDC, parseEther(payAmount)]
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: swapHash });
      }
      alert(`Swap Complete! You swapped ${payAmount} USDC via the AMM Liquidity Pool.`);
      setPayAmount('');
      setReceiveAmount('');
      refetchUSDC();
      refetchAsset();
    } catch (e) {
      console.error(e);
      alert('Transaction failed. Check console for details.');
    }
  };

  // --- VAULT TAB STATE ---
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [lockDurationYears, setLockDurationYears] = useState(1);
  const [isStaking, setIsStaking] = useState(false);

  const getMultiplier = (years: number) => 1 + (years / 10);
  const getNetYieldSplit = (years: number) => 60 + (years * 1.5);

  const handleStake = async () => {
    if (!address || !activeAsset) return;
    setIsStaking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Successfully locked ${stakeAmount} ${activeAsset.symbol} for ${lockDurationYears} years!`);
    } catch (e) {
      console.error(e);
      alert('Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  // --- GOVERNANCE TAB STATE ---
  const [proposalDescription, setProposalDescription] = useState('');
  const [newUsageRate, setNewUsageRate] = useState<string>('');

  const { data: votingPower } = useReadContract({
    address: activeAsset?.address as `0x${string}`,
    abi: RWAToken_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!activeAsset }
  });

  const handleDelegate = async () => {
    if (!address || !activeAsset) return;
    try {
      await writeContractAsync({
        address: activeAsset.address as `0x${string}`,
        abi: RWAToken_ABI,
        functionName: 'delegate',
        args: [address]
      });
      alert('Successfully delegated voting power to yourself.');
    } catch (e) {
      console.error(e);
      alert('Delegation failed.');
    }
  };

  const handleCreateProposal = async () => {
    if (!address || !activeAsset || !proposalDescription || !newUsageRate) return;
    try {
      const encodedCall = encodeFunctionData({
        abi: RWAToken_ABI,
        functionName: 'updateUsageRate',
        args: [BigInt(Math.floor(Number(newUsageRate) * 100))]
      });
      const targets = [activeAsset.address as `0x${string}`];
      const values = [BigInt(0)];
      const calldatas = [encodedCall];

      const tx = await writeContractAsync({
        address: activeAsset.governorAddress as `0x${string}`,
        abi: RWAGovernor_ABI,
        functionName: 'propose',
        args: [targets, values, calldatas, proposalDescription]
      });
      
      alert(`Proposal Submitted! Tx: ${tx}`);
      setProposalDescription('');
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        alert(`Proposal failed. Did you delegate your votes? Error: ${e.message}`);
      } else {
        alert(`Proposal failed.`);
      }
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-neutral)', padding: '4rem 2rem 2rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="text-h1 glow-text" style={{ marginBottom: '1.5rem' }}>
            Investor Portal
          </h1>
          <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '2rem', margin: '0 auto', maxWidth: '600px' }}>
            Buy tokenized asset shares, lock them to earn yield from real-world revenue, and vote on operational decisions — all on-chain.
          </p>

          {/* Internal Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
            <Button variant={activeTab === 'market' ? 'primary' : 'secondary'} onClick={() => setActiveTab('market')}>
              Trade
            </Button>
            <Button variant={activeTab === 'vault' ? 'primary' : 'secondary'} onClick={() => setActiveTab('vault')}>
              Earn
            </Button>
            <Button variant={activeTab === 'governance' ? 'primary' : 'secondary'} onClick={() => setActiveTab('governance')}>
              Vote
            </Button>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1000px', width: '100%' }}>
          
          {/* Universal Asset Selector for the Hub */}
          {/* Getting Started Banner */}
          {!address && (
            <div style={{ backgroundColor: 'rgba(118, 185, 0, 0.08)', border: '1px solid var(--color-primary)', borderRadius: 'var(--rounded-base)', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={20} color="var(--color-primary)" />
              <span className="text-body" style={{ color: 'var(--color-accent)' }}>
                <strong style={{ color: 'var(--color-primary)' }}>Getting Started:</strong> Connect your wallet (top right), then click <strong>"Get Demo USDC"</strong> to receive free test stablecoins you can use to buy asset tokens.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>SELECT ASSET</span>
              <AssetSelector 
                assets={assets}
                selectedAsset={activeAsset}
                onSelect={setSelectedAsset}
                variant="tabs"
                displayPrefix="idx"
              />
            </div>
          </div>

          {/* MARKET TAB */}
          {activeTab === 'market' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', justifyItems: 'center' }}>
              <Card className="tech-border hover-lift" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 className="text-h2" style={{ color: 'var(--color-tertiary)' }}>Swap Tokens</h2>
                  <Cpu size={24} color="var(--color-primary)" />
                </div>

                {/* Demo Faucet Button */}
                <button onClick={buyMockUSDC} style={{ width: '100%', background: 'linear-gradient(135deg, rgba(118, 185, 0, 0.15), rgba(118, 185, 0, 0.05))', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease' }}>
                  Get 1,000 Demo USDC (Free)
                </button>
                
                <div style={{ backgroundColor: 'rgba(46, 48, 51, 0.3)', padding: '1.25rem', borderRadius: '16px', marginBottom: '8px', border: '1px solid rgba(0, 128, 128, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-small" style={{ color: 'var(--color-accent)' }}>YOU PAY</span>
                    <span className="text-small" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Balance: {formattedUSDC}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input type="number" placeholder="0.0" value={payAmount} onChange={handlePayChange} style={{ flex: 1, fontSize: '2.5rem', color: 'var(--color-tertiary)', backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-tech)', minWidth: 0 }} />
                    <div style={{ backgroundColor: 'rgba(0, 128, 128, 0.15)', padding: '10px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 128, 128, 0.4)' }}>
                      <span className="text-body" style={{ color: 'var(--color-tertiary)', fontWeight: 700 }}>USDC</span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(46, 48, 51, 0.3)', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(0, 128, 128, 0.2)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-small" style={{ color: 'var(--color-accent)' }}>YOU RECEIVE</span>
                    <span className="text-small" style={{ color: 'var(--color-accent)' }}>Balance: {formattedActiveBalance}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input type="number" placeholder="0.0" value={receiveAmount} onChange={handleReceiveChange} style={{ flex: 1, fontSize: '2.5rem', color: 'var(--color-tertiary)', backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-tech)', minWidth: 0 }} />
                    <div style={{ backgroundColor: 'rgba(0, 128, 128, 0.15)', padding: '10px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 128, 128, 0.4)' }}>
                      <span className="text-body" style={{ color: 'var(--color-tertiary)', fontWeight: 700 }}>{activeAsset?.symbol || 'RWA'}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleReviewSwap} disabled={!activeAsset || !payAmount} style={{ width: '100%', height: '3.5rem' }}>
                  {payAmount ? `Swap ${payAmount} USDC → ${receiveAmount} ${activeAsset?.symbol || 'RWA'}` : 'Enter an amount to swap'}
                </Button>
              </Card>
            </div>
          )}

          {/* VAULT TAB */}
          {activeTab === 'vault' && (
            <div className="responsive-grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <Card style={{ padding: '2rem' }}>
                  <h2 className="text-h2 glow-text" style={{ marginBottom: '1.5rem' }}>Lock & Earn</h2>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="text-small" style={{ color: 'var(--color-accent)' }}>AMOUNT TO LOCK</span>
                      <span className="text-small" style={{ color: 'var(--color-primary)' }}>Balance: 5,000 {activeAsset?.symbol}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-neutral)', borderRadius: 'var(--rounded-base)', padding: '0.5rem 1rem' }}>
                      <input 
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--color-tertiary)', fontSize: '1.5rem', fontFamily: 'var(--font-tech)', outline: 'none' }}
                      />
                      <span className="text-small" style={{ color: 'var(--color-accent)' }}>{activeAsset?.symbol}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span className="text-small" style={{ color: 'var(--color-accent)' }}>LOCK DURATION (YEARS)</span>
                      <span className="text-h2" style={{ color: 'var(--color-tertiary)' }}>{lockDurationYears} YEARS</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={lockDurationYears}
                      onChange={(e) => setLockDurationYears(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--color-accent)', fontSize: '0.75rem' }}>
                      <span>1 Yr (Liquid Base)</span>
                      <span>10 Yr (Max Premium)</span>
                    </div>
                  </div>

                  <Button onClick={handleStake} disabled={isStaking || !activeAsset || !stakeAmount} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                    {isStaking ? 'Locking Assets...' : `Lock ${stakeAmount || '0'} ${activeAsset?.symbol || 'Tokens'} for ${lockDurationYears} Year${lockDurationYears > 1 ? 's' : ''}`}
                  </Button>
                </Card>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <Card style={{ padding: '2rem', border: '1px solid var(--color-primary)', backgroundColor: 'rgba(118, 185, 0, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <Percent size={20} color="var(--color-primary)" />
                    <h2 className="text-h2 glow-text" style={{ color: 'var(--color-primary)' }}>Yield Projection</h2>
                  </div>

                  <div className="responsive-grid-2" style={{ marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: 'var(--rounded-base)', border: '1px solid var(--color-neutral)' }}>
                      <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '4px' }}>YIELD MULTIPLIER</div>
                      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-tech)', color: 'var(--color-tertiary)', fontWeight: 700 }}>
                        {getMultiplier(lockDurationYears).toFixed(2)}x
                      </div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: 'var(--rounded-base)', border: '1px solid var(--color-neutral)' }}>
                      <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '4px' }}>YOUR REVENUE SPLIT</div>
                      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-tech)', color: 'var(--color-tertiary)', fontWeight: 700 }}>
                        {getNetYieldSplit(lockDurationYears).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--color-neutral)', paddingTop: '1.5rem' }}>
                    <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={14} /> HOW IT WORKS
                    </div>
                    <ul style={{ color: 'var(--color-accent)', fontSize: '0.85rem', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                      <li style={{ marginBottom: '0.5rem' }}>Locking tokens converts them to non-transferable <strong>Staked Tokens</strong>.</li>
                      <li style={{ marginBottom: '0.5rem' }}>These staked tokens represent your amplified claim on the hardware's electricity yield.</li>
                      <li style={{ marginBottom: '0.5rem' }}>10-year locks receive the maximum 75% yield split (vs 60% for liquid tokens).</li>
                      <li style={{ marginBottom: '0.5rem' }}>The 15% yield difference from liquid tokens is automatically redirected to the protocol's Expansion Fund.</li>
                      <li>Early withdrawal incurs a slashing penalty which is redistributed to loyal stakers.</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* GOVERNANCE TAB */}
          {activeTab === 'governance' && (
            <div className="responsive-grid-2">
              <Card style={{ padding: '2rem' }}>
                <h2 className="text-h2 glow-text" style={{ marginBottom: '1.5rem' }}>Your Governance Profile</h2>
                {activeAsset ? (
                  <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '1.5rem', borderRadius: 'var(--rounded-base)', border: '1px solid var(--color-neutral)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--color-neutral)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="var(--color-accent)" />
                        <span className="text-small" style={{ color: 'var(--color-accent)' }}>DAO CONTRACT</span>
                      </div>
                      <span className="text-small" style={{ fontFamily: 'var(--font-tech)' }}>
                        {activeAsset.governorAddress ? `${activeAsset.governorAddress.substring(0, 8)}...${activeAsset.governorAddress.substring(36)}` : 'N/A'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="var(--color-accent)" />
                        <span className="text-small" style={{ color: 'var(--color-accent)' }}>YOUR VOTING POWER</span>
                      </div>
                      <span className="text-h2" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-tech)' }}>
                        {votingPower ? (Number(votingPower) / 1e18).toLocaleString() : '0'} VOTES
                      </span>
                    </div>
                    
                    <Button onClick={handleDelegate} style={{ width: '100%' }}>
                      Activate My Voting Power
                    </Button>
                  </div>
                ) : (
                  <p>Select an asset above to view profile.</p>
                )}
              </Card>

              <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h2 className="text-h2 glow-text">Submit Rate Proposal</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(118, 185, 0, 0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--rounded-base)', border: '1px solid var(--color-primary)' }}>
                    <CheckCircle2 size={14} color="var(--color-primary)" />
                    <span className="text-small" style={{ color: 'var(--color-primary)' }}>51% QUORUM ENFORCED</span>
                  </div>
                </div>
                
                <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
                  Proposals to change the Usage Rate must reach the 51% Quorum threshold before execution. This ensures electricity prices remain competitive.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="number"
                    value={newUsageRate} 
                    onChange={e => setNewUsageRate(e.target.value)} 
                    placeholder="New Usage Rate (e.g., 16 cents/kWh)..." 
                    style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none' }}
                  />
                  <input 
                    value={proposalDescription} 
                    onChange={e => setProposalDescription(e.target.value)} 
                    placeholder="Justification for rate change..." 
                    style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none' }}
                  />
                  <Button onClick={handleCreateProposal} disabled={!proposalDescription || !newUsageRate || !activeAsset} style={{ width: '100%' }}>
                    Submit Proposal On-Chain
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
