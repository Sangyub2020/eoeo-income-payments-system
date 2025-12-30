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
      category,
      vendorCode,
      companyName,
      brandName,
      businessRegistrationNumber,
      invoiceEmail,
      projectCode,
      project,
      projectName,
      projectName2,
      projectName3,
      projectName4,
      projectName5,
      projectName6,
      projectName7,
      projectName8,
      projectName9,
      projectName10,
      eoeoManager,
      contractLink,
      estimateLink,
      attributionYearMonth,
      advanceBalance,
      ratio,
      expectedDepositDate,
      oneTimeExpenseAmount,
      expectedDepositAmount,
      expectedDepositCurrency,
      description,
      depositDate,
      depositAmount,
      depositCurrency,
      exchangeGainLoss,
      difference,
      createdDate,
      invoiceCopy,
      issueNotes,
      year,
      expectedDepositMonth,
      depositMonth,
      taxStatus,
      invoiceSupplyPrice,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('global_marketing_team')
      .update({
        category: category || null,
        vendor_code: vendorCode || null,
        company_name: companyName || null,
        brand_name: brandName || null,
        business_registration_number: businessRegistrationNumber || null,
        invoice_email: invoiceEmail || null,
        project_code: projectCode || null,
        project: project || null,
        project_name: projectName || null,
        project_name2: projectName2 || null,
        project_name3: projectName3 || null,
        project_name4: projectName4 || null,
        project_name5: projectName5 || null,
        project_name6: projectName6 || null,
        project_name7: projectName7 || null,
        project_name8: projectName8 || null,
        project_name9: projectName9 || null,
        project_name10: projectName10 || null,
        eoeo_manager: eoeoManager || null,
        contract_link: contractLink || null,
        estimate_link: estimateLink || null,
        attribution_year_month: attributionYearMonth || null,
        advance_balance: advanceBalance || null,
        ratio: ratio || null,
        expected_deposit_date: expectedDepositDate || null,
        one_time_expense_amount: oneTimeExpenseAmount || null,
        expected_deposit_amount: expectedDepositAmount || null,
        expected_deposit_currency: expectedDepositCurrency || 'KRW',
        description: description || null,
        deposit_date: depositDate || null,
        deposit_amount: depositAmount || null,
        deposit_currency: depositCurrency || 'KRW',
        exchange_gain_loss: exchangeGainLoss || null,
        difference: difference || null,
        created_date: createdDate || null,
        invoice_copy: invoiceCopy || null,
        issue_notes: issueNotes || null,
        year: year || null,
        expected_deposit_month: expectedDepositMonth || null,
        deposit_month: depositMonth || null,
        tax_status: taxStatus || null,
        invoice_supply_price: invoiceSupplyPrice || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase 업데이트 오류:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('글로벌 마케팅솔루션팀 입금 수정 오류:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
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
