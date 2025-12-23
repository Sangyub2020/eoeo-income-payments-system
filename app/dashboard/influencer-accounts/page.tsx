'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InfluencerAccountSingleForm } from '@/components/influencer-accounts/influencer-account-single-form';
import { InfluencerAccountBulkForm } from '@/components/influencer-accounts/influencer-account-bulk-form';
import { InfluencerAccountList } from '@/components/influencer-accounts/influencer-account-list';
import { useState } from 'react';

export default function InfluencerAccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">인플루언서 계좌 등록</h1>
        <p className="text-gray-600 mt-2">인플루언서 계좌 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList>
          <TabsTrigger value="register">등록</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <InfluencerAccountSingleForm key={`single-${refreshKey}`} onSuccess={handleSuccess} />
          <InfluencerAccountBulkForm key={`bulk-${refreshKey}`} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="list">
          <InfluencerAccountList key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}




