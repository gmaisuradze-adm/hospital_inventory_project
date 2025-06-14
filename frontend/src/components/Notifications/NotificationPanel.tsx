import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { markAsRead, markAllAsRead, removeNotification } from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-success-100 rounded-full flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-success-600" />
            </div>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-warning-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-error-100 rounded-full flex items-center justify-center">
              <XMarkIcon className="h-5 w-5 text-error-600" />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden z-50 lg:static lg:inset-auto lg:overflow-visible ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-secondary-900">
                    Notifications
                  </h2>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-md bg-white text-secondary-400 hover:text-secondary-500 focus:ring-2 focus:ring-primary-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Mark all as read ({unreadCount})
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-secondary-500">
                    <svg
                      className="h-12 w-12 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M15 17h5l-5 5h5m-5-5v5m-5-5H5l5-5H5m5 5V7"
                      />
                    </svg>
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-4 px-6 pb-6">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative rounded-lg border p-4 ${
                          notification.isRead
                            ? 'bg-white border-secondary-200'
                            : 'bg-primary-50 border-primary-200'
                        }`}
                      >
                        <div className="flex">
                          {getNotificationIcon(notification.type)}
                          <div className="ml-3 flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-secondary-900">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-secondary-600">
                                  {notification.message}
                                </p>
                                <p className="mt-2 text-xs text-secondary-400">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              <div className="ml-4 flex space-x-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-primary-600 hover:text-primary-500"
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveNotification(notification.id)}
                                  className="text-xs text-secondary-400 hover:text-secondary-500"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
