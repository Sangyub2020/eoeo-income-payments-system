'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlobalSalesList } from '@/components/global-sales/global-sales-list';
import { GlobalSalesMonthlyChart } from '@/components/global-sales/global-sales-monthly-chart';
import { GlobalSalesOutstanding } from '@/components/global-sales/global-sales-outstanding';
import { useState } from 'react';

export default function GlobalSalesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">글로벌세일즈팀 입금 관리</h1>
        <p className="text-gray-400 mt-2">글로벌세일즈팀 입금 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">월별 현황</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
          <TabsTrigger value="outstanding">미수금 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <GlobalSalesMonthlyChart />
        </TabsContent>

        <TabsContent value="list">
          <GlobalSalesList onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="outstanding">
          <GlobalSalesOutstanding onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



