import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-transparent d-print-none">
      <div className="container-xl">
        <div className="row text-center align-items-center flex-row-reverse">
          <div className="col-lg-auto ms-lg-auto">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">
                <a href="#" className="link-secondary">Documentation</a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="link-secondary">Help Desk</a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="link-secondary">Support</a>
              </li>
            </ul>
          </div>
          <div className="col-12 col-lg-auto mt-3 mt-lg-0">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">
                Copyright © {currentYear} Hospital IT Inventory Management
              </li>
              <li className="list-inline-item">
                <a href="#" className="link-secondary" rel="noopener">
                  Version 1.0.0
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
