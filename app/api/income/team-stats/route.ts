import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 각 팀별 입금액 집계
    const teams = [
      { name: '온라인커머스팀', table: 'online_commerce_team' },
      { name: '글로벌마케팅솔루션팀', table: 'global_marketing_team' },
      { name: '글로벌세일즈팀', table: 'global_sales_team' },
      { name: '브랜드기획팀', table: 'brand_planning_team' },
    ];

    const teamStats = await Promise.all(
      teams.map(async (team) => {
        try {
          // 모든 데이터 가져오기 (페이지네이션)
          let allData: any[] = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await supabaseAdmin
              .from(team.table)
              .select('deposit_amount')
              .range(from, from + pageSize - 1);

            if (error) {
              console.error(`${team.name} 조회 오류:`, error);
              return { name: team.name, totalAmount: 0 };
            }

            if (data && data.length > 0) {
              allData = [...allData, ...data];
              from += pageSize;
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }

          // 입금액 합계 계산
          const totalAmount = allData.reduce((sum, record) => {
            const amount = record.deposit_amount ? Number(record.deposit_amount) : 0;
            return sum + amount;
          }, 0);

          return { name: team.name, totalAmount };
        } catch (error) {
          console.error(`${team.name} 집계 오류:`, error);
          return { name: team.name, totalAmount: 0 };
        }
      })
    );

    return NextResponse.json({ success: true, data: teamStats });
  } catch (error) {
    console.error('팀별 입금액 집계 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}




