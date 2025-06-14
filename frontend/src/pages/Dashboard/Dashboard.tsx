import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import {
  ComputerDesktopIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Mock data - in real app, this would come from API
  const stats = {
    totalInventory: 1247,
    availableItems: 1089,
    inUseItems: 158,
    lowStockItems: 23,
    pendingRequests: 15,
    completedRequests: 142,
    totalUsers: 67,
    activeUsers: 62,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'inventory',
      title: 'New laptop added to inventory',
      description: 'MacBook Pro 14" M3 - Serial: ABC123456',
      time: '2 hours ago',
      icon: ComputerDesktopIcon,
      color: 'text-primary-600',
    },
    {
      id: 2,
      type: 'request',
      title: 'IT Request completed',
      description: 'Printer installation in Room 205',
      time: '4 hours ago',
      icon: CheckCircleIcon,
      color: 'text-success-600',
    },
    {
      id: 3,
      type: 'procurement',
      title: 'Procurement request approved',
      description: '10x Network switches for server room',
      time: '6 hours ago',
      icon: ShoppingCartIcon,
      color: 'text-warning-600',
    },
    {
      id: 4,
      type: 'user',
      title: 'New user registered',
      description: 'Dr. Sarah Wilson - IT Staff',
      time: '1 day ago',
      icon: UsersIcon,
      color: 'text-secondary-600',
    },
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: '23 items are running low on stock',
      priority: 'high',
    },
    {
      id: 2,
      type: 'info',
      title: 'Maintenance Scheduled',
      message: 'Server maintenance scheduled for this weekend',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'error',
      title: 'License Expiry',
      message: '5 software licenses will expire next month',
      priority: 'high',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-secondary-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-secondary-900">
                {value.toLocaleString()}
              </dd>
              {description && (
                <dd className="text-sm text-secondary-600">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.firstName || user?.username}!
            </h1>
            <p className="mt-1 text-primary-100">
              Welcome to the Hospital IT Inventory Management System
            </p>
          </div>
          <div className="hidden md:block">
            <ChartBarIcon className="h-16 w-16 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inventory"
          value={stats.totalInventory}
          icon={ComputerDesktopIcon}
          color="text-primary-600"
          description="Items tracked"
        />
        <StatCard
          title="Available Items"
          value={stats.availableItems}
          icon={CheckCircleIcon}
          color="text-success-600"
          description="Ready for use"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={ClockIcon}
          color="text-warning-600"
          description="Awaiting action"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UsersIcon}
          color="text-secondary-600"
          description="System users"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-secondary-900">
                Recent Activity
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className={`h-6 w-6 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-secondary-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-secondary-900">
                System Alerts
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'error'
                        ? 'bg-error-50 border-error-200'
                        : alert.type === 'warning'
                        ? 'bg-warning-50 border-warning-200'
                        : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {alert.type === 'error' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-error-600" />
                        ) : alert.type === 'warning' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-secondary-900">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-secondary-600 mt-1">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-secondary-900">
            Quick Actions
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
              <ComputerDesktopIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="text-sm font-medium text-secondary-900">
                Add Inventory Item
              </h4>
              <p className="text-xs text-secondary-600 mt-1">
                Add new equipment to inventory
              </p>
            </button>

            <button className="p-4 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
              <ClipboardDocumentListIcon className="h-8 w-8 text-success-600 mb-2" />
              <h4 className="text-sm font-medium text-secondary-900">
                Create IT Request
              </h4>
              <p className="text-xs text-secondary-600 mt-1">
                Submit new IT service request
              </p>
            </button>

            <button className="p-4 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
              <ShoppingCartIcon className="h-8 w-8 text-warning-600 mb-2" />
              <h4 className="text-sm font-medium text-secondary-900">
                Procurement Request
              </h4>
              <p className="text-xs text-secondary-600 mt-1">
                Request new equipment purchase
              </p>
            </button>

            <button className="p-4 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
              <ChartBarIcon className="h-8 w-8 text-secondary-600 mb-2" />
              <h4 className="text-sm font-medium text-secondary-900">
                Generate Report
              </h4>
              <p className="text-xs text-secondary-600 mt-1">
                Create system reports
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
