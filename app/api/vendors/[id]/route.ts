import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
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
      .update({
        code,
        name,
        business_number: businessNumber || null,
        invoice_email: invoiceEmail || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 코드입니다.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('거래처 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}



