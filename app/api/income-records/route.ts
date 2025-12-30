import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// 캐시 방지 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      brandNames: Array.isArray(r.brand_names) ? r.brand_names : (r.brand_names ? [r.brand_names] : []),
      brandName: (Array.isArray(r.brand_names) && r.brand_names.length > 0) ? r.brand_names[0] : (r.brand_names ? String(r.brand_names) : null), // 호환성을 위해 유지하되 brand_names[0] 사용
      businessRegistrationNumber: r.business_registration_number,
      invoiceEmail: r.invoice_email,
      projectCode: r.project_code,
      projectCode2: r.project_code2,
      projectCode3: r.project_code3,
      project: r.project_category || r.project, // project_category가 있으면 사용, 없으면 기존 project 사용 (호환성)
      projectCategory: r.project_category,
      projectCategory2: r.project_category2,
      projectCategory3: r.project_category3,
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
      attributionYearMonth: r.attribution_year_month,
      advanceBalance: r.advance_balance,
      ratio: r.ratio,
      expectedDepositDate: r.expected_deposit_date,
      depositStatus: r.deposit_status,
      oneTimeExpenseAmount: r.one_time_expense_amount,
      expectedDepositAmount: r.expected_deposit_amount,
      expectedDepositCurrency: r.expected_deposit_currency,
      description: r.description,
      depositDate: r.deposit_date,
      depositAmount: r.deposit_amount,
      depositCurrency: r.deposit_currency,
      createdDate: r.created_date,
      invoiceCopy: r.invoice_copy,
      invoiceAttachmentStatus: r.invoice_attachment_status,
      issueNotes: r.issue_notes,
      taxStatus: r.tax_status,
      invoiceSupplyPrice: r.invoice_supply_price,
      // 회계 데이터 관리 필드
      projectPeriodStart: r.project_period_start,
      projectPeriodEnd: r.project_period_end,
      targetMarginRate: r.target_margin_rate,
      finalMonthActualCost: r.final_month_actual_cost,
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
      brandNames,
      businessRegistrationNumber,
      invoiceEmail,
      projectCode,
      projectCode2,
      projectCode3,
      project,
      projectCategory,
      projectCategory2,
      projectCategory3,
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
      depositStatus,
      oneTimeExpenseAmount,
      expectedDepositAmount,
      expectedDepositCurrency,
      description,
      depositDate,
      depositAmount,
      depositCurrency,
      createdDate,
      invoiceCopy,
      invoiceAttachmentStatus,
      issueNotes,
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
        brand_names: brandNames && brandNames.length > 0 ? brandNames : null,
        business_registration_number: businessRegistrationNumber || null,
        invoice_email: invoiceEmail || null,
        project_code: projectCode || null,
        project_code2: projectCode2 || null,
        project_code3: projectCode3 || null,
        // project 필드는 제거되었으므로 projectCategory만 사용
        project_category: projectCategory || null,
        project_category2: projectCategory2 || null,
        project_category3: projectCategory3 || null,
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
        deposit_status: depositStatus || null,
        one_time_expense_amount: oneTimeExpenseAmount || null,
        expected_deposit_amount: expectedDepositAmount || null,
        expected_deposit_currency: expectedDepositCurrency || 'KRW',
        description: description || null,
        deposit_date: depositDate || null,
        deposit_amount: depositAmount || null,
        deposit_currency: depositCurrency || 'KRW',
        created_date: createdDate || null,
        invoice_copy: invoiceCopy || null,
        invoice_attachment_status: invoiceAttachmentStatus || null,
        issue_notes: issueNotes || null,
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
      brandNames: Array.isArray(data.brand_names) ? data.brand_names : (data.brand_names ? [data.brand_names] : []),
      brandName: (Array.isArray(data.brand_names) && data.brand_names.length > 0) ? data.brand_names[0] : (data.brand_names ? String(data.brand_names) : null), // 호환성을 위해 유지하되 brand_names[0] 사용
      businessRegistrationNumber: data.business_registration_number,
      invoiceEmail: data.invoice_email,
      projectCode: data.project_code,
      projectCode2: data.project_code2,
      projectCode3: data.project_code3,
      project: data.project_category || data.project, // project_category가 있으면 사용, 없으면 기존 project 사용 (호환성)
      projectCategory: data.project_category,
      projectCategory2: data.project_category2,
      projectCategory3: data.project_category3,
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
      attributionYearMonth: data.attribution_year_month,
      advanceBalance: data.advance_balance,
      ratio: data.ratio,
      expectedDepositDate: data.expected_deposit_date,
      depositStatus: data.deposit_status,
      oneTimeExpenseAmount: data.one_time_expense_amount,
      expectedDepositAmount: data.expected_deposit_amount,
      expectedDepositCurrency: data.expected_deposit_currency,
      description: data.description,
      depositDate: data.deposit_date,
      depositAmount: data.deposit_amount,
      depositCurrency: data.deposit_currency,
      createdDate: data.created_date,
      invoiceCopy: data.invoice_copy,
      invoiceAttachmentStatus: data.invoice_attachment_status,
      issueNotes: data.issue_notes,
      taxStatus: data.tax_status,
      invoiceSupplyPrice: data.invoice_supply_price,
      // 회계 데이터 관리 필드
      projectPeriodStart: data.project_period_start,
      projectPeriodEnd: data.project_period_end,
      targetMarginRate: data.target_margin_rate,
      finalMonthActualCost: data.final_month_actual_cost,
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

