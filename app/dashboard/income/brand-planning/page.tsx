'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrandPlanningList } from '@/components/brand-planning/brand-planning-list';
import { BrandPlanningMonthlyChart } from '@/components/brand-planning/brand-planning-monthly-chart';
import { BrandPlanningAdvanceBalanceList } from '@/components/brand-planning/brand-planning-advance-balance-list';
import { useState } from 'react';

export default function BrandPlanningPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">브랜드기획팀 입금 관리</h1>
        <p className="text-gray-400 mt-2">브랜드기획팀 입금 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">월별 현황</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
          <TabsTrigger value="advance-balance">선/잔금 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <BrandPlanningMonthlyChart />
        </TabsContent>

        <TabsContent value="list">
          <BrandPlanningList onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="advance-balance">
          <BrandPlanningAdvanceBalanceList onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



