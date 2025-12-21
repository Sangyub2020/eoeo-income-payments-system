import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage bucket 확인 및 생성 시도
    const bucketName = 'files';
    
    // 먼저 bucket이 존재하는지 확인
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Bucket 목록 조회 오류:', listError);
      return NextResponse.json(
        {
          success: false,
          error: `Storage 접근 오류: ${listError.message}. Supabase Storage 설정을 확인해주세요.`,
        },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      // Bucket이 없으면 생성 시도
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (createError) {
        console.error('Bucket 생성 오류:', createError);
        return NextResponse.json(
          {
            success: false,
            error: `Storage bucket '${bucketName}'이 존재하지 않습니다. Supabase 대시보드에서 Storage > Buckets 메뉴로 이동하여 '${bucketName}' bucket을 생성해주세요. (공개 bucket으로 설정)`,
          },
          { status: 500 }
        );
      }
    }

    // Supabase Storage에 업로드
    console.log('파일 업로드 시도:', { bucketName, filePath, fileSize: buffer.length, contentType: file.type });
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('파일 업로드 오류 상세:', {
        error,
        message: error.message,
        statusCode: (error as any).statusCode,
        errorCode: (error as any).error,
      });
      
      // 더 자세한 에러 메시지 제공
      let errorMessage = '파일 업로드에 실패했습니다.';
      
      const errorAny = error as any;
      
      if (error.message) {
        errorMessage = error.message;
      } else if (errorAny.statusCode === '409' || errorAny.error === 'Duplicate') {
        errorMessage = '같은 이름의 파일이 이미 존재합니다.';
      } else if (errorAny.statusCode === '413') {
        errorMessage = '파일 크기가 너무 큽니다.';
      } else if (errorAny.statusCode === '403' || errorAny.error === 'new row violates row-level security policy') {
        errorMessage = '파일 업로드 권한이 없습니다. Storage bucket 권한을 확인해주세요.';
      } else if (errorAny.error) {
        errorMessage = `업로드 오류: ${errorAny.error}`;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: {
            message: error.message,
            statusCode: errorAny.statusCode,
            error: errorAny.error,
          },
        },
        { status: 500 }
      );
    }

    console.log('파일 업로드 성공:', data);

    // 공개 URL 생성
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('공개 URL 생성:', urlData);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    
    let errorMessage = '파일 업로드에 실패했습니다.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else if (typeof error === 'object' && error !== null) {
      const err = error as any;
      errorMessage = err.message || err.error || JSON.stringify(error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
        } : error,
      },
      { status: 500 }
    );
  }
}

