'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TeamStat {
  name: string;
  totalAmount: number;
}

export default function DashboardPage() {
  const [incomeStats, setIncomeStats] = useState<TeamStat[]>([]);
  const [paymentStats, setPaymentStats] = useState<TeamStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // 입금 내역 조회
      const incomeResponse = await fetch('/api/income/team-stats');
      if (incomeResponse.ok) {
        const incomeData = await incomeResponse.json();
        if (incomeData.success) {
          setIncomeStats(incomeData.data);
        }
      }

      // 송금 내역 조회 (아직 구현되지 않음)
      // TODO: 송금 내역 API 구현 후 활성화
      // const paymentResponse = await fetch('/api/payments/team-stats');
      // if (paymentResponse.ok) {
      //   const paymentData = await paymentResponse.json();
      //   if (paymentData.success) {
      //     setPaymentStats(paymentData.data);
      //   }
      // }

      // 임시로 빈 배열 설정
      setPaymentStats([]);
    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = incomeStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
  const totalPayment = paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Home</h1>
        <p className="text-gray-400 mt-2">팀별 입금 및 송금 현황을 한눈에 확인하세요</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 입금 내역 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-300">입금 내역</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
              {incomeStats.map((stat) => (
                <Card key={stat.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">{stat.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{formatCurrency(stat.totalAmount)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cyan-300">입금 합계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
          </div>

          {/* 송금 내역 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-purple-300">송금 내역</h2>
            </div>
            {paymentStats.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  {paymentStats.map((stat) => (
                    <Card key={stat.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">{stat.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{formatCurrency(stat.totalAmount)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-300">송금 합계</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{formatCurrency(totalPayment)}</div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-400">송금 내역 데이터가 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
