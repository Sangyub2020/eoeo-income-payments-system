export const CATEGORIES = [
  '파트너십 - 서비스매출',
  '파트너십 - 수출바우처',
  'B2B',
  '재고 바이백',
  '배송비',
  '환불 수취',
  '환불 지급',
  'other',
] as const;

// 글로벌 마케팅 솔루션팀 전용 카테고리
export const GLOBAL_MARKETING_CATEGORIES = [
  '용역사업 - 서비스매출',
  '파트너십/마케팅지원비',
  '기재고사입',
  '용역사업 - 수출바우처',
  'other',
  'B2B',
  '배송비',
  '기재고판매',
  '환불 수취',
  '환불 지급',
] as const;

// 회계 데이터 관리가 필요한 거래유형 (4개)
export const ACCOUNTING_REQUIRED_CATEGORIES = [
  '파트너십 - 수출바우처',
  '파트너십 - 서비스매출',
  '용역사업 - 수출바우처',
  '용역사업 - 서비스매출',
] as const;
