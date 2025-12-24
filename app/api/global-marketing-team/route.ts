import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('global_marketing_team')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({ success: true, data: allData });
  } catch (error) {
    console.error('글로벌 마케팅솔루션팀 입금 조회 오류:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
      // 테이블이 존재하지 않는 경우 더 명확한 메시지 제공
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = '데이터베이스 테이블이 존재하지 않습니다. Supabase에서 마이그레이션을 실행해주세요.';
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
      issueNotes,
      year,
      expectedDepositMonth,
      depositMonth,
      taxStatus,
      invoiceSupplyPrice,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('global_marketing_team')
      .insert({
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

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('글로벌 마케팅솔루션팀 입금 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 입금 정보 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('global_marketing_team')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `${ids.length}개의 입금 정보가 삭제되었습니다.` });
  } catch (error) {
    console.error('글로벌 마케팅솔루션팀 입금 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
