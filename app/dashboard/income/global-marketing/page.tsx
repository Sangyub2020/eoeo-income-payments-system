'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlobalMarketingList } from '@/components/global-marketing/global-marketing-list';
import { GlobalMarketingMonthlyChart } from '@/components/global-marketing/global-marketing-monthly-chart';
import { GlobalMarketingOutstanding } from '@/components/global-marketing/global-marketing-outstanding';
import { useState } from 'react';

export default function GlobalMarketingPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">글로벌 마케팅솔루션팀 입금 관리</h1>
        <p className="text-gray-400 mt-2">글로벌 마케팅솔루션팀 입금 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">월별 현황</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
          <TabsTrigger value="outstanding">미수금 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <GlobalMarketingMonthlyChart />
        </TabsContent>

        <TabsContent value="list">
          <GlobalMarketingList onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="outstanding">
          <GlobalMarketingOutstanding onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



