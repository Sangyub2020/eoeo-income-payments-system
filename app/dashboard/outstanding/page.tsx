import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

// 임시 데이터
const outstandingData = [
  {
    id: '1',
    brand: '브랜드 A',
    platform: '네이버',
    totalAmount: 5000000,
    pendingAmount: 3000000,
    overdueAmount: 0,
    expectedDate: '2024-02-01',
    status: 'pending' as const,
  },
  {
    id: '2',
    brand: '브랜드 B',
    platform: '카카오',
    totalAmount: 3000000,
    pendingAmount: 2000000,
    overdueAmount: 1000000,
    expectedDate: '2024-01-15',
    status: 'overdue' as const,
  },
];

export default function OutstandingPage() {
  const totalOutstanding = outstandingData.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalOverdue = outstandingData.reduce((sum, item) => sum + item.overdueAmount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">미수금 현황</h1>
        <p className="text-gray-600 mt-2">미수금 및 연체 현황을 확인합니다</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>총 미수금</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연체 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>미수금 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-700">브랜드</th>
                  <th className="text-left p-4 font-medium text-gray-700">플랫폼</th>
                  <th className="text-right p-4 font-medium text-gray-700">총액</th>
                  <th className="text-right p-4 font-medium text-gray-700">미수금</th>
                  <th className="text-right p-4 font-medium text-gray-700">연체</th>
                  <th className="text-left p-4 font-medium text-gray-700">예상일</th>
                  <th className="text-left p-4 font-medium text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody>
                {outstandingData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{item.brand}</td>
                    <td className="p-4">{item.platform}</td>
                    <td className="p-4 text-right">{formatCurrency(item.totalAmount)}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(item.pendingAmount)}</td>
                    <td className="p-4 text-right font-medium text-red-600">
                      {item.overdueAmount > 0 ? formatCurrency(item.overdueAmount) : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {item.expectedDate ? formatDate(item.expectedDate) : '-'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'pending' ? '대기중' : '연체'}
                      </span>
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




