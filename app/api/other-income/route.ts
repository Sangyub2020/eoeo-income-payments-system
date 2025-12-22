import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('other_income')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 데이터 포맷팅 (온라인커머스팀과 동일)
    const formattedRecords = data.map((r: any) => ({
      id: r.id,
      category: r.category,
      vendorCode: r.vendor_code,
      companyName: r.company_name,
      brandName: r.brand_name,
      businessRegistrationNumber: r.business_registration_number,
      invoiceEmail: r.invoice_email,
      projectCode: r.project_code,
      project: r.project,
      projectName: r.project_name,
      eoeoManager: r.eoeo_manager,
      contractLink: r.contract_link,
      estimateLink: r.estimate_link,
      installmentNumber: r.installment_number,
      attributionYearMonth: r.attribution_year_month,
      advanceBalance: r.advance_balance,
      ratio: r.ratio,
      count: r.count,
      expectedDepositDate: r.expected_deposit_date,
      expectedDepositAmount: r.expected_deposit_amount,
      description: r.description,
      depositDate: r.deposit_date,
      depositAmount: r.deposit_amount,
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
      hasWarning: !r.category || !r.vendor_code || !r.project_code,
    }));

    return NextResponse.json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('기타 income 입금 조회 오류:', error);
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
      category,
      vendorCode,
      companyName,
      brandName,
      businessRegistrationNumber,
      invoiceEmail,
      projectCode,
      project,
      projectName,
      eoeoManager,
      contractLink,
      estimateLink,
      installmentNumber,
      attributionYearMonth,
      advanceBalance,
      ratio,
      count,
      expectedDepositDate,
      expectedDepositAmount,
      description,
      depositDate,
      depositAmount,
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

    const { data, error } = await supabaseAdmin
      .from('other_income')
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
        eoeo_manager: eoeoManager || null,
        contract_link: contractLink || null,
        estimate_link: estimateLink || null,
        installment_number: installmentNumber || null,
        attribution_year_month: attributionYearMonth || null,
        advance_balance: advanceBalance || null,
        ratio: ratio || null,
        count: count || null,
        expected_deposit_date: expectedDepositDate || null,
        expected_deposit_amount: expectedDepositAmount || null,
        description: description || null,
        deposit_date: depositDate || null,
        deposit_amount: depositAmount || null,
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

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('기타 income 입금 등록 오류:', error);
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
      .from('other_income')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `${ids.length}개의 입금 정보가 삭제되었습니다.` });
  } catch (error) {
    console.error('기타 income 입금 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

