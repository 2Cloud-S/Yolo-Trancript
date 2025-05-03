'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart2,
  CheckCircle,
  Puzzle,
  Eye,
  X,
  Home,
  Settings,
  Book
} from 'lucide-react';
import YoloMascot from '@/components/YoloMascot';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'All Channels', href: '/dashboard', icon: Home },
    { 
      name: 'Analytics', 
      href: '/dashboard/analytics', 
      icon: BarChart2,
      description: 'View usage statistics and performance metrics'
    },
    { 
      name: 'Quality Control', 
      href: '/dashboard/quality', 
      icon: CheckCircle,
      description: 'Review and edit transcriptions'
    },
    { 
      name: 'Custom Vocabulary', 
      href: '/dashboard/custom-vocabulary', 
      icon: Book,
      description: 'Manage specialized terms for better accuracy'
    },
    { 
      name: 'Integration Hub', 
      href: '/dashboard/integrations', 
      icon: Puzzle,
      description: 'Manage API keys and webhooks'
    },
    { 
      name: 'Accessibility', 
      href: '/dashboard/accessibility', 
      icon: Eye,
      description: 'Configure accessibility settings'
    }
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 transform bg-white border-r-2 border-gray-900 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b-2 border-gray-900 px-4 bg-[#FFD60A]">
            <div className="flex items-center">
              <YoloMascot size="sm" pose="listening" className="mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden rounded-md p-1 hover:bg-yellow-400"
            >
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-3 text-sm font-bold border ${
                    isActive(item.href)
                      ? 'bg-[#FFD60A] text-gray-900 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href) ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.description && (
                      <span className={`text-xs ${isActive(item.href) ? 'text-gray-700' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 p-4">
            <Link
              href="/dashboard/settings"
              className={`flex items-center px-3 py-3 text-sm font-bold rounded-md border ${
                isActive('/dashboard/settings')
                  ? 'bg-[#FFD60A] text-gray-900 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Settings className={`mr-3 h-5 w-5 ${isActive('/dashboard/settings') ? 'text-gray-900' : 'text-gray-500'}`} />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 