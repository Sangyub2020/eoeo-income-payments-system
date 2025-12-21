import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Supabase의 기본 limit는 1000개이므로, 모든 데이터를 가져오기 위해 페이지네이션 사용
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      // 각 반복마다 새로운 쿼리 생성
      let query = supabaseAdmin
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (code) {
        query = query.eq('code', code);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({ success: true, data: allData, count: allData.length });
  } catch (error) {
    console.error('거래처 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, businessNumber, invoiceEmail } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: '코드와 거래처명은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('vendors')
      .insert({
        code,
        name,
        business_number: businessNumber || null,
        invoice_email: invoiceEmail || null,
      })
      .select()
      .single();

    if (error) {
      // 중복 코드 에러 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 코드입니다.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('거래처 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 거래처 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('vendors')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `${ids.length}개의 거래처가 삭제되었습니다.` });
  } catch (error) {
    console.error('거래처 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

