'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, Database, FileText, ChevronDown, User } from 'lucide-react';
import Image from 'next/image';
import { useData } from '@/context/DataContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { data } = useData();
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsReportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use only the specific stages shown in the screenshot
  const allStages = [
    'booms',
    'sip1', 
    'sip1a',
    'sip2',
    'sip3',
    'sip4',
    'rr',
    'uv1',
    'sip5',
    'ftest',
    'lec rec',
    'ct',
    'uv2',
    'cabwt',
    'sip6',
    'cfc',
    'cabsip',
    'uv3'
  ];

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Admin Panel', href: '/admin', icon: Settings },
    { name: 'Seed DB', href: '/seed', icon: Database },
  ];

  const reportOptions = [
    { name: 'Combined Report', href: '/report?type=combined', description: 'Combined DPU Performance' },
    { name: 'Production Report', href: '/report?type=production', description: 'Production DPU Performance' },
    { name: 'DPDI Report', href: '/report?type=dpdi', description: 'DPDI DPU Performance' },
    ...allStages.map(stage => ({
      name: `${stage} Report`,
      href: `/report?type=stage&stage=${encodeURIComponent(stage)}`,
      description: `${stage} Performance Analysis`
    }))
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
              
              {/* Report Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    pathname.startsWith('/report')
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-black hover:bg-opacity-10'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Reports</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isReportDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isReportDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {reportOptions.map((option, index) => (
                        <Link
                          key={index}
                          href={option.href}
                          onClick={() => setIsReportDropdownOpen(false)}
                          className="block px-4 py-2 text-xs hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="font-medium text-gray-900">{option.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
