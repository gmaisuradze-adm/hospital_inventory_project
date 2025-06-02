import React, { useState } from 'react';
import { 
  IconUser, 
  IconMail, 
  IconLock, 
  IconBuildingHospital,
  IconWorld,
  IconBell,
  IconPalette,
  IconDeviceDesktop,
  IconCheck
} from '@tabler/icons-react';
import { useAuth } from '../../core/auth/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [accountForm, setAccountForm] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@hospital.org',
    position: user?.position || 'IT Administrator',
    department: user?.department || 'IT Department',
    phone: user?.phone || '(555) 123-4567'
  });
  
  const [hospitalForm, setHospitalForm] = useState({
    name: 'Memorial Hospital',
    address: '1234 Medical Center Blvd',
    city: 'Healthcare City',
    state: 'CA',
    zipCode: '90001',
    phone: '(555) 987-6543',
    website: 'www.memorialhospital.org'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    inventoryAlerts: true,
    requestNotifications: true,
    securityAlerts: true,
    weeklyReports: true,
    maintenanceNotifications: false
  });
  
  const [displayPreferences, setDisplayPreferences] = useState({
    theme: 'light',
    sidebarCollapsed: false,
    compactTables: false,
    fontSize: 'medium',
    colorScheme: 'blue'
  });
  
  const handleAccountFormChange = (e) => {
    const { name, value } = e.target;
    setAccountForm({
      ...accountForm,
      [name]: value
    });
  };
  
  const handleHospitalFormChange = (e) => {
    const { name, value } = e.target;
    setHospitalForm({
      ...hospitalForm,
      [name]: value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  const handleDisplayPreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDisplayPreferences({
      ...displayPreferences,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const saveAccountSettings = (e) => {
    e.preventDefault();
    // In a real implementation, we would call the API to save the settings
    setSuccessMessage('Account settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const saveHospitalSettings = (e) => {
    e.preventDefault();
    // In a real implementation, we would call the API to save the settings
    setSuccessMessage('Hospital settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const saveNotificationSettings = (e) => {
    e.preventDefault();
    // In a real implementation, we would call the API to save the settings
    setSuccessMessage('Notification settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const saveDisplaySettings = (e) => {
    e.preventDefault();
    // In a real implementation, we would call the API to save the settings
    setSuccessMessage('Display preferences saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Settings</h2>
              <div className="text-muted mt-1">Manage your account and application preferences</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          {successMessage && (
            <div className="alert alert-success alert-dismissible" role="alert">
              <div className="d-flex">
                <div>
                  <IconCheck className="icon alert-icon" />
                </div>
                <div>
                  {successMessage}
                </div>
              </div>
              <a className="btn-close" data-bs-dismiss="alert" aria-label="close" onClick={() => setSuccessMessage('')}></a>
            </div>
          )}
          
          <div className="card">
            <div className="row g-0">
              <div className="col-3 d-none d-md-block border-end">
                <div className="card-body">
                  <h4 className="subheader">Settings</h4>
                  <div className="list-group list-group-transparent">
                    <a 
                      href="#"
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'account' ? 'active' : ''}`}
                      onClick={() => setActiveTab('account')}
                    >
                      <IconUser className="icon me-2" />
                      Account
                    </a>
                    <a 
                      href="#"
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'hospital' ? 'active' : ''}`}
                      onClick={() => setActiveTab('hospital')}
                    >
                      <IconBuildingHospital className="icon me-2" />
                      Hospital Info
                    </a>
                    <a 
                      href="#"
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActiveTab('notifications')}
                    >
                      <IconBell className="icon me-2" />
                      Notifications
                    </a>
                    <a 
                      href="#"
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'display' ? 'active' : ''}`}
                      onClick={() => setActiveTab('display')}
                    >
                      <IconDeviceDesktop className="icon me-2" />
                      Display
                    </a>
                  </div>
                </div>
              </div>
              <div className="col d-flex flex-column">
                <div className="card-body">
                  {activeTab === 'account' && (
                    <form onSubmit={saveAccountSettings}>
                      <h2 className="mb-4">Account Settings</h2>
                      <div className="row mb-3">
                        <div className="col-md-4 text-center mb-3">
                          <div className="avatar avatar-xl mb-3" style={{ backgroundImage: `url(https://eu.ui-avatars.com/api/?name=${encodeURIComponent(accountForm.firstName + ' ' + accountForm.lastName)}&background=random&size=128)` }}></div>
                          <div className="mt-3">
                            <button type="button" className="btn btn-outline-primary btn-sm">
                              Change Avatar
                            </button>
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="form-group mb-3">
                                <label className="form-label">First Name</label>
                                <div className="input-icon">
                                  <span className="input-icon-addon">
                                    <IconUser size={18} />
                                  </span>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    name="firstName"
                                    value={accountForm.firstName}
                                    onChange={handleAccountFormChange}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-group mb-3">
                                <label className="form-label">Last Name</label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  name="lastName"
                                  value={accountForm.lastName}
                                  onChange={handleAccountFormChange}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group mb-3">
                            <label className="form-label">Email</label>
                            <div className="input-icon">
                              <span className="input-icon-addon">
                                <IconMail size={18} />
                              </span>
                              <input 
                                type="email" 
                                className="form-control" 
                                name="email"
                                value={accountForm.email}
                                onChange={handleAccountFormChange}
                              />
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="form-group mb-3">
                                <label className="form-label">Position</label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  name="position"
                                  value={accountForm.position}
                                  onChange={handleAccountFormChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-group mb-3">
                                <label className="form-label">Department</label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  name="department"
                                  value={accountForm.department}
                                  onChange={handleAccountFormChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hr-text">Security</div>
                      
                      <div className="form-group mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">Current Password</label>
                        </div>
                        <div className="input-icon">
                          <span className="input-icon-addon">
                            <IconLock size={18} />
                          </span>
                          <input type="password" className="form-control" placeholder="Enter current password" />
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">New Password</label>
                            <div className="input-icon">
                              <span className="input-icon-addon">
                                <IconLock size={18} />
                              </span>
                              <input type="password" className="form-control" placeholder="Enter new password" />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-icon">
                              <span className="input-icon-addon">
                                <IconLock size={18} />
                              </span>
                              <input type="password" className="form-control" placeholder="Confirm new password" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-footer">
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                      </div>
                    </form>
                  )}
                  
                  {activeTab === 'hospital' && (
                    <form onSubmit={saveHospitalSettings}>
                      <h2 className="mb-4">Hospital Information</h2>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Hospital Name</label>
                            <div className="input-icon">
                              <span className="input-icon-addon">
                                <IconBuildingHospital size={18} />
                              </span>
                              <input 
                                type="text" 
                                className="form-control" 
                                name="name"
                                value={hospitalForm.name}
                                onChange={handleHospitalFormChange}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Website</label>
                            <div className="input-icon">
                              <span className="input-icon-addon">
                                <IconWorld size={18} />
                              </span>
                              <input 
                                type="text" 
                                className="form-control" 
                                name="website"
                                value={hospitalForm.website}
                                onChange={handleHospitalFormChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-label">Address</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="address"
                          value={hospitalForm.address}
                          onChange={handleHospitalFormChange}
                        />
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">City</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              name="city"
                              value={hospitalForm.city}
                              onChange={handleHospitalFormChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">State</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              name="state"
                              value={hospitalForm.state}
                              onChange={handleHospitalFormChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">Zip Code</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              name="zipCode"
                              value={hospitalForm.zipCode}
                              onChange={handleHospitalFormChange}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-label">Phone</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="phone"
                          value={hospitalForm.phone}
                          onChange={handleHospitalFormChange}
                        />
                      </div>
                      
                      <div className="form-footer">
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                      </div>
                    </form>
                  )}
                  
                  {activeTab === 'notifications' && (
                    <form onSubmit={saveNotificationSettings}>
                      <h2 className="mb-4">Notification Settings</h2>
                      
                      <div className="form-group mb-3">
                        <div className="form-label">Email Notifications</div>
                        <label className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="emailAlerts" 
                            checked={notificationSettings.emailAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">Receive email alerts</span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="inventoryAlerts" 
                            checked={notificationSettings.inventoryAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">
                            Inventory alerts (low stock, out of stock)
                          </span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="requestNotifications" 
                            checked={notificationSettings.requestNotifications}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">
                            Request notifications (new, approved, rejected)
                          </span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="securityAlerts" 
                            checked={notificationSettings.securityAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">
                            Security alerts
                          </span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="weeklyReports" 
                            checked={notificationSettings.weeklyReports}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">
                            Weekly summary reports
                          </span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="maintenanceNotifications" 
                            checked={notificationSettings.maintenanceNotifications}
                            onChange={handleNotificationChange}
                          />
                          <span className="form-check-label">
                            Maintenance notifications
                          </span>
                        </label>
                      </div>
                      
                      <div className="form-footer">
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                      </div>
                    </form>
                  )}
                  
                  {activeTab === 'display' && (
                    <form onSubmit={saveDisplaySettings}>
                      <h2 className="mb-4">Display Preferences</h2>
                      
                      <div className="form-group mb-3">
                        <label className="form-label">Theme</label>
                        <div>
                          <label className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="theme" 
                              value="light"
                              checked={displayPreferences.theme === 'light'}
                              onChange={handleDisplayPreferenceChange}
                            />
                            <span className="form-check-label">Light</span>
                          </label>
                          <label className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="theme" 
                              value="dark"
                              checked={displayPreferences.theme === 'dark'}
                              onChange={handleDisplayPreferenceChange}
                            />
                            <span className="form-check-label">Dark</span>
                          </label>
                          <label className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="theme" 
                              value="auto"
                              checked={displayPreferences.theme === 'auto'}
                              onChange={handleDisplayPreferenceChange}
                            />
                            <span className="form-check-label">Auto (system)</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-label">Color Scheme</label>
                        <div>
                          <div className="row g-2">
                            {['blue', 'azure', 'indigo', 'purple', 'green', 'lime', 'yellow', 'orange', 'red'].map(color => (
                              <div className="col-auto" key={color}>
                                <label className="form-colorinput">
                                  <input 
                                    name="colorScheme" 
                                    type="radio" 
                                    value={color}
                                    className="form-colorinput-input"
                                    checked={displayPreferences.colorScheme === color}
                                    onChange={handleDisplayPreferenceChange}
                                  />
                                  <span className={`form-colorinput-color bg-${color}`}></span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-group mb-3">
                        <div className="form-label">Font Size</div>
                        <select 
                          className="form-select" 
                          name="fontSize"
                          value={displayPreferences.fontSize}
                          onChange={handleDisplayPreferenceChange}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      
                      <div className="form-group mb-3">
                        <div className="form-label">Interface Options</div>
                        <label className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            name="sidebarCollapsed"
                            checked={displayPreferences.sidebarCollapsed}
                            onChange={handleDisplayPreferenceChange}
                          />
                          <span className="form-check-label">Collapsed Sidebar</span>
                        </label>
                      </div>
                      
                      <div className="form-group mb-3">
                        <label className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            name="compactTables"
                            checked={displayPreferences.compactTables}
                            onChange={handleDisplayPreferenceChange}
                          />
                          <span className="form-check-label">Compact Tables</span>
                        </label>
                      </div>
                      
                      <div className="form-footer">
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                        <button type="button" className="btn btn-outline-secondary ms-2">Reset to Default</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
