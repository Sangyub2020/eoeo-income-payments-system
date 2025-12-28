'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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
        // 프로젝트 코드로 오름차순 정렬 (숫자 크기 기준)
        formattedProjects.sort((a: { code?: string }, b: { code?: string }) => {
          const codeA = a.code || '';
          const codeB = b.code || '';
          // 숫자 부분 추출 및 비교
          const numA = codeA.match(/\d+/)?.[0] || '';
          const numB = codeB.match(/\d+/)?.[0] || '';
          if (numA && numB) {
            const numCompare = parseInt(numA, 10) - parseInt(numB, 10);
            if (numCompare !== 0) return numCompare;
          }
          // 숫자가 같거나 없으면 문자열 비교
          return codeA.localeCompare(codeB);
        });
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

  // 검색 필터링
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentPageProjects = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProjects.slice(start, end);
  };

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentPageProjects = getCurrentPageProjects();
  const allSelected = currentPageProjects.length > 0 && currentPageProjects.every(p => selectedIds.has(p.id!));

  // 검색어 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-gray-300">프로젝트 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded">
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
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10">
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="프로젝트명 또는 코드로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-400 mt-2">
              검색 결과: {filteredProjects.length}개 (전체 {projects.length}개)
            </p>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="p-4 bg-cyan-900/30 border-b border-cyan-500/30 flex items-center justify-between">
            <span className="text-sm font-medium text-cyan-300">
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
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr className="border-b border-gray-600">
                <th className="text-left p-4 font-medium text-gray-300 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-600 bg-slate-700"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-300">프로젝트명</th>
                <th className="text-left p-4 font-medium text-gray-300">프로젝트코드</th>
                <th className="text-left p-4 font-medium text-gray-300 w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {currentPageProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    등록된 프로젝트가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageProjects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-600 hover:bg-slate-700/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id!)}
                        onChange={(e) => handleSelectOne(project.id!, e.target.checked)}
                        className="rounded border-gray-600 bg-slate-700"
                      />
                    </td>
                    <td className="p-4 text-gray-300">{project.name}</td>
                    <td className="p-4 font-medium text-gray-200">{project.code}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete([project.id!])}
                          className="text-red-400 hover:text-red-300"
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









