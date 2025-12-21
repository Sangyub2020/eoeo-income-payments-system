import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const {
      email,
      tiktokHandle,
      fullName,
      achRoutingNumber,
      swiftCode,
      accountNumber,
      accountType,
      wiseTag,
      address,
      phoneNumber,
    } = body;

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: '계좌 소유자 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('influencer_accounts')
      .update({
        email: email || null,
        tiktok_handle: tiktokHandle || null,
        full_name: fullName,
        ach_routing_number: achRoutingNumber || null,
        swift_code: swiftCode || null,
        account_number: accountNumber || null,
        account_type: accountType || null,
        wise_tag: wiseTag || null,
        address: address || null,
        phone_number: phoneNumber || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('인플루언서 계좌 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}



