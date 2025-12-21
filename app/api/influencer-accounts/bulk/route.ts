import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accounts } = body;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 계좌 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const invalidAccounts = accounts.filter((a: any) => !a.fullName);
    if (invalidAccounts.length > 0) {
      return NextResponse.json(
        { success: false, error: '모든 계좌는 계좌 소유자 이름이 필수입니다.' },
        { status: 400 }
      );
    }

    const accountsToInsert = accounts.map((a: any) => ({
      email: a.email || null,
      tiktok_handle: a.tiktokHandle || null,
      full_name: a.fullName,
      ach_routing_number: a.achRoutingNumber || null,
      swift_code: a.swiftCode || null,
      account_number: a.accountNumber || null,
      account_type: a.accountType || null,
      wise_tag: a.wiseTag || null,
      address: a.address || null,
      phone_number: a.phoneNumber || null,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 100;
    
    for (let i = 0; i < accountsToInsert.length; i += BATCH_SIZE) {
      const batch = accountsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabaseAdmin
          .from('influencer_accounts')
          .insert(batch);

        if (error) {
          for (const account of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('influencer_accounts')
                .insert(account);

              if (singleError) {
                errors.push(`${account.email || account.full_name}: ${singleError.message}`);
                failedCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              errors.push(`${account.email || account.full_name}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
              failedCount++;
            }
          }
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        for (const account of batch) {
          try {
            const { error: singleError } = await supabaseAdmin
              .from('influencer_accounts')
              .insert(account);

            if (singleError) {
              errors.push(`${account.email || account.full_name}: ${singleError.message}`);
              failedCount++;
            } else {
              successCount++;
            }
          } catch (singleErr) {
            errors.push(`${account.email || account.full_name}: ${singleErr instanceof Error ? singleErr.message : '알 수 없는 오류'}`);
            failedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        success: successCount,
        failed: failedCount,
        errors,
      },
    });
  } catch (error) {
    console.error('일괄 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}



