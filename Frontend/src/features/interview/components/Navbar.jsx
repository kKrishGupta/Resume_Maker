import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import BrandLogo from '../../../components/BrandLogo';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const navItems = [
    { label: 'Interview Prep', path: '/' },
    { label: 'Resume Builder', path: '/resume' },
    { label: 'Mock Interview', path: '/mock' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="app-navbar">
      <div className="app-navbar__inner">
        {/* Brand */}
        <Link to="/" className="app-navbar__brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandLogo size={28} />
          <span className="brand-name">ResumeForge</span>
        </Link>

        {/* Desktop Links */}
        <div className="app-navbar__links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions / User */}
        <div className="app-navbar__actions">
          {user && (
            <span className="user-tag">
              👋 {user.username || user.email?.split('@')[0]}
            </span>
          )}

          <button onClick={onLogout} className="logout-btn" title="Log out">
            Logout
          </button>

          {/* Mobile hamburger toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`app-navbar__mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
