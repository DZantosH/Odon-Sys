import React from 'react';
import { Outlet } from 'react-router-dom';
import '../css/PanelPrincipal.css';

const Layout = () => {
  return (
    <div className="App">
            <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;