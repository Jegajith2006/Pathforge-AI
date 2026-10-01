import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Core Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Career Orbit', href: '#career-orbit' },
    { name: 'Readiness Index', href: '#readiness-engine' },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          isScrolled
            ? 'bg-[var(--surface)]/90 dark:bg-[#080B16]/90 backdrop-blur-md border-b border-[var(--border)] dark:border-slate-800/80 py-3 shadow-md shadow-slate-900/5 dark:shadow-slate-950/50'
            : 'bg-transparent py-5'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" to="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--surface)]/80 dark:bg-[#0E1326]/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-[var(--border)] dark:border-slate-800/80 shadow-xs">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] dark:hover:bg-slate-800/60 rounded-full transition-colors cursor-pointer"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTA Buttons & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] dark:border-slate-800 transition-colors cursor-pointer shadow-2xs"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
            <Button
              to="/register"
              variant="primary"
              size="sm"
              rightIcon={ArrowRight}
            >
              Start Career Journey
            </Button>
          </div>

          {/* Mobile Right Controls: Theme Toggle & Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] dark:border-slate-800 cursor-pointer shadow-2xs"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] dark:border-slate-800 cursor-pointer shadow-2xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)]/98 dark:bg-[#080B16]/98 border-b border-[var(--border)] dark:border-slate-800/90 px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl shadow-xl animate-fade-in">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-secondary)] dark:hover:bg-slate-800/50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border)] dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-2 py-1 text-xs text-[var(--text-secondary)]">
              <span>Color Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] font-medium text-xs cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            <Button to="/login" variant="secondary" size="md" fullWidth>
              Sign In
            </Button>
            <Button to="/register" variant="primary" size="md" fullWidth rightIcon={ArrowRight}>
              Start Your Career Journey
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
