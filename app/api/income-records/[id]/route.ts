import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('PUT 요청 - ID:', id);
    console.log('PUT 요청 - URL:', request.url);
    
    if (!id) {
      console.error('ID가 없습니다');
      return NextResponse.json(
        {
          success: false,
          error: '레코드 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    let body;
    try {
      body = await request.json();
      console.log('PUT 요청 - Body:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('JSON 파싱 오류:', jsonError);
      return NextResponse.json(
        {
          success: false,
          error: '요청 본문을 파싱할 수 없습니다.',
        },
        { status: 400 }
      );
    }
    const {
      team,
      category,
      vendorCode,
      companyName,
      brandName,
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
      invoiceCopy,
      invoiceAttachmentStatus,
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
    if (brandNames !== undefined) {
      // brand_names 컬럼이 있으면 업데이트, 없으면 brand_name만 업데이트
      // Supabase에서 컬럼이 없으면 에러가 발생하므로, 일단 brand_name만 업데이트
      // 마이그레이션 031_add_brand_names_to_income_records.sql을 실행하면 brand_names도 사용 가능
      if (brandNames && brandNames.length > 0) {
        updateData.brand_name = brandNames[0] || null;
        // brand_names 컬럼이 있는 경우에만 추가 (마이그레이션 실행 후)
        // 주의: 마이그레이션이 실행되지 않았으면 이 줄로 인해 에러 발생
        updateData.brand_names = brandNames;
      } else {
        updateData.brand_name = null;
        updateData.brand_names = null;
      }
    }
    if (businessRegistrationNumber !== undefined) updateData.business_registration_number = businessRegistrationNumber || null;
    if (invoiceEmail !== undefined) updateData.invoice_email = invoiceEmail || null;
    if (projectCode !== undefined) updateData.project_code = projectCode || null;
    if (projectCode2 !== undefined) updateData.project_code2 = projectCode2 || null;
    if (projectCode3 !== undefined) updateData.project_code3 = projectCode3 || null;
    // project 필드는 제거되었으므로 projectCategory만 사용
    if (projectCategory !== undefined) updateData.project_category = projectCategory || null;
    if (projectCategory2 !== undefined) updateData.project_category2 = projectCategory2 || null;
    if (projectCategory3 !== undefined) updateData.project_category3 = projectCategory3 || null;
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
    if (invoiceCopy !== undefined) updateData.invoice_copy = invoiceCopy || null;
    if (invoiceAttachmentStatus !== undefined) updateData.invoice_attachment_status = invoiceAttachmentStatus || null;
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
      // Supabase 에러 객체를 더 자세히 로깅
      if (error.message) {
        console.error('에러 메시지:', error.message);
      }
      if (error.details) {
        console.error('에러 상세:', error.details);
      }
      if (error.hint) {
        console.error('에러 힌트:', error.hint);
      }
      if (error.code) {
        console.error('에러 코드:', error.code);
      }
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
      brandNames: data.brand_names || (data.brand_name ? [data.brand_name] : []),
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
      invoiceAttachmentStatus: data.invoice_attachment_status,
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
  } catch (error: any) {
    console.error('입금 기록 수정 오류:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.details) {
      errorMessage = error.details;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Supabase 에러의 경우 더 자세한 정보 포함
    if (error?.code) {
      errorMessage = `[${error.code}] ${errorMessage}`;
      if (error.hint) {
        errorMessage += ` (힌트: ${error.hint})`;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error?.details || null,
        code: error?.code || null,
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

