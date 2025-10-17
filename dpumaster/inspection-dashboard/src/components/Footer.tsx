'use client';

import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <div className="jcb-footer">
      <div className="flex items-center space-x-3">
        <div className="jcb-logo">
          <Image 
            src="/jcb-logo.png" 
            alt="JCB Logo" 
            width={24} 
            height={24}
            className="object-contain"
          />
        </div>
        <span className="text-black font-medium text-sm">DIGITAL FACTORY</span>
      </div>
      <div className="text-black text-xs">
        J.C.Bamford Excavators © 2025
      </div>
    </div>
  );
};

export default Footer;
