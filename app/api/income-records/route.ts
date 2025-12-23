import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    let query = supabaseAdmin
      .from('income_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (team) {
      query = query.eq('team', team);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // snake_case를 camelCase로 변환
    const formattedRecords = data.map((r: any) => ({
      id: r.id,
      team: r.team,
      category: r.category,
      vendorCode: r.vendor_code,
      companyName: r.company_name,
      brandName: r.brand_name,
      businessRegistrationNumber: r.business_registration_number,
      invoiceEmail: r.invoice_email,
      projectCode: r.project_code,
      project: r.project,
      projectName: r.project_name,
      projectName2: r.project_name2,
      projectName3: r.project_name3,
      projectName4: r.project_name4,
      projectName5: r.project_name5,
      projectName6: r.project_name6,
      projectName7: r.project_name7,
      projectName8: r.project_name8,
      projectName9: r.project_name9,
      projectName10: r.project_name10,
      eoeoManager: r.eoeo_manager,
      contractLink: r.contract_link,
      estimateLink: r.estimate_link,
      invoiceLink: r.invoice_link,
      installmentNumber: r.installment_number,
      attributionYearMonth: r.attribution_year_month,
      advanceBalance: r.advance_balance,
      ratio: r.ratio,
      count: r.count,
      expectedDepositDate: r.expected_deposit_date,
      oneTimeExpenseAmount: r.one_time_expense_amount,
      expectedDepositAmount: r.expected_deposit_amount,
      expectedDepositCurrency: r.expected_deposit_currency,
      description: r.description,
      depositDate: r.deposit_date,
      depositAmount: r.deposit_amount,
      depositCurrency: r.deposit_currency,
      exchangeGainLoss: r.exchange_gain_loss,
      difference: r.difference,
      createdDate: r.created_date,
      invoiceIssued: r.invoice_issued,
      invoiceCopy: r.invoice_copy,
      issueNotes: r.issue_notes,
      year: r.year,
      expectedDepositMonth: r.expected_deposit_month,
      depositMonth: r.deposit_month,
      taxStatus: r.tax_status,
      invoiceSupplyPrice: r.invoice_supply_price,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('입금 기록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'team 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('income_records')
      .insert({
        team: team,
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
        invoice_link: invoiceLink || null,
        installment_number: installmentNumber || null,
        attribution_year_month: attributionYearMonth || null,
        advance_balance: advanceBalance || null,
        ratio: ratio || null,
        count: count || null,
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
        invoice_issued: invoiceIssued || null,
        invoice_copy: invoiceCopy || null,
        issue_notes: issueNotes || null,
        year: year || null,
        expected_deposit_month: expectedDepositMonth || null,
        deposit_month: depositMonth || null,
        tax_status: taxStatus || null,
        invoice_supply_price: invoiceSupplyPrice || null,
      })
      .select()
      .single();

    if (error) {
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

    return NextResponse.json({ success: true, data: formattedRecord }, { status: 201 });
  } catch (error) {
    console.error('입금 기록 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

