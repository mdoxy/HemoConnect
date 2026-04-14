import { Heart, Droplet, Calendar, FileText } from 'lucide-react';

interface NavigationProps {
  currentPage: 'home' | 'inventory' | 'donate' | 'request';
  onNavigate: (page: 'home' | 'inventory' | 'donate' | 'request') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <Heart className="w-8 h-8" fill="white" />
            <span className="text-xl font-bold">LifeBlood Bank</span>
          </div>
          
          <div className="flex gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                currentPage === 'home' ? 'bg-red-700' : 'hover:bg-red-500'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Home</span>
            </button>
            
            <button
              onClick={() => onNavigate('inventory')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                currentPage === 'inventory' ? 'bg-red-700' : 'hover:bg-red-500'
              }`}
            >
              <Droplet className="w-4 h-4" />
              <span>Inventory</span>
            </button>
            
            <button
              onClick={() => onNavigate('donate')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                currentPage === 'donate' ? 'bg-red-700' : 'hover:bg-red-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Donate</span>
            </button>
            
            <button
              onClick={() => onNavigate('request')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                currentPage === 'request' ? 'bg-red-700' : 'hover:bg-red-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Request Blood</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
