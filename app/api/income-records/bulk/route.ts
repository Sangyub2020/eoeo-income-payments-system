import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, team } = body;

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'team 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 입금 정보가 없습니다.' },
        { status: 400 }
      );
    }

    console.log('일괄 등록 요청 받음:', { team, recordsCount: records.length, firstRecord: records[0] });
    
    const recordsToInsert = records.map((r: any) => ({
      team: team,
      category: r.category || null,
      vendor_code: r.vendorCode || null,
      company_name: r.companyName || null,
      brand_names: r.brandNames && r.brandNames.length > 0 ? r.brandNames : (r.brandName ? [r.brandName] : null),
      business_registration_number: r.businessRegistrationNumber || null,
      invoice_email: r.invoiceEmail || null,
      project_code: r.projectCode || null,
      // project 필드는 제거되었으므로 projectCategory만 사용
      project_category: r.projectCategory || null,
      project_name: r.projectName || null,
      project_category2: r.projectCategory2 || null,
      project_category3: r.projectCategory3 || null,
      project_code2: r.projectCode2 || null,
      project_code3: r.projectCode3 || null,
      project_name2: r.projectName2 || null,
      project_name3: r.projectName3 || null,
      project_name4: r.projectName4 || null,
      project_name5: r.projectName5 || null,
      project_name6: r.projectName6 || null,
      project_name7: r.projectName7 || null,
      project_name8: r.projectName8 || null,
      project_name9: r.projectName9 || null,
      project_name10: r.projectName10 || null,
      eoeo_manager: r.eoeoManager || null,
      contract_link: r.contractLink || null,
      estimate_link: r.estimateLink || null,
      installment_number: r.installmentNumber || null,
      attribution_year_month: r.attributionYearMonth || null,
      advance_balance: r.advanceBalance || null,
      ratio: r.ratio || null,
      count: r.count || null,
      expected_deposit_date: r.expectedDepositDate || null,
      one_time_expense_amount: r.oneTimeExpenseAmount || null,
      expected_deposit_amount: r.expectedDepositAmount || null,
      expected_deposit_currency: r.expectedDepositCurrency || 'KRW',
      description: r.description || null,
      deposit_date: r.depositDate || null,
      deposit_amount: r.depositAmount || null,
      deposit_currency: r.depositCurrency || 'KRW',
      created_date: r.createdDate || null,
      invoice_copy: r.invoiceCopy || null,
      issue_notes: r.issueNotes || null,
      tax_status: r.taxStatus || null,
      invoice_supply_price: r.invoiceSupplyPrice || null,
      invoice_attachment_status: r.invoiceAttachmentStatus || null,
      deposit_status: r.depositStatus || null,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 100;
    
    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabaseAdmin
          .from('income_records')
          .insert(batch);

        if (error) {
          for (const record of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('income_records')
                .insert(record);

              if (singleError) {
                const recordInfo = `거래처코드: ${record.vendor_code || '없음'}, 회사명: ${record.company_name || '없음'}, 입금액: ${record.deposit_amount || '없음'}, 프로젝트코드: ${record.project_code || '없음'}`;
                const errorDetail = `${recordInfo}\n오류: ${singleError.message}\n상세: ${JSON.stringify(singleError)}`;
                console.error('단일 레코드 삽입 실패:', errorDetail);
                errors.push(errorDetail);
                failedCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              const recordInfo = `거래처코드: ${record.vendor_code || '없음'}, 회사명: ${record.company_name || '없음'}, 입금액: ${record.deposit_amount || '없음'}`;
              errors.push(`${recordInfo}\n오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
              failedCount++;
            }
          }
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        for (const record of batch) {
          const recordInfo = `거래처코드: ${record.vendor_code || '없음'}, 회사명: ${record.company_name || '없음'}, 입금액: ${record.deposit_amount || '없음'}`;
          errors.push(`${recordInfo}\n오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
          failedCount++;
        }
      }
    }

    if (failedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `일부 항목 등록 실패 (성공: ${successCount}개, 실패: ${failedCount}개)`,
          errors: errors,
          successCount,
          failedCount,
        },
        { status: 207 } // 207 Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `모든 항목이 성공적으로 등록되었습니다. (${successCount}개)`,
      successCount,
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



