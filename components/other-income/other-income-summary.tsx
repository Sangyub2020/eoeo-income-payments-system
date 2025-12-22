'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProjectSummary {
  project: string;
  totalAmount: number;
  count: number;
}

export function OtherIncomeSummary() {
  const [summary, setSummary] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/other-income-team');
      if (!response.ok) {
        throw new Error('?…ê¸ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      const data = await response.json();
      if (data.success) {
        // Projectë³„ë¡œ ê·¸ë£¹?”í•˜??ì´ê³„ ê³„ì‚°
        const projectMap = new Map<string, { totalAmount: number; count: number }>();

        data.data.forEach((record: any) => {
          const project = record.project || 'ë¯¸ì???;
          const depositAmount = record.deposit_amount || 0;

          if (projectMap.has(project)) {
            const existing = projectMap.get(project)!;
            projectMap.set(project, {
              totalAmount: existing.totalAmount + Number(depositAmount),
              count: existing.count + 1,
            });
          } else {
            projectMap.set(project, {
              totalAmount: Number(depositAmount),
              count: 1,
            });
          }
        });

        const projectSummary: ProjectSummary[] = Array.from(projectMap.entries()).map(([project, data]) => ({
          project,
          totalAmount: data.totalAmount,
          count: data.count,
        }));

        projectSummary.sort((a, b) => b.totalAmount - a.totalAmount);

        setSummary(projectSummary);
        setTotalAmount(projectSummary.reduce((sum, item) => sum + item.totalAmount, 0));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '?????†ëŠ” ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>?„ì²´ ?…ê¸ˆ??/CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
          <p className="text-sm text-gray-500 mt-2">ì´?{summary.length}ê°??„ë¡œ?íŠ¸</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projectë³??…ê¸ˆ??(ë§‰ë? ê·¸ë˜??</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="project" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="totalAmount" fill="#3b82f6" name="?…ê¸ˆ?? />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projectë³??…ê¸ˆ??(?Œì´ ì°¨íŠ¸)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={summary as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ project, percent }: any) => `${project}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="totalAmount"
                >
                  {summary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projectë³??ì„¸ ?„í™©</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-700">Project</th>
                  <th className="text-right p-4 font-medium text-gray-700">?…ê¸ˆ??/th>
                  <th className="text-right p-4 font-medium text-gray-700">ê±´ìˆ˜</th>
                  <th className="text-right p-4 font-medium text-gray-700">?‰ê·  ?…ê¸ˆ??/th>
                </tr>
              </thead>
              <tbody>
                {summary.map((item, index) => (
                  <tr key={item.project} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.project}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                    <td className="p-4 text-right">{item.count}ê±?/td>
                    <td className="p-4 text-right text-gray-600">
                      {formatCurrency(Math.round(item.totalAmount / item.count))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



