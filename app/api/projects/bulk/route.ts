import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projects } = body;

    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 프로젝트 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const invalidProjects = projects.filter((p: any) => !p.code || !p.name);
    if (invalidProjects.length > 0) {
      return NextResponse.json(
        { success: false, error: '모든 프로젝트는 프로젝트명과 프로젝트코드가 필수입니다.' },
        { status: 400 }
      );
    }

    const projectsToInsert = projects.map((p: any) => ({
      name: p.name,
      code: p.code,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 100;
    
    for (let i = 0; i < projectsToInsert.length; i += BATCH_SIZE) {
      const batch = projectsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabaseAdmin
          .from('projects')
          .insert(batch);

        if (error) {
          for (const project of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('projects')
                .insert(project);

              if (singleError) {
                if (singleError.code === '23505') {
                  errors.push(`${project.code}: 이미 존재하는 프로젝트코드입니다.`);
                } else {
                  errors.push(`${project.code}: ${singleError.message}`);
                }
                failedCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              errors.push(`${project.code}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
              failedCount++;
            }
          }
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        for (const project of batch) {
          try {
            const { error: singleError } = await supabaseAdmin
              .from('projects')
              .insert(project);

            if (singleError) {
              if (singleError.code === '23505') {
                errors.push(`${project.code}: 이미 존재하는 프로젝트코드입니다.`);
              } else {
                errors.push(`${project.code}: ${singleError.message}`);
              }
              failedCount++;
            } else {
              successCount++;
            }
          } catch (singleErr) {
            errors.push(`${project.code}: ${singleErr instanceof Error ? singleErr.message : '알 수 없는 오류'}`);
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






