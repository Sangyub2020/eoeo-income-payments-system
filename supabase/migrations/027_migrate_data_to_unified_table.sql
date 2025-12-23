-- 기존 5개 테이블의 데이터를 통합 테이블로 마이그레이션

-- 온라인커머스팀 데이터 마이그레이션
INSERT INTO income_records (
  id, team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
)
SELECT 
  id, 'online_commerce' as team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
FROM online_commerce_team
ON CONFLICT (id) DO NOTHING;

-- 글로벌마케팅팀 데이터 마이그레이션
INSERT INTO income_records (
  id, team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, project_name2, project_name3, project_name4, project_name5,
  project_name6, project_name7, project_name8, project_name9, project_name10,
  eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
)
SELECT 
  id, 'global_marketing' as team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, project_name2, project_name3, project_name4, project_name5,
  project_name6, project_name7, project_name8, project_name9, project_name10,
  eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
FROM global_marketing_team
ON CONFLICT (id) DO NOTHING;

-- 글로벌세일즈팀 데이터 마이그레이션
INSERT INTO income_records (
  id, team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, invoice_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
)
SELECT 
  id, 'global_sales' as team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, invoice_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
FROM global_sales_team
ON CONFLICT (id) DO NOTHING;

-- 브랜드기획팀 데이터 마이그레이션
INSERT INTO income_records (
  id, team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, invoice_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
)
SELECT 
  id, 'brand_planning' as team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, invoice_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, one_time_expense_amount, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
FROM brand_planning_team
ON CONFLICT (id) DO NOTHING;

-- 기타 income 데이터 마이그레이션
INSERT INTO income_records (
  id, team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
)
SELECT 
  id, 'other_income' as team,
  category, vendor_code, company_name, brand_name, business_registration_number, invoice_email,
  project_code, project, project_name, eoeo_manager, contract_link, estimate_link,
  installment_number, attribution_year_month, advance_balance, ratio, count,
  expected_deposit_date, expected_deposit_amount, expected_deposit_currency,
  description, deposit_date, deposit_amount, deposit_currency,
  exchange_gain_loss, difference, created_date, invoice_issued, invoice_copy, issue_notes,
  year, expected_deposit_month, deposit_month, tax_status, invoice_supply_price,
  created_at, updated_at
FROM other_income
ON CONFLICT (id) DO NOTHING;

