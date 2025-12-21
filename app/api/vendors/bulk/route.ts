import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendors } = body;

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 거래처 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    const invalidVendors = vendors.filter((v: any) => !v.code || !v.name);
    if (invalidVendors.length > 0) {
      return NextResponse.json(
        { success: false, error: '모든 거래처는 코드와 거래처명이 필수입니다.' },
        { status: 400 }
      );
    }

    // 데이터베이스 형식으로 변환
    const vendorsToInsert = vendors.map((v: any) => ({
      code: v.code,
      name: v.name,
      business_number: v.businessNumber || null,
      invoice_email: v.invoiceEmail || null,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // 배치 처리로 성능 개선 (한 번에 여러 개 삽입)
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < vendorsToInsert.length; i += BATCH_SIZE) {
      const batch = vendorsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        // 먼저 배치로 시도
        const { data, error } = await supabaseAdmin
          .from('vendors')
          .insert(batch)
          .select();

        if (error) {
          // 배치 실패 시 개별 처리
          for (const vendor of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('vendors')
                .insert(vendor);

              if (singleError) {
                if (singleError.code === '23505') {
                  errors.push(`${vendor.code}: 이미 존재하는 코드입니다.`);
                } else {
                  errors.push(`${vendor.code}: ${singleError.message}`);
                }
                failedCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              errors.push(`${vendor.code}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
              failedCount++;
            }
          }
        } else {
          // 배치 성공
          successCount += batch.length;
        }
      } catch (err) {
        // 배치 처리 중 예외 발생 시 개별 처리
        for (const vendor of batch) {
          try {
            const { error: singleError } = await supabaseAdmin
              .from('vendors')
              .insert(vendor);

            if (singleError) {
              if (singleError.code === '23505') {
                errors.push(`${vendor.code}: 이미 존재하는 코드입니다.`);
              } else {
                errors.push(`${vendor.code}: ${singleError.message}`);
              }
              failedCount++;
            } else {
              successCount++;
            }
          } catch (singleErr) {
            errors.push(`${vendor.code}: ${singleErr instanceof Error ? singleErr.message : '알 수 없는 오류'}`);
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

