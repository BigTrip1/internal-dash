'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, Database, FileText, ChevronDown, User, Search, Filter, TrendingUp, Target, Zap } from 'lucide-react';
import Image from 'next/image';
import { useData } from '@/context/DataContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { data } = useData();
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const reportCategories = {
    overview: {
      name: 'OVERVIEW REPORTS',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      reports: [
        { 
          name: 'COMBINED REPORT', 
          href: '/report?type=combined', 
          description: 'Overall Business Performance',
          icon: TrendingUp,
          badge: 'Primary'
        },
        { 
          name: 'PRODUCTION REPORT', 
          href: '/report?type=production', 
          description: 'Manufacturing Quality Metrics',
          icon: Target,
          badge: 'Core'
        },
        { 
          name: 'DPDI REPORT', 
          href: '/report?type=dpdi', 
          description: 'Pre-Delivery Inspection Analysis',
          icon: Zap,
          badge: 'Critical'
        }
      ]
    },
    stages: {
      name: 'STAGE REPORTS',
      icon: Settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      reports: allStages.map(stage => ({
        name: `${stage.toUpperCase()} REPORT`,
        href: `/report?type=stage&stage=${encodeURIComponent(stage)}`,
        description: `${stage.toUpperCase()} Quality Analysis`,
        icon: Target,
        badge: 'Stage'
      }))
    }
  };

  // Filter reports based on search and category
  const getFilteredReports = () => {
    const allReports = [
      ...reportCategories.overview.reports,
      ...reportCategories.stages.reports
    ];

    let filtered = allReports;

    // Filter by category
    if (selectedCategory === 'overview') {
      filtered = reportCategories.overview.reports;
    } else if (selectedCategory === 'stages') {
      filtered = reportCategories.stages.reports;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();

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
              
              {/* Enhanced Report Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsReportDropdownOpen(!isReportDropdownOpen);
                    if (!isReportDropdownOpen) {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }
                  }}
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
                
                {/* Enhanced Dropdown Menu */}
                {isReportDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header with Search and Filters */}
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <FileText className="w-5 h-5 text-black" />
                        <h3 className="text-lg font-bold text-black">QUALITY REPORTS</h3>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search reports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Category Filters */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                            selectedCategory === 'all' 
                              ? 'bg-black text-yellow-400' 
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          ALL ({reportCategories.overview.reports.length + reportCategories.stages.reports.length})
                        </button>
                        <button
                          onClick={() => setSelectedCategory('overview')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                            selectedCategory === 'overview' 
                              ? 'bg-black text-yellow-400' 
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          OVERVIEW ({reportCategories.overview.reports.length})
                        </button>
                        <button
                          onClick={() => setSelectedCategory('stages')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                            selectedCategory === 'stages' 
                              ? 'bg-black text-yellow-400' 
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          STAGES ({reportCategories.stages.reports.length})
                        </button>
                      </div>
                    </div>
                    
                    {/* Scrollable Report List */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredReports.length > 0 ? (
                        <div className="p-2">
                          {filteredReports.map((report, index) => (
                            <Link
                              key={index}
                              href={report.href}
                              onClick={() => setIsReportDropdownOpen(false)}
                              className="block p-3 mb-1 rounded-lg hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-yellow-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <report.icon className={`w-4 h-4 ${report.badge === 'Primary' ? 'text-blue-600' : report.badge === 'Core' ? 'text-green-600' : report.badge === 'Critical' ? 'text-red-600' : 'text-gray-600'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                                        {report.name}
                                      </h4>
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                        report.badge === 'Primary' ? 'bg-blue-100 text-blue-700' :
                                        report.badge === 'Core' ? 'bg-green-100 text-green-700' :
                                        report.badge === 'Critical' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {report.badge}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                      {report.description}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg] group-hover:text-yellow-600 transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No reports found</p>
                          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Total Reports: {reportCategories.overview.reports.length + reportCategories.stages.reports.length}</span>
                        <span>JCB Quality Management</span>
                      </div>
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
