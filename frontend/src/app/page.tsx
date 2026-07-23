'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Database, Lock, Cpu, Server, Shield, CheckCircle, ChevronRight, Terminal, Home as HomeIcon } from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebGL / Canvas Neural Network Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const nodes: {x: number, y: number, vx: number, vy: number}[] = [];
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#76B900';
      ctx.strokeStyle = 'rgba(118, 185, 0, 0.15)';
      ctx.lineWidth = 1;

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        nodes.forEach(other => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-data-flow" style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
      {/* Dynamic Background */}
      {/* Dynamic Background */}
      <canvas 
        ref={canvasRef} 
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} 
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .glass-nav {
          background: rgba(42, 42, 42, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-neutral);
        }
        .hero-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .hero-layout {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }
        .zig-zag {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 6rem;
        }
        .zig-zag:nth-child(even) .zig-content {
          order: -1;
        }
        @media (max-width: 768px) {
          .zig-zag {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .zig-zag:nth-child(even) .zig-content {
            order: 0;
          }
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
        .featured-tier {
          transform: scale(1.05);
          border: 1px solid var(--color-primary);
        }
        .featured-tier::before {
          content: 'RECOMMENDED';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-primary);
          color: #1A1A1A;
          padding: 2px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 100px;
        }
      `}} />



      {/* Hero Section */}
      <section className="section-pad">
        <div className="container hero-layout">
          <div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px' }} className="text-small">
              VERIDIAN DECENTRALIZED ENERGY MESH
            </div>
            <h1 className="hero-title" style={{ marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Power.<br/>Tokenize.<br/>Yield.
            </h1>
            <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '2.5rem', maxWidth: '500px' }}>
              Bypassing centralized energy monopolies by fractionalizing household solar panels. Hardware-attested physical generation meets deterministic USDC yield settlement on Optimism L2.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/map" style={{ textDecoration: 'none' }}>
                <Button size="lg" className="hover-lift" style={{ padding: '1rem 2rem' }}>
                  COMMAND CENTER <ChevronRight size={18} style={{ marginLeft: '8px' }} />
                </Button>
              </Link>
              <Link href="/investor" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg" className="hover-lift" style={{ padding: '1rem 2rem' }}>
                  <Terminal size={18} style={{ marginRight: '8px' }} /> INVESTOR HUB
                </Button>
              </Link>
              <Link href="/lessee" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg" className="hover-lift" style={{ padding: '1rem 2rem' }}>
                  <HomeIcon size={18} style={{ marginRight: '8px' }} /> HOUSEHOLD PORTAL
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Abstract Visual Element */}
          <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              position: 'absolute', 
              width: '300px', 
              height: '300px', 
              border: '2px solid var(--color-primary)', 
              borderRadius: '50%',
              animation: 'spin 15s linear infinite',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent'
            }} />
            <div style={{ 
              position: 'absolute', 
              width: '240px', 
              height: '240px', 
              border: '1px dashed var(--color-surface)', 
              borderRadius: '50%',
              animation: 'spin 10s linear infinite reverse',
            }} />
            <Database size={80} color="var(--color-primary)" style={{ position: 'relative', zIndex: 10 }} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-pad" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-h1">Core Architecture</h2>
          </div>

          <div className="zig-zag">
            <div className="zig-content">
              <Cpu size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
              <h3 className="text-h2" style={{ marginBottom: '1rem' }}>Hardware Root of Trust</h3>
              <p className="text-body" style={{ color: 'var(--color-accent)' }}>
                Direct integration with TPM 2.0 modules ensures that all household solar telemetry is cryptographically signed at the source. An unforgeable Proof of Generation.
              </p>
            </div>
            <Card className="tech-border" style={{ padding: '2rem' }}>
              <pre style={{ fontSize: '0.8rem', color: 'var(--color-success)', overflowX: 'hidden' }}>
                {`> VERIFYING_SIGNATURE...
> TPM_PUBKEY_MATCH: TRUE
> PAYLOAD: { "generated_kWh": 1.98 }
> STATUS: SECURE`}
              </pre>
            </Card>
          </div>

          <div className="zig-zag">
            <Card className="tech-border" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '8px', background: 'var(--color-primary)', width: '100%' }} />
                <div style={{ height: '8px', background: 'var(--color-surface)', width: '70%' }} />
                <div style={{ height: '8px', background: 'var(--color-neutral)', width: '40%' }} />
              </div>
            </Card>
            <div className="zig-content">
              <Shield size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
              <h3 className="text-h2" style={{ marginBottom: '1rem' }}>Zero-Knowledge Compliance</h3>
              <p className="text-body" style={{ color: 'var(--color-accent)' }}>
                Integrating the Midnight Network to enable Selective Disclosure. Investors prove their KYC/AML status mathematically via zk-SNARKs, preserving complete privacy while holding ERC-3643 securities.
              </p>
            </div>
          </div>

          <div className="zig-zag">
            <div className="zig-content">
              <Database size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
              <h3 className="text-h2" style={{ marginBottom: '1rem' }}>Deterministic Settlement</h3>
              <p className="text-body" style={{ color: 'var(--color-accent)' }}>
                Yield distribution is hardcoded on Optimism L2. Funds are split instantly via the Revenue Waterfall upon successful validation of the hardware oracle. Zero human intervention.
              </p>
            </div>
            <Card className="tech-border" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)' }}>
                 <Lock size={24} />
                 <span>ORACLE_VALIDATED</span>
               </div>
               <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-success)' }}>
                 <CheckCircle size={24} />
                 <span>YIELD_DISTRIBUTED</span>
               </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad" style={{ background: 'var(--color-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-h1">Network Validators</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <Card className="hover-lift" style={{ padding: '2rem', borderTop: '2px solid var(--color-primary)' }}>
              <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
                &quot;The hardware root of trust gives us complete confidence. It's the first time we can invest in physical infrastructure with deterministic, on-chain guarantees.&quot;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-neutral)' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Institutional Investor</div>
                  <div className="text-small" style={{ color: 'var(--color-primary)' }}>Yield Fund Partner</div>
                </div>
              </div>
            </Card>
            
            <Card className="hover-lift" style={{ padding: '2rem', borderTop: '2px solid var(--color-tertiary)' }}>
              <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
                &quot;As the off-chain maintenance partner, the deterministic SLA enforcement aligns perfectly. We keep the panels clean, the investors get their yield.&quot;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-neutral)' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>SunFix Logistics</div>
                  <div className="text-small" style={{ color: 'var(--color-primary)' }}>Verified Operator</div>
                </div>
              </div>
            </Card>

            <Card className="hover-lift" style={{ padding: '2rem', borderTop: '2px solid var(--color-success)' }}>
              <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
                &quot;Our household electricity costs dropped by 25% overnight. We bypass the grid entirely and pay only for what the panels on our roof generate.&quot;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-neutral)' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Cape Town Resident</div>
                  <div className="text-small" style={{ color: 'var(--color-primary)' }}>Mesh Network Member</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Economics */}
      <section id="economics" className="section-pad">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-h1">Transparent Unit Economics</h2>
          </div>
          
          <div className="pricing-grid">
            <Card style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column' }}>
              <h3 className="text-h2" style={{ marginBottom: '0.5rem' }}>CapEx & Hardware</h3>
              <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '2rem' }}>Fully installed 450W solar panel</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-tertiary)' }}>R6,750</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> TPM 2.0 Module Included</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> Smart Inverter & Mounting</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> IoT Telemetry Connected</li>
              </ul>
            </Card>

            <Card className="featured-tier" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <h3 className="text-h2" style={{ marginBottom: '0.5rem' }}>Investor Yield</h3>
              <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '2rem' }}>Mathematically derived net return</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-primary)' }}>20.7%<span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}> APY</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> 75% of Gross Revenue Split</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> Monthly USDC Distributions</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> Staking Vault Multipliers</li>
              </ul>
              <Link href="/investor" style={{ textDecoration: 'none' }}>
                <Button style={{ width: '100%' }}>ENTER VAULT</Button>
              </Link>
            </Card>

            <Card style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column' }}>
              <h3 className="text-h2" style={{ marginBottom: '0.5rem' }}>Off-Chain Trust</h3>
              <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '2rem' }}>Operations, Maintenance & Insurance</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-tertiary)' }}>15%<span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}> Split</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> 8% to SunFix Logistics</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> 7% to Depreciation Reserve</li>
                <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><CheckCircle size={18} color="var(--color-primary)" /> Physical Asset Protection</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-pad" style={{ textAlign: 'center', borderTop: '1px solid var(--color-neutral)', borderBottom: '1px solid var(--color-neutral)' }}>
        <div className="container">
          <h2 className="text-h1" style={{ marginBottom: '1.5rem' }}>Ready to Execute?</h2>
          <p className="text-body" style={{ color: 'var(--color-accent)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
            Join the deterministic economy. Tokenize your infrastructure and unlock global liquidity immediately.
          </p>
          <Link href="/market" style={{ textDecoration: 'none' }}>
            <Button size="lg" className="hover-lift" style={{ padding: '1rem 3rem' }}>
              LAUNCH PROTOCOL
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--color-secondary)', padding: '4rem 1.5rem', borderTop: '3px solid var(--color-primary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Logo size={32} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span className="text-h2" style={{ fontSize: '1rem', letterSpacing: '1px' }}>VERIDIAN</span>
                <span className="text-small" style={{ color: 'var(--color-primary)', letterSpacing: '2px', fontSize: '0.55rem' }}>CAPITAL</span>
              </div>
            </div>
            <p className="text-small" style={{ color: 'var(--color-accent)' }}>Institutional-grade compute and escrow protocols for the autonomous future.</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-tertiary)' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--color-accent)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link href="/map" style={{ color: 'inherit', textDecoration: 'none' }}>Command Center</Link></li>
              <li><Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin Portal</Link></li>
              <li><Link href="/investor" style={{ color: 'inherit', textDecoration: 'none' }}>Investor Hub</Link></li>
              <li><Link href="/lessee" style={{ color: 'inherit', textDecoration: 'none' }}>Household Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-tertiary)' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--color-accent)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Privacy Policy</li>
              <li>Terms of Use</li>
              <li>Security Disclosures</li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-tertiary)' }}>Connect</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--color-accent)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Twitter</li>
              <li>GitHub</li>
              <li>Discord</li>
            </ul>
          </div>
        </div>
        <div className="container text-small" style={{ borderTop: '1px solid var(--color-neutral)', paddingTop: '2rem', textAlign: 'center', color: 'var(--color-accent)' }}>
          © 2026 Veridian Capital Protocol. All rights reserved. Deterministic Execution Guaranteed.
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
