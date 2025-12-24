'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OnlineCommerceList } from '@/components/online-commerce/online-commerce-list';
import { OnlineCommerceSummary } from '@/components/online-commerce/online-commerce-summary';
import { OnlineCommerceMonthlyChart } from '@/components/online-commerce/online-commerce-monthly-chart';
import { OnlineCommerceOutstanding } from '@/components/online-commerce/online-commerce-outstanding';
import { useState } from 'react';

export default function OnlineCommercePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">온라인커머스팀 입금 관리</h1>
        <p className="text-gray-600 mt-2">온라인커머스팀 입금 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
          <TabsTrigger value="monthly">월별 현황</TabsTrigger>
          <TabsTrigger value="outstanding">미수금 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <OnlineCommerceSummary key={refreshKey} />
        </TabsContent>

        <TabsContent value="list">
          <OnlineCommerceList onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="monthly">
          <OnlineCommerceMonthlyChart />
        </TabsContent>

        <TabsContent value="outstanding">
          <OnlineCommerceOutstanding onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

