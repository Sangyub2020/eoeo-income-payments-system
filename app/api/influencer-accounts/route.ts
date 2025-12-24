import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('influencer_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('인플루언서 계좌 조회 오류:', error);
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
    const {
      email,
      tiktokHandle,
      tiktokHandles,
      instagramHandles,
      recipientType,
      fullName,
      achRoutingNumber,
      swiftCode,
      accountNumber,
      accountType,
      wiseTag,
      address,
      phoneNumber,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('influencer_accounts')
      .insert({
        email: email || null,
        tiktok_handle: recipientType === 'Business' ? null : (tiktokHandle || null),
        tiktok_handles: recipientType === 'Business' ? (tiktokHandles || []) : null,
        instagram_handles: recipientType === 'Business' ? (instagramHandles || []) : null,
        recipient_type: recipientType || null,
        full_name: fullName || null,
        ach_routing_number: achRoutingNumber || null,
        swift_code: swiftCode || null,
        account_number: accountNumber || null,
        account_type: accountType || null,
        wise_tag: wiseTag || null,
        address: address || null,
        phone_number: phoneNumber || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('인플루언서 계좌 등록 오류:', error);
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
        { success: false, error: '삭제할 계좌 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('influencer_accounts')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `${ids.length}개의 계좌가 삭제되었습니다.` });
  } catch (error) {
    console.error('인플루언서 계좌 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}



