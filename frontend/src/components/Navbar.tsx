'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { WalletConnect } from './WalletConnect';
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
        height: '64px',
        backgroundColor: navBackground,
        backdropFilter: 'blur(12px)',
        borderBottom: navBorder,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-tertiary)' }}>
          <Logo size={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="text-body font-bold tracking-widest">VERIDIAN</span>
          </div>
        </Link>
        
        {/* Desktop Nav — hidden on mobile via CSS class */}
        <div className="nav-desktop-links">
          {navItems.map((item) => {
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
                className={isActive ? 'text-small font-bold text-[var(--color-primary)]' : 'text-small'}
              >
                {item.name}
              </Link>
            );
          })}
          
          <WalletConnect />
        </div>

        {/* Mobile Hamburger Toggle — visible on mobile via CSS class */}
        <button 
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay — shown/hidden via .open class */}
      <div className={`nav-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ 
                color: isActive ? 'var(--color-primary)' : 'var(--color-tertiary)', 
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
              }} 
            >
              {item.name}
            </Link>
          );
        })}
        <div style={{ marginTop: '0.5rem' }}>
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
