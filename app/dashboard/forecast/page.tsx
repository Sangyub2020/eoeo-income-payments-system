'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 임시 데이터
const forecastData = [
  { date: '2024-02-01', 네이버: 5000000, 카카오: 3000000, 인스타그램: 2000000 },
  { date: '2024-02-08', 네이버: 6000000, 카카오: 3500000, 인스타그램: 2500000 },
  { date: '2024-02-15', 네이버: 5500000, 카카오: 4000000, 인스타그램: 3000000 },
  { date: '2024-02-22', 네이버: 7000000, 카카오: 4500000, 인스타그램: 3500000 },
  { date: '2024-02-29', 네이버: 6500000, 카카오: 5000000, 인스타그램: 4000000 },
];

const brandForecast = [
  { brand: '브랜드 A', amount: 15000000, date: '2024-02-01' },
  { brand: '브랜드 B', amount: 12000000, date: '2024-02-05' },
  { brand: '브랜드 C', amount: 8000000, date: '2024-02-10' },
];

export default function ForecastPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대금집행 예측</h1>
        <p className="text-gray-600 mt-2">플랫폼별 및 브랜드별 대금집행 예측을 확인합니다</p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>플랫폼별 대금집행 예측</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
                <Legend />
                <Line type="monotone" dataKey="네이버" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="카카오" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="인스타그램" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>브랜드별 대금집행 예측</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-700">브랜드</th>
                    <th className="text-right p-4 font-medium text-gray-700">예상 금액</th>
                    <th className="text-left p-4 font-medium text-gray-700">예상일</th>
                  </tr>
                </thead>
                <tbody>
                  {brandForecast.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4">{item.brand}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                      <td className="p-4 text-sm text-gray-500">{formatDate(item.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



