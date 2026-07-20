'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { WalletConnect } from './WalletConnect';
import React, { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Hide the global dark-mode navbar on the household portal
  if (pathname === '/lessee') {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if we're on the homepage
  const isHome = pathname === '/';
  
  // Base style changes when scrolled or on subpages
  const navBackground = (isHome && !scrolled) 
    ? 'rgba(10, 10, 10, 0.5)' 
    : 'rgba(42, 42, 42, 0.8)';
    
  const navBorder = (isHome && !scrolled)
    ? 'none'
    : '1px solid var(--color-neutral)';

  const navItems = [
    { name: 'Command Center', path: '/map' },
    { name: 'Investor App', path: '/investor' },
    { name: 'Operations', path: '/admin' }
  ];

  return (
    <nav 
      style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        height: '64px', // Standardized height
        backgroundColor: navBackground,
        backdropFilter: 'blur(12px)',
        borderBottom: navBorder,
        transition: 'all 0.3s ease'
      }}
    >
      <div className={isHome ? "container" : "container"} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-tertiary)' }}>
          <Logo size={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="text-body glow-text" style={{ letterSpacing: '2px', fontWeight: 'bold' }}>VERIDIAN</span>
          </div>
        </Link>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navItems.map((item) => {
            // Check if the current pathname matches or starts with the path
            const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                style={{ 
                  color: isActive ? 'var(--color-primary)' : 'var(--color-tertiary)', 
                  textDecoration: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'color 0.2s ease'
                }} 
                className={isActive ? 'text-small glow-text' : 'text-small'}
              >
                {item.name}
              </Link>
            );
          })}
          
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
