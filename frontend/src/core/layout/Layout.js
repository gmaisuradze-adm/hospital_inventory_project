import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="page">
      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            {/* Main content area */}
            <Outlet />
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />
    </div>
  );
};

export default Layout;
