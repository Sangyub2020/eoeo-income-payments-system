import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 입금 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const recordsToInsert = records.map((r: any) => ({
      category: r.category || null,
      vendor_code: r.vendorCode || null,
      company_name: r.companyName || null,
      brand_name: r.brandName || null,
      business_registration_number: r.businessRegistrationNumber || null,
      invoice_email: r.invoiceEmail || null,
      project_code: r.projectCode || null,
      project: r.project || null,
      project_name: r.projectName || null,
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
      description: r.description || null,
      deposit_date: r.depositDate || null,
      deposit_amount: r.depositAmount || null,
      exchange_gain_loss: r.exchangeGainLoss || null,
      difference: r.difference || null,
      created_date: r.createdDate || null,
      invoice_issued: r.invoiceIssued || null,
      invoice_copy: r.invoiceCopy || null,
      issue_notes: r.issueNotes || null,
      year: r.year || null,
      expected_deposit_month: r.expectedDepositMonth || null,
      deposit_month: r.depositMonth || null,
      tax_status: r.taxStatus || null,
      invoice_supply_price: r.invoiceSupplyPrice || null,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 100;
    
    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabaseAdmin
          .from('global_marketing_team')
          .insert(batch);

        if (error) {
          for (const record of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('global_marketing_team')
                .insert(record);

              if (singleError) {
                const errorMsg = `${record.vendor_code || record.company_name || 'Unknown'}: ${singleError.message || JSON.stringify(singleError)}`;
                errors.push(errorMsg);
                console.error('레코드 삽입 실패:', record, singleError);
                failedCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              errors.push(`${record.vendor_code || record.company_name || 'Unknown'}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
              failedCount++;
            }
          }
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        for (const record of batch) {
          try {
            const { error: singleError } = await supabaseAdmin
              .from('global_marketing_team')
              .insert(record);

            if (singleError) {
              const errorMsg = `${record.vendor_code || record.company_name || 'Unknown'}: ${singleError.message || JSON.stringify(singleError)}`;
              errors.push(errorMsg);
              console.error('레코드 삽입 실패:', record, singleError);
              failedCount++;
            } else {
              successCount++;
            }
          } catch (singleErr) {
            errors.push(`${record.vendor_code || record.company_name || 'Unknown'}: ${singleErr instanceof Error ? singleErr.message : '알 수 없는 오류'}`);
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
