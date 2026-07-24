'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { WalletConnect } from '@/components/WalletConnect';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { AutoKYC_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';

export default function Onboarding() {
  const { address } = useAccount();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [walletAddress, setWalletAddress] = useState('');

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Please connect your wallet first.");
    setStatus('submitting');
    
    try {
      // In production, this would call the backend API to trigger KYC provider validation
      // followed by an authorized backend signature/call to AutoKYC.verifyAddress().
      // For this demo, we mock the backend approval delay.
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('success');
    } catch (error) {
      console.error(error);
      alert('Verification failed or was rejected.');
      setStatus('idle');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>


      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <Card style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
          <h2 className="text-h1" style={{ marginBottom: '16px' }}>Verify Identity</h2>
          <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '32px' }}>
            To hold or trade RWA tokens, you must be verified by a Trusted Issuer and bound to an ONCHAINID.
          </p>

          {status === 'success' ? (
            <div style={{ padding: '24px 0' }}>
              <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle2 size={48} color="var(--color-success)" />
              </div>
              <h3 className="text-h2" style={{ marginBottom: '8px', color: 'var(--color-success)', textAlign: 'center' }}>Identity Verified</h3>
              <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '24px', textAlign: 'center' }}>
                Your identity claim has been issued on-chain.
              </p>
              
              <div style={{ backgroundColor: '#0a0a0a', border: '1px solid var(--color-primary)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '0.85rem', marginBottom: '12px', borderBottom: '1px dashed var(--color-primary)', paddingBottom: '8px' }}>
                  // ONCHAINID GENERATED
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-accent)' }} className="text-small">Contract Address</span>
                  <span style={{ color: 'var(--color-tertiary)', fontFamily: 'var(--font-tech)' }}>0x7A4...9F2</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-accent)' }} className="text-small">Active Claims</span>
                  <span style={{ color: 'var(--color-success)', fontFamily: 'var(--font-tech)' }}>2</span>
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '12px', borderRadius: '4px', borderLeft: '2px solid var(--color-success)', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-small" style={{ color: 'var(--color-tertiary)' }}>Topic 1: KYC Clearance</span>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '12px', borderRadius: '4px', borderLeft: '2px solid var(--color-success)', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-small" style={{ color: 'var(--color-tertiary)' }}>Topic 2: AML / Accreditation</span>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  </div>
                </div>
              </div>

              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Button style={{ width: '100%' }}>INITIALIZE DASHBOARD</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-small" style={{ color: 'var(--color-accent)' }}>LEGAL NAME</label>
                <input required placeholder="Jane Doe" style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-small" style={{ color: 'var(--color-accent)' }}>JURISDICTION</label>
                <input required placeholder="US, UK, SG..." style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-small" style={{ color: 'var(--color-accent)' }}>ETHEREUM WALLET</label>
                <input 
                  required 
                  placeholder="0x..." 
                  value={walletAddress || address || ''} 
                  onChange={(e) => setWalletAddress(e.target.value)}
                  style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-tertiary)', borderRadius: 'var(--rounded-base)', padding: '1rem', border: '1px solid var(--color-neutral)', fontFamily: 'var(--font-tech)', outline: 'none' }} onFocus={e => e.target.style.border = '1px solid var(--color-primary)'} onBlur={e => e.target.style.border = '1px solid var(--color-neutral)'}
                />
              </div>
              <Button type="submit" disabled={status === 'submitting'} style={{ marginTop: '16px' }}>
                {status === 'submitting' ? 'PROCESSING...' : 'SUBMIT VERIFICATION'}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
