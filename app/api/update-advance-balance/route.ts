import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    // 먼저 '분할X' 값을 가진 레코드들을 찾기
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('income_records')
      .select('id')
      .eq('advance_balance', '분할X');

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 레코드가 없습니다.',
        updatedCount: 0,
      });
    }

    // 배치로 업데이트
    const { error: updateError, count } = await supabaseAdmin
      .from('income_records')
      .update({ advance_balance: '일시불' })
      .eq('advance_balance', '분할X')
      .select();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `성공적으로 ${records.length}개의 레코드를 업데이트했습니다.`,
      updatedCount: records.length,
    });
  } catch (error) {
    console.error('업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}




