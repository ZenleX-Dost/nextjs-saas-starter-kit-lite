'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const pathname = usePathname();

  // Always use dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu button + Logo (mobile) */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">RadiKal</span>
            </div>
          </div>

          {/* Center: Breadcrumb (desktop) */}
          <div className="hidden lg:flex items-center space-x-2 text-sm">
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Home
            </Link>
            {pathname !== '/' && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 dark:text-white font-medium capitalize">
                  {pathname.split('/').filter(Boolean).join(' / ')}
                </span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Notifications */}
            <button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* User Avatar Placeholder */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
