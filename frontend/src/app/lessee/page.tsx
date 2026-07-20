'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Home, Sun, Zap, CheckCircle2, MapPin, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LesseeDashboard() {
  const [step, setStep] = useState<'request' | 'pending' | 'active'>('request');
  const [isPaying, setIsPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  // Mock data based on Hiba's research
  const generatedKWh = 178;
  const eskomRate = 3.50;
  const veridianRate = 2.80;
  
  const eskomBill = generatedKWh * eskomRate;
  const veridianBill = generatedKWh * veridianRate;
  const savings = eskomBill - veridianBill;

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('pending');
    // Simulate backend approval after 2 seconds
    setTimeout(() => {
      setStep('active');
    }, 2000);
  };

  const handlePayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setHasPaid(true);
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Friendly Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1a1a1a' }}>
          <Logo size={28} color="#76B900" />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '2px', fontFamily: 'var(--font-tech), monospace' }}>VERIDIAN</span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, letterSpacing: '1px' }}>HOME PORTAL</span>
          </div>
        </div>
        <Link href="/" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
          Sign Out
        </Link>
      </header>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        {step === 'request' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <img src="/custom_solar_icon.png" alt="Custom Solar Icon" width={80} height={80} style={{ objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Bypass the Grid.</h2>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', maxWidth: '500px', margin: '0 auto' }}>
                Join the Decentralized Energy Mesh. Get solar panels installed at zero upfront cost and pay only for the electricity you use, at a 20% discount.
              </p>
            </div>

            <Card style={{ padding: '2rem', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Request Installation</h3>
              <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Home Address</label>
                  <input required placeholder="123 Nelson Mandela Blvd, Cape Town" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', color: '#1a1a1a' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Estimated Monthly Bill (Rands)</label>
                  <input required type="number" placeholder="e.g., 800" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', color: '#1a1a1a' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Roof Type</label>
                  <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: 'white', color: '#1a1a1a' }}>
                    <option>Standard Tile</option>
                    <option>Corrugated Iron</option>
                    <option>Flat Concrete</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Property Ownership</label>
                  <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: 'white', color: '#1a1a1a' }}>
                    <option>I own this property</option>
                    <option>I rent (Landlord approval required)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Home Internet (For panel telemetry)</label>
                  <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: 'white', color: '#1a1a1a' }}>
                    <option>Reliable Wi-Fi available</option>
                    <option>No Wi-Fi (Requires GSM module)</option>
                  </select>
                </div>
                <Button type="submit" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, background: '#76B900', color: 'white', border: 'none' }}>
                  Submit Request
                </Button>
              </form>
            </Card>
          </div>
        )}

        {step === 'pending' && (
          <div style={{ textAlign: 'center', padding: '4rem 0', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #f3f4f6', borderTopColor: '#76B900', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Processing Request</h2>
            <p style={{ color: '#6b7280' }}>Assigning your home to the Western Cape Solar Pool...</p>
          </div>
        )}

        {step === 'active' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <CheckCircle2 color="#16a34a" size={24} />
              <div>
                <div style={{ fontWeight: 600, color: '#166534' }}>Installation Active</div>
                <div style={{ fontSize: '0.85rem', color: '#15803d' }}>Hardware verified by SunFix Logistics</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <Card style={{ padding: '1.5rem', background: 'white', border: '1px solid #e5e7eb', color: '#1a1a1a', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '1rem' }}>
                  <MapPin size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Regional Pool</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Western Cape Solar</div>
                <div style={{ display: 'inline-block', background: '#f3f4f6', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>
                  POOL ID: WCS-POOL
                </div>
              </Card>

              <Card style={{ padding: '1.5rem', background: 'white', border: '1px solid #e5e7eb', color: '#1a1a1a', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '1rem' }}>
                  <Zap size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Generated This Month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#76B900', lineHeight: 1 }}>{generatedKWh}</span>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>kWh</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>3 panels reporting • Online</div>
              </Card>
            </div>

            <Card style={{ padding: '2rem', background: 'white', border: '1px solid #e5e7eb', color: '#1a1a1a', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} /> Monthly Statement
              </h3>
              
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#4b5563' }}>Electricity Consumed ({generatedKWh} kWh)</span>
                  <span style={{ fontWeight: 600 }}>R {veridianBill.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #d1d5db' }}>
                  <span style={{ color: '#9ca3af' }}>Standard Grid Cost (R{eskomRate.toFixed(2)}/kWh)</span>
                  <span style={{ color: '#9ca3af', textDecoration: 'line-through' }}>R {eskomBill.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>Your Savings</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>- R {savings.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Amount Due</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>R {veridianBill.toFixed(2)}</div>
                </div>
                
                {hasPaid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 700, padding: '1rem 2rem', background: '#f0fdf4', borderRadius: '8px' }}>
                    <CheckCircle2 size={20} /> PAID IN FULL
                  </div>
                ) : (
                  <button 
                    onClick={handlePayment}
                    disabled={isPaying}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '1rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, 
                      background: isPaying ? '#9ca3af' : '#1a1a1a', 
                      color: 'white', border: 'none', cursor: isPaying ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {isPaying ? 'PROCESSING...' : (
                      <>PAY NOW <ArrowRight size={18} /></>
                    )}
                  </button>
                )}
              </div>
            </Card>

          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
