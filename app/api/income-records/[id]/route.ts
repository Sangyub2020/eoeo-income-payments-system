import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      team,
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
      invoiceLink,
      installmentNumber,
      attributionYearMonth,
      advanceBalance,
      ratio,
      count,
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
      invoiceIssued,
      invoiceCopy,
      issueNotes,
      year,
      expectedDepositMonth,
      depositMonth,
      taxStatus,
      invoiceSupplyPrice,
    } = body;

    const updateData: any = {};
    if (team !== undefined) updateData.team = team;
    if (category !== undefined) updateData.category = category || null;
    if (vendorCode !== undefined) updateData.vendor_code = vendorCode || null;
    if (companyName !== undefined) updateData.company_name = companyName || null;
    if (brandName !== undefined) updateData.brand_name = brandName || null;
    if (businessRegistrationNumber !== undefined) updateData.business_registration_number = businessRegistrationNumber || null;
    if (invoiceEmail !== undefined) updateData.invoice_email = invoiceEmail || null;
    if (projectCode !== undefined) updateData.project_code = projectCode || null;
    if (project !== undefined) updateData.project = project || null;
    if (projectName !== undefined) updateData.project_name = projectName || null;
    if (projectName2 !== undefined) updateData.project_name2 = projectName2 || null;
    if (projectName3 !== undefined) updateData.project_name3 = projectName3 || null;
    if (projectName4 !== undefined) updateData.project_name4 = projectName4 || null;
    if (projectName5 !== undefined) updateData.project_name5 = projectName5 || null;
    if (projectName6 !== undefined) updateData.project_name6 = projectName6 || null;
    if (projectName7 !== undefined) updateData.project_name7 = projectName7 || null;
    if (projectName8 !== undefined) updateData.project_name8 = projectName8 || null;
    if (projectName9 !== undefined) updateData.project_name9 = projectName9 || null;
    if (projectName10 !== undefined) updateData.project_name10 = projectName10 || null;
    if (eoeoManager !== undefined) updateData.eoeo_manager = eoeoManager || null;
    if (contractLink !== undefined) updateData.contract_link = contractLink || null;
    if (estimateLink !== undefined) updateData.estimate_link = estimateLink || null;
    if (invoiceLink !== undefined) updateData.invoice_link = invoiceLink || null;
    if (installmentNumber !== undefined) updateData.installment_number = installmentNumber || null;
    if (attributionYearMonth !== undefined) updateData.attribution_year_month = attributionYearMonth || null;
    if (advanceBalance !== undefined) updateData.advance_balance = advanceBalance || null;
    if (ratio !== undefined) updateData.ratio = ratio || null;
    if (count !== undefined) updateData.count = count || null;
    if (expectedDepositDate !== undefined) updateData.expected_deposit_date = expectedDepositDate || null;
    if (oneTimeExpenseAmount !== undefined) updateData.one_time_expense_amount = oneTimeExpenseAmount || null;
    if (expectedDepositAmount !== undefined) updateData.expected_deposit_amount = expectedDepositAmount || null;
    if (expectedDepositCurrency !== undefined) updateData.expected_deposit_currency = expectedDepositCurrency || 'KRW';
    if (description !== undefined) updateData.description = description || null;
    if (depositDate !== undefined) updateData.deposit_date = depositDate || null;
    if (depositAmount !== undefined) updateData.deposit_amount = depositAmount || null;
    if (depositCurrency !== undefined) updateData.deposit_currency = depositCurrency || 'KRW';
    if (exchangeGainLoss !== undefined) updateData.exchange_gain_loss = exchangeGainLoss || null;
    if (difference !== undefined) updateData.difference = difference || null;
    if (createdDate !== undefined) updateData.created_date = createdDate || null;
    if (invoiceIssued !== undefined) updateData.invoice_issued = invoiceIssued || null;
    if (invoiceCopy !== undefined) updateData.invoice_copy = invoiceCopy || null;
    if (issueNotes !== undefined) updateData.issue_notes = issueNotes || null;
    if (year !== undefined) updateData.year = year || null;
    if (expectedDepositMonth !== undefined) updateData.expected_deposit_month = expectedDepositMonth || null;
    if (depositMonth !== undefined) updateData.deposit_month = depositMonth || null;
    if (taxStatus !== undefined) updateData.tax_status = taxStatus || null;
    if (invoiceSupplyPrice !== undefined) updateData.invoice_supply_price = invoiceSupplyPrice || null;

    const { data, error } = await supabaseAdmin
      .from('income_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase 업데이트 오류:', error);
      throw error;
    }

    // snake_case를 camelCase로 변환
    const formattedRecord = {
      id: data.id,
      team: data.team,
      category: data.category,
      vendorCode: data.vendor_code,
      companyName: data.company_name,
      brandName: data.brand_name,
      businessRegistrationNumber: data.business_registration_number,
      invoiceEmail: data.invoice_email,
      projectCode: data.project_code,
      project: data.project,
      projectName: data.project_name,
      projectName2: data.project_name2,
      projectName3: data.project_name3,
      projectName4: data.project_name4,
      projectName5: data.project_name5,
      projectName6: data.project_name6,
      projectName7: data.project_name7,
      projectName8: data.project_name8,
      projectName9: data.project_name9,
      projectName10: data.project_name10,
      eoeoManager: data.eoeo_manager,
      contractLink: data.contract_link,
      estimateLink: data.estimate_link,
      invoiceLink: data.invoice_link,
      installmentNumber: data.installment_number,
      attributionYearMonth: data.attribution_year_month,
      advanceBalance: data.advance_balance,
      ratio: data.ratio,
      count: data.count,
      expectedDepositDate: data.expected_deposit_date,
      oneTimeExpenseAmount: data.one_time_expense_amount,
      expectedDepositAmount: data.expected_deposit_amount,
      expectedDepositCurrency: data.expected_deposit_currency,
      description: data.description,
      depositDate: data.deposit_date,
      depositAmount: data.deposit_amount,
      depositCurrency: data.deposit_currency,
      exchangeGainLoss: data.exchange_gain_loss,
      difference: data.difference,
      createdDate: data.created_date,
      invoiceIssued: data.invoice_issued,
      invoiceCopy: data.invoice_copy,
      issueNotes: data.issue_notes,
      year: data.year,
      expectedDepositMonth: data.expected_deposit_month,
      depositMonth: data.deposit_month,
      taxStatus: data.tax_status,
      invoiceSupplyPrice: data.invoice_supply_price,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ success: true, data: formattedRecord });
  } catch (error) {
    console.error('입금 기록 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('income_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('입금 기록 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

