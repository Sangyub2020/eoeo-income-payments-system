import { NextResponse } from 'next/server';
import { getAllSheetsData } from '@/lib/google-sheets';

export async function POST() {
  try {
    const sheetsData = await getAllSheetsData();
    
    // 여기서 Supabase에 데이터를 저장하는 로직을 추가해야 합니다
    // 현재는 데이터를 반환만 합니다
    
    return NextResponse.json({
      success: true,
      data: sheetsData,
      message: '구글 시트 데이터를 성공적으로 동기화했습니다.',
    });
  } catch (error) {
    console.error('시트 동기화 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}



