import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# We will replace the entire return statement
return_start = content.find('return (')
if return_start == -1:
    print("Could not find return statement")
    exit(1)

new_return = """return (
    <div style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Nav */}
      <nav style={{ height: '64px', padding: '0 32px', backgroundColor: 'rgba(42, 42, 42, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-tertiary)' }}>
          <Logo size={24} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="text-h2 glow-text" style={{ fontSize: '1.25rem', letterSpacing: '1px' }}>VERIDIAN</span>
            <span className="text-small" style={{ color: 'var(--color-primary)', letterSpacing: '2px', fontSize: '0.55rem' }}>CAPITAL</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/market" style={{ color: 'var(--color-tertiary)', textDecoration: 'none' }} className="text-small">Market</Link>
          <Link href="/governance" style={{ color: 'var(--color-tertiary)', textDecoration: 'none' }} className="text-small">Governance</Link>
          <WalletConnect />
        </div>
      </nav>

      <main style={{ padding: '3rem 1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', flex: 1 }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="text-h1 glow-text">Dashboard</h1>
            <p className="text-body" style={{ color: 'var(--color-accent)', marginTop: '0.5rem' }}>
              Your portfolio overview, asset telemetry, and yield performance.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(118, 185, 0, 0.1)', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(118, 185, 0, 0.3)' }}>
            <Activity size={16} color="var(--color-primary)" />
            <span className="text-small" style={{ color: 'var(--color-primary)' }}>LIVE NETWORK: BASE SEPOLIA</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Metrics Row */}
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
                <Link href="/market" style={{ textDecoration: 'none' }}>
                  <Button style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', backgroundColor: 'var(--color-tertiary)', color: 'var(--color-bg-dark)' }}>BUY ASSETS</Button>
                </Link>
              </div>
            </Card>

          </div>

          {/* Main Content Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Left: Asset List & Telemetry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <Card className="tech-border" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0, 191, 255, 0.2)', backgroundColor: 'rgba(0, 191, 255, 0.05)' }}>
                  <h3 className="text-h2" style={{ color: 'var(--color-tertiary)' }}>Asset Hardware Telemetry</h3>
                  <p className="text-small" style={{ color: 'var(--color-accent)', marginTop: '0.25rem' }}>Live readings from TPM 2.0 Secure Enclaves</p>
                </div>
                
                <div style={{ display: 'flex', minHeight: '400px' }}>
                  {/* Asset Selection List */}
                  <div style={{ width: '35%', borderRight: '1px solid var(--color-neutral)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {assetsLoading ? (
                      <div style={{ padding: '1.5rem', color: 'var(--color-accent)' }}>Loading assets...</div>
                    ) : assets?.length === 0 ? (
                      <div style={{ padding: '1.5rem', color: 'var(--color-accent)' }}>No active assets.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {assets?.map(asset => (
                          <div key={asset.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral)', cursor: 'pointer', backgroundColor: firstAsset?.id === asset.id ? 'rgba(118,185,0,0.1)' : 'transparent', borderLeft: firstAsset?.id === asset.id ? '4px solid var(--color-primary)' : '4px solid transparent', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ color: firstAsset?.id === asset.id ? 'var(--color-primary)' : 'var(--color-accent)' }}>{getIconForAsset(asset.name)}</div>
                              <div>
                                <div className="text-body" style={{ fontWeight: 700, color: firstAsset?.id === asset.id ? 'var(--color-tertiary)' : 'var(--color-accent)' }}>{asset.symbol}</div>
                                <div className="text-small" style={{ color: 'var(--color-accent)', marginTop: '4px' }}>{getLocationForAsset(asset.name)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Telemetry Display */}
                  <div style={{ flex: 1, padding: '2.5rem' }}>
                    {firstAsset ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 className="text-h1 glow-text" style={{ color: 'var(--color-primary)', fontSize: '1.75rem' }}>{firstAsset.name}</h4>
                          {firstAsset.stake_slashed ? (
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
                            <div className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '8px' }}>OPERATING HOURS</div>
                            <div style={{ fontSize: '2.25rem', color: 'var(--color-tertiary)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                              {summaryLoading ? '...' : (telemetrySummary?.total_operating_hours?.toLocaleString() || 0)} <span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}>HRS</span>
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
                            <span>{firstAsset.id.split('-')[0]}</span>
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

              {firstAsset && (
                <Card className="tech-border hover-lift" style={{ padding: '2rem', backgroundColor: 'rgba(118, 185, 0, 0.05)', border: '1px solid rgba(118, 185, 0, 0.2)' }}>
                  <h3 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Operator Stake</h3>
                  <p className="text-small" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>Slashed if hardware is tampered</p>
                  
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-tech)', color: firstAsset.stake_slashed ? 'var(--color-error)' : 'var(--color-success)' }}>
                    {firstAsset.operator_stake_balance?.toLocaleString() || 0} <span style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>USDC</span>
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink { 50% { opacity: 0; } }
      `}} />
    </div>
  );
}
"""

# Replace the old return statement and everything after it
new_content = content[:return_start] + new_return

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(new_content)

print("Dashboard updated successfully!")
