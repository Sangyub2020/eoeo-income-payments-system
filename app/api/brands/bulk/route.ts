import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brands } = body;

    if (!Array.isArray(brands) || brands.length === 0) {
      return NextResponse.json(
        { success: false, error: '브랜드 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    const invalidBrands = brands.filter(b => !b.name || b.name.trim() === '');
    if (invalidBrands.length > 0) {
      return NextResponse.json(
        { success: false, error: '모든 브랜드는 브랜드명이 필수입니다.' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // 각 브랜드를 개별적으로 삽입 (중복 체크를 위해)
    for (const brand of brands) {
      try {
        const { error } = await supabaseAdmin
          .from('brands')
          .insert({
            name: brand.name.trim(),
          });

        if (error) {
          // 중복 브랜드명 에러 처리
          if (error.code === '23505') {
            failedCount++;
            errors.push(`${brand.name}: 이미 존재하는 브랜드명입니다.`);
          } else {
            failedCount++;
            errors.push(`${brand.name}: ${error.message}`);
          }
        } else {
          successCount++;
        }
      } catch (err) {
        failedCount++;
        errors.push(`${brand.name}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        success: successCount,
        failed: failedCount,
        errors: errors,
      },
    });
  } catch (error) {
    console.error('브랜드 일괄 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}




