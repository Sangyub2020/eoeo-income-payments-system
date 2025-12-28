'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrandSingleForm } from '@/components/brands/brand-single-form';
import { BrandBulkForm } from '@/components/brands/brand-bulk-form';
import { BrandList } from '@/components/brands/brand-list';
import { useState } from 'react';

export default function BrandsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // 등록 성공 시 목록 새로고침
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">브랜드 관리</h1>
        <p className="text-gray-400 mt-2">브랜드 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="register">등록</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <BrandSingleForm key={`single-${refreshKey}`} onSuccess={handleSuccess} />
          <BrandBulkForm key={`bulk-${refreshKey}`} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="list">
          <BrandList key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

