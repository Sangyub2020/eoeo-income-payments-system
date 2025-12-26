'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DollarSign, CreditCard, Database, Building2, FolderKanban, User, Home } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const sections = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: '입금관리',
    icon: DollarSign,
    children: [
      { name: '온라인커머스팀', href: '/dashboard/income/online-commerce', icon: DollarSign },
      { name: '글로벌마케팅솔루션팀', href: '/dashboard/income/global-marketing', icon: DollarSign },
      { name: '글로벌세일즈팀', href: '/dashboard/income/global-sales', icon: DollarSign },
      { name: '브랜드기획팀', href: '/dashboard/income/brand-planning', icon: DollarSign },
      { name: '기타 income', href: '/dashboard/income/other-income', icon: DollarSign },
    ],
  },
  {
    name: '송금관리',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    name: '마스터 데이터 등록',
    icon: Database,
    children: [
      { name: '거래처 관리', href: '/dashboard/vendors', icon: Building2 },
      { name: '프로젝트 유형', href: '/dashboard/projects', icon: FolderKanban },
      { name: '브랜드 관리', href: '/dashboard/brands', icon: Building2 },
      { name: '인플루언서 계좌 등록', href: '/dashboard/influencer-accounts', icon: User },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['마스터 데이터 등록']));

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-purple-500/20 bg-slate-800/40 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-purple-500/20 px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">EOEO 관리</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.name);
          const hasActiveChild = section.children?.some(
            (child) => pathname === child.href || pathname?.startsWith(child.href + '/')
          );
          // Home은 정확히 '/dashboard'일 때만 활성화
          const isSectionActive = section.href === '/dashboard' 
            ? pathname === '/dashboard'
            : pathname === section.href || pathname?.startsWith(section.href + '/');

          if (section.children) {
            return (
              <div key={section.name}>
                <button
                  onClick={() => toggleSection(section.name)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    hasActiveChild
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                      : 'text-gray-300 hover:bg-white/5 hover:text-cyan-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {section.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                      
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            isActive
                              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 font-medium border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                              : 'text-gray-400 hover:bg-white/5 hover:text-cyan-300'
                          )}
                        >
                          <ChildIcon className="h-4 w-4" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={section.name}
              href={section.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isSectionActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-cyan-300'
              )}
            >
              <Icon className="h-5 w-5" />
              {section.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

