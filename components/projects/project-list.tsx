'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2 } from 'lucide-react';
import { ProjectEditModal } from './project-edit-modal';

const ITEMS_PER_PAGE = 100;

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('프로젝트 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedProjects = data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        setProjects(formattedProjects);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageProjects = getCurrentPageProjects();
      setSelectedIds(new Set(currentPageProjects.map(p => p.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 프로젝트를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      await fetchProjects();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchProjects();
    setEditingProject(null);
  };

  const getCurrentPageProjects = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return projects.slice(start, end);
  };

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const currentPageProjects = getCurrentPageProjects();
  const allSelected = currentPageProjects.length > 0 && currentPageProjects.every(p => selectedIds.has(p.id!));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">프로젝트 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Button onClick={fetchProjects} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
        {selectedIds.size > 0 && (
          <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              {selectedIds.size}개 선택됨
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(Array.from(selectedIds))}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                선택 삭제
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-700">프로젝트명</th>
                <th className="text-left p-4 font-medium text-gray-700">프로젝트코드</th>
                <th className="text-left p-4 font-medium text-gray-700 w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {currentPageProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    등록된 프로젝트가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageProjects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id!)}
                        onChange={(e) => handleSelectOne(project.id!, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">{project.name}</td>
                    <td className="p-4 font-medium">{project.code}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete([project.id!])}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {editingProject && (
        <ProjectEditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}






