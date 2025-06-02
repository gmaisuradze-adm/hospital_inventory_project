import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import hospitalLogo from '../../assets/images/hospital-logo.svg';
import { IconSearch, IconBell, IconMenu2, IconUser, IconSettings, IconLogout } from '@tabler/icons-react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <button className="navbar-toggler" type="button" onClick={toggleSidebar}>
          <IconMenu2 />
        </button>
        
        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
          <Link to="/">
            <img src={hospitalLogo} width="110" height="32" alt="Hospital IT" className="navbar-brand-image" />
          </Link>
        </h1>
        
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item d-none d-md-flex me-3">
            <div className="btn-list">
              <a href="https://github.com/tabler/tabler" className="btn" target="_blank" rel="noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" /></svg>
                Documentation
              </a>
            </div>
          </div>
          
          <div className="d-none d-md-flex">
            <a href="#" className="nav-link px-0" data-bs-toggle="tooltip" title="Search">
              <IconSearch className="icon" />
            </a>
            <div className="nav-item dropdown d-none d-md-flex me-3">
              <a href="#" className="nav-link px-0" data-bs-toggle="dropdown" tabIndex="-1" aria-label="Show notifications">
                <IconBell className="icon" />
                <span className="badge bg-red"></span>
              </a>
              <div className="dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Notifications</h3>
                  </div>
                  <div className="list-group list-group-flush list-group-hoverable">
                    <div className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto"><span className="status-dot status-dot-animated bg-red d-block"></span></div>
                        <div className="col text-truncate">
                          <a href="#" className="text-body d-block">Low inventory alert for item #1234</a>
                          <div className="d-block text-muted text-truncate mt-n1">
                            Stock level below minimum threshold
                          </div>
                        </div>
                        <div className="col-auto">
                          <a href="#" className="list-group-item-actions">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto"><span className="status-dot d-block"></span></div>
                        <div className="col text-truncate">
                          <a href="#" className="text-body d-block">Maintenance scheduled</a>
                          <div className="d-block text-muted text-truncate mt-n1">
                            Server maintenance scheduled for 10:00 PM
                          </div>
                        </div>
                        <div className="col-auto">
                          <a href="#" className="list-group-item-actions show">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-yellow" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="nav-item dropdown">
            <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
              <span className="avatar avatar-sm" style={{ backgroundImage: 'url(https://eu.ui-avatars.com/api/?name=' + encodeURIComponent(user?.firstName + ' ' + user?.lastName) + '&background=random)' }}></span>
              <div className="d-none d-xl-block ps-2">
                <div>{user?.firstName} {user?.lastName}</div>
                <div className="mt-1 small text-muted">{user?.role || 'User'}</div>
              </div>
            </a>
            <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
              <Link to="/profile" className="dropdown-item">
                <IconUser className="dropdown-item-icon" />
                Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                <IconSettings className="dropdown-item-icon" />
                Settings
              </Link>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                <IconLogout className="dropdown-item-icon" />
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="collapse navbar-collapse" id="navbar-menu">
          <div className="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg>
                  </span>
                  <span className="nav-link-title">
                    Home
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
