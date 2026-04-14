import { Bell, AlertCircle, CheckCircle2, Users, MapPin, Clock, Droplet, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'emergency' | 'match' | 'success' | 'info';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  icon: 'alert' | 'check' | 'users' | 'droplet' | 'map';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'emergency',
    title: 'Critical Blood Request Nearby',
    message: 'O+ blood needed urgently at City General Hospital - 1.2 km away',
    timeAgo: '5 min ago',
    read: false,
    icon: 'alert',
  },
  {
    id: '2',
    type: 'match',
    title: 'You\'ve Been Matched!',
    message: 'Your blood type matches a request. 3 units of O+ needed.',
    timeAgo: '15 min ago',
    read: false,
    icon: 'users',
  },
  {
    id: '3',
    type: 'success',
    title: 'Donation Successful',
    message: 'Your donation has helped save a life. Thank you for your contribution!',
    timeAgo: '2 hours ago',
    read: true,
    icon: 'check',
  },
  {
    id: '4',
    type: 'info',
    title: 'Next Donation Eligible',
    message: 'You can donate again in 45 days. Mark your calendar!',
    timeAgo: '1 day ago',
    read: true,
    icon: 'droplet',
  },
  {
    id: '5',
    type: 'emergency',
    title: 'Multiple Requests in Your Area',
    message: '5 emergency blood requests within 5 km of your location',
    timeAgo: '2 days ago',
    read: true,
    icon: 'map',
  },
];

export function Notifications() {
  const getNotificationColor = (type: string, read: boolean) => {
    if (read) {
      return 'bg-gray-50 border-gray-200';
    }
    switch (type) {
      case 'emergency':
        return 'bg-red-50 border-red-300';
      case 'match':
        return 'bg-blue-50 border-blue-300';
      case 'success':
        return 'bg-green-50 border-green-300';
      case 'info':
        return 'bg-purple-50 border-purple-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIcon = (icon: string, type: string) => {
    const iconClass = `w-6 h-6 ${
      type === 'emergency'
        ? 'text-red-600'
        : type === 'match'
        ? 'text-blue-600'
        : type === 'success'
        ? 'text-green-600'
        : 'text-purple-600'
    }`;

    switch (icon) {
      case 'alert':
        return <AlertCircle className={iconClass} />;
      case 'check':
        return <CheckCircle2 className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'droplet':
        return <Droplet className={iconClass} />;
      case 'map':
        return <MapPin className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? (
                  <>
                    You have <span className="font-semibold text-red-600">{unreadCount} unread</span>{' '}
                    notification{unreadCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  'All caught up!'
                )}
              </p>
            </div>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
              Mark all as read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${getNotificationColor(
                notification.type,
                notification.read
              )}`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.type === 'emergency'
                      ? 'bg-red-100'
                      : notification.type === 'match'
                      ? 'bg-blue-100'
                      : notification.type === 'success'
                      ? 'bg-green-100'
                      : 'bg-purple-100'
                  }`}
                >
                  {getIcon(notification.icon, notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}
                    >
                      {notification.title}
                      {!notification.read && (
                        <span className="ml-2 w-2 h-2 bg-red-600 rounded-full inline-block"></span>
                      )}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-sm mb-2 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{notification.timeAgo}</span>
                    </div>
                    {notification.type === 'emergency' && (
                      <button className="text-xs font-semibold text-red-600 hover:text-red-700">
                        View Request →
                      </button>
                    )}
                    {notification.type === 'match' && (
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Respond Now →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if needed) */}
        {mockNotifications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
