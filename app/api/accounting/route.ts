import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// 회계 데이터 조회 (income_record_id로 또는 여러 개 한 번에)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incomeRecordId = searchParams.get('incomeRecordId');
    const incomeRecordIds = searchParams.get('incomeRecordIds'); // 쉼표로 구분된 ID 목록

    // 여러 ID를 한 번에 조회하는 경우
    if (incomeRecordIds) {
      const ids = incomeRecordIds.split(',').filter(id => id.trim());
      
      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'incomeRecordIds가 필요합니다.' },
          { status: 400 }
        );
      }

      // income_records에서 회계 데이터 조회
      const { data: incomeRecords, error: incomeError } = await supabaseAdmin
        .from('income_records')
        .select('id, project_period_start, project_period_end, target_margin_rate, final_month_actual_cost, final_month_actual_cost_currency')
        .in('id', ids);

      if (incomeError) {
        throw incomeError;
      }

      // project_monthly_expenses에서 월별 실비 조회
      const { data: monthlyExpenses, error: expensesError } = await supabaseAdmin
        .from('project_monthly_expenses')
        .select('*')
        .in('income_record_id', ids)
        .order('income_record_id, month', { ascending: true });

      if (expensesError) {
        throw expensesError;
      }

      // 결과를 income_record_id별로 그룹화
      const result: Record<string, {
        projectPeriodStart: string | null;
        projectPeriodEnd: string | null;
        targetMarginRate: number | null;
        finalMonthActualCost: number | null;
        monthlyExpenses: Array<{ id?: string; month: string; expenseAmount: number }>;
      }> = {};

      incomeRecords?.forEach(record => {
        result[record.id] = {
          projectPeriodStart: record.project_period_start || null,
          projectPeriodEnd: record.project_period_end || null,
          targetMarginRate: record.target_margin_rate || null,
          finalMonthActualCost: record.final_month_actual_cost || null,
          finalMonthActualCostCurrency: record.final_month_actual_cost_currency || 'KRW',
          monthlyExpenses: (monthlyExpenses || [])
            .filter(exp => exp.income_record_id === record.id)
            .map(exp => ({
              id: exp.id,
              month: exp.month,
              expenseAmount: Number(exp.expense_amount) || 0,
              expenseCurrency: exp.expense_currency || 'KRW',
            })),
        };
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 단일 ID 조회 (기존 로직)
    if (!incomeRecordId) {
      return NextResponse.json(
        { success: false, error: 'incomeRecordId 또는 incomeRecordIds가 필요합니다.' },
        { status: 400 }
      );
    }

    // income_records에서 회계 데이터 조회
    const { data: incomeRecord, error: incomeError } = await supabaseAdmin
      .from('income_records')
      .select('project_period_start, project_period_end, target_margin_rate, final_month_actual_cost, final_month_actual_cost_currency')
      .eq('id', incomeRecordId)
      .single();

    if (incomeError) {
      throw incomeError;
    }

    // project_monthly_expenses에서 월별 실비 조회
    const { data: monthlyExpenses, error: expensesError } = await supabaseAdmin
      .from('project_monthly_expenses')
      .select('*')
      .eq('income_record_id', incomeRecordId)
      .order('month', { ascending: true });

    if (expensesError) {
      throw expensesError;
    }

    return NextResponse.json({
      success: true,
      data: {
        projectPeriodStart: incomeRecord?.project_period_start,
        projectPeriodEnd: incomeRecord?.project_period_end,
        targetMarginRate: incomeRecord?.target_margin_rate,
        finalMonthActualCost: incomeRecord?.final_month_actual_cost,
        monthlyExpenses: (monthlyExpenses || []).map(exp => ({
          id: exp.id,
          month: exp.month,
          expenseAmount: Number(exp.expense_amount) || 0,
          expenseCurrency: exp.expense_currency || 'KRW',
        })),
        finalMonthActualCostCurrency: incomeRecord?.final_month_actual_cost_currency || 'KRW',
      },
    });
  } catch (error) {
    console.error('회계 데이터 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 회계 데이터 저장/업데이트
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      incomeRecordId,
      projectPeriodStart,
      projectPeriodEnd,
      targetMarginRate,
      finalMonthActualCost,
      finalMonthActualCostCurrency,
      monthlyExpenses, // [{ month: "2501", expenseAmount: 20000000, expenseCurrency: "KRW" }, ...]
    } = body;

    if (!incomeRecordId) {
      return NextResponse.json(
        { success: false, error: 'incomeRecordId가 필요합니다.' },
        { status: 400 }
      );
    }

    // income_records 업데이트
    const updateData: any = {};
    if (projectPeriodStart !== undefined) updateData.project_period_start = projectPeriodStart || null;
    if (projectPeriodEnd !== undefined) updateData.project_period_end = projectPeriodEnd || null;
    if (targetMarginRate !== undefined) updateData.target_margin_rate = targetMarginRate || null;
    if (finalMonthActualCost !== undefined) updateData.final_month_actual_cost = finalMonthActualCost || null;
    if (finalMonthActualCostCurrency !== undefined) updateData.final_month_actual_cost_currency = finalMonthActualCostCurrency || 'KRW';

    const { error: updateError } = await supabaseAdmin
      .from('income_records')
      .update(updateData)
      .eq('id', incomeRecordId);

    if (updateError) {
      throw updateError;
    }

    // project_monthly_expenses 업데이트
    if (monthlyExpenses !== undefined && Array.isArray(monthlyExpenses)) {
      // 기존 데이터 삭제
      const { error: deleteError } = await supabaseAdmin
        .from('project_monthly_expenses')
        .delete()
        .eq('income_record_id', incomeRecordId);

      if (deleteError) {
        throw deleteError;
      }

      // 새 데이터 삽입
      if (monthlyExpenses.length > 0) {
        const expensesToInsert = monthlyExpenses.map((exp: any) => ({
          income_record_id: incomeRecordId,
        month: exp.month,
        expense_amount: exp.expenseAmount || 0,
        expense_currency: exp.expenseCurrency || 'KRW',
        }));

        const { error: insertError } = await supabaseAdmin
          .from('project_monthly_expenses')
          .insert(expensesToInsert);

        if (insertError) {
          throw insertError;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('회계 데이터 저장 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

