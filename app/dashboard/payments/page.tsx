import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

// 임시 데이터
const paymentData = [
  {
    id: '1',
    date: '2024-01-15',
    brand: '브랜드 A',
    platform: '네이버',
    amount: 2000000,
    status: 'paid' as const,
    paidDate: '2024-01-18',
  },
  {
    id: '2',
    date: '2024-01-20',
    brand: '브랜드 B',
    platform: '카카오',
    amount: 1500000,
    status: 'pending' as const,
    dueDate: '2024-02-05',
  },
];

export default function PaymentsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">결제 관리</h1>
          <p className="text-gray-600 mt-2">EOEO all sns payments 현황을 관리합니다</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          결제 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>결제 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-700">날짜</th>
                  <th className="text-left p-4 font-medium text-gray-700">브랜드</th>
                  <th className="text-left p-4 font-medium text-gray-700">플랫폼</th>
                  <th className="text-right p-4 font-medium text-gray-700">금액</th>
                  <th className="text-left p-4 font-medium text-gray-700">상태</th>
                  <th className="text-left p-4 font-medium text-gray-700">마감일/지급일</th>
                </tr>
              </thead>
              <tbody>
                {paymentData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{formatDate(item.date)}</td>
                    <td className="p-4">{item.brand}</td>
                    <td className="p-4">{item.platform}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'paid' ? '지급완료' : item.status === 'pending' ? '대기중' : '연체'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {item.status === 'paid' && item.paidDate
                        ? formatDate(item.paidDate)
                        : item.dueDate
                        ? formatDate(item.dueDate)
                        : '-'}
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




