'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VendorSingleForm } from '@/components/vendors/vendor-single-form';
import { VendorBulkForm } from '@/components/vendors/vendor-bulk-form';
import { VendorList } from '@/components/vendors/vendor-list';
import { useState } from 'react';

export default function VendorsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // 등록 성공 시 목록 새로고침
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">거래처 관리</h1>
        <p className="text-gray-600 mt-2">거래처 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList>
          <TabsTrigger value="register">등록</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <VendorSingleForm key={`single-${refreshKey}`} onSuccess={handleSuccess} />
          <VendorBulkForm key={`bulk-${refreshKey}`} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="list">
          <VendorList key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}




