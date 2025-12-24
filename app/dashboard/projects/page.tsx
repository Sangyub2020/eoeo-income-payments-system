'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProjectSingleForm } from '@/components/projects/project-single-form';
import { ProjectBulkForm } from '@/components/projects/project-bulk-form';
import { ProjectList } from '@/components/projects/project-list';
import { useState } from 'react';

export default function ProjectsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">프로젝트 형식 관리</h1>
        <p className="text-gray-600 mt-2">프로젝트 형식 정보를 등록하고 관리합니다</p>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList>
          <TabsTrigger value="register">등록</TabsTrigger>
          <TabsTrigger value="list">목록</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <ProjectSingleForm key={`single-${refreshKey}`} onSuccess={handleSuccess} />
          <ProjectBulkForm key={`bulk-${refreshKey}`} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="list">
          <ProjectList key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}






