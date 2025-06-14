import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNotificationClick }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement global search functionality
    console.log('Search query:', searchQuery);
  };

  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
      <div className="flex justify-between h-16 px-4 sm:px-6 lg:px-0 bg-white shadow-sm border-b border-secondary-200">
        <div className="flex">
          {/* Mobile menu button */}
          <button
            type="button"
            className="px-4 border-r border-secondary-200 text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="w-full px-2 lg:px-6">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative text-secondary-400 focus-within:text-secondary-600">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <form onSubmit={handleSearch}>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-secondary-100 text-secondary-900 placeholder-secondary-500 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-secondary-900 focus:placeholder-secondary-400 sm:text-sm"
                    placeholder="Search inventory, requests, users..."
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={onNotificationClick}
          >
            <span className="sr-only">View notifications</span>
            <div className="relative">
              <BellIcon className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute -top-2 -right-2 h-4 w-4 bg-error-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">3</span>
              </span>
            </div>
          </button>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <button
                type="button"
                className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 lg:p-2 lg:rounded-md lg:hover:bg-secondary-50"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-secondary-400" />
                  <span className="hidden ml-3 text-secondary-700 text-sm font-medium lg:block">
                    <span className="sr-only">Open user menu for</span>
                    {user?.firstName || user?.username}
                  </span>
                  <svg
                    className="hidden flex-shrink-0 ml-1 h-5 w-5 text-secondary-400 lg:block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
