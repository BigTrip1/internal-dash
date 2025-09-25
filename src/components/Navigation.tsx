'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, Database, ChevronDown, User, FileText } from 'lucide-react';
import Image from 'next/image';
import { useData } from '@/context/DataContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { data } = useData();

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Admin Panel', href: '/admin', icon: Settings },
  { name: 'Seed DB', href: '/seed', icon: Database },
];

  return (
    <div className="jcb-header">
      <div className="w-full">
        {/* Main Header Row - Ultra Compact */}
        <div className="relative flex items-center justify-between px-4 py-1.5">
          {/* Left Section - Logo & Brand */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-white rounded p-0.5 shadow-sm">
              <Image 
                src="/jcb-logo.png" 
                alt="JCB Logo" 
                width={20} 
                height={20}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs font-bold text-black">JCB Digital Factory</h2>
              <p className="text-xs text-black opacity-80">Quality Management</p>
            </div>
          </div>
          
          {/* Center Section - Report Title (Absolute Centered) */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="text-center">
              <h1 className="text-sm font-bold text-black">INTERNAL QUALITY PERFORMANCE REPORT</h1>
              <div className="flex items-center justify-center space-x-1 mt-0.5">
                <div className="w-1 h-1 bg-green-600 rounded-full animate-pulse"></div>
                <p className="text-xs text-black opacity-80">
                  {data.length > 0 ? `${data[0]?.date} to ${data[data.length - 1]?.date}` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Section - Navigation & User */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'text-black hover:bg-black hover:bg-opacity-10'
                    }`}
                  >
                    <item.icon className="w-3 h-3" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-black">Admin User</p>
                <p className="text-xs text-black opacity-75">System Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
