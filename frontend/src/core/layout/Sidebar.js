import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  IconDashboard, 
  IconBoxSeam, 
  IconBuildingWarehouse, 
  IconClipboardList, 
  IconHeartRateMonitor, 
  IconChartBar, 
  IconSettings
} from '@tabler/icons-react';

const navItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: IconDashboard 
  },
  { 
    name: 'Inventory', 
    path: '/inventory', 
    icon: IconBoxSeam 
  },
  { 
    name: 'Warehouse', 
    path: '/warehouse', 
    icon: IconBuildingWarehouse 
  },
  { 
    name: 'Requests', 
    path: '/requests', 
    icon: IconClipboardList 
  },
  { 
    name: 'Service Management', 
    path: '/service', 
    icon: IconHeartRateMonitor,
    children: [
      { name: 'Incidents', path: '/service/incidents' },
      { name: 'Maintenance', path: '/service/maintenance' },
      { name: 'Knowledge Base', path: '/service/knowledge' }
    ]
  },
  { 
    name: 'Analytics', 
    path: '/analytics', 
    icon: IconChartBar,
    children: [
      { name: 'Dashboard', path: '/analytics' },
      { name: 'Reports', path: '/analytics/reports' }
    ]
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: IconSettings 
  }
];

const Sidebar = ({ collapsed }) => {
  const [expandedItems, setExpandedItems] = React.useState({});

  const toggleExpand = (name) => {
    setExpandedItems({
      ...expandedItems,
      [name]: !expandedItems[name]
    });
  };

  return (
    <aside className={`navbar navbar-vertical navbar-expand-lg navbar-dark ${collapsed ? 'navbar-collapsed' : ''}`}>
      <div className="collapse navbar-collapse" id="navbar-menu">
        <ul className="navbar-nav pt-lg-3">
          {navItems.map((item) => (
            <li key={item.name} className={`nav-item ${item.children && expandedItems[item.name] ? 'active' : ''}`}>
              {item.children ? (
                <>
                  <a className="nav-link" onClick={() => toggleExpand(item.name)}>
                    <span className="nav-link-icon d-md-none d-lg-inline-block">
                      <item.icon size={24} stroke={1.5} />
                    </span>
                    <span className="nav-link-title">
                      {item.name}
                    </span>
                    <span className="nav-link-toggle"></span>
                  </a>
                  <div className={`dropdown-menu ${expandedItems[item.name] ? 'show' : ''}`}>
                    <div className="dropdown-menu-columns">
                      <div className="dropdown-menu-column">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) => 
                              `dropdown-item ${isActive ? 'active' : ''}`
                            }
                          >
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/'}
                >
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <item.icon size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">
                    {item.name}
                  </span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
