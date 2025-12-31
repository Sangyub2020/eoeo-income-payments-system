'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon, Edit2, Save, XCircle, Check } from 'lucide-react';
import { OnlineCommerceTeam } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { CATEGORIES } from '@/lib/constants';

interface OnlineCommerceBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OnlineCommerceBulkModal({ isOpen, onClose, onSuccess }: OnlineCommerceBulkModalProps) {
  const [csvText, setCsvText] = useState('');
  const [records, setRecords] = useState<Partial<OnlineCommerceTeam>[]>([]);
  const [vendors, setVendors] = useState<Array<{ code: string; name: string; business_number?: string; invoice_email?: string }>>([]);
  const [projects, setProjects] = useState<Array<{ code: string; name: string }>>([]);
  const [projectCategoryToCodeMap, setProjectCategoryToCodeMap] = useState<Map<string, string>>(new Map());
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [recordBrands, setRecordBrands] = useState<Map<number, string[]>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<Map<number, { file: File; url: string }>>(new Map());
  const [showCsvInput, setShowCsvInput] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchProjects();
      fetchBrands();
      fetchProjectCategoryMapping();
      // 디폴트로 빈 값 설정
      setCsvText('');
      setRecords([]);
      setError(null);
      setEditingIndex(null);
      setInvoiceFiles(new Map());
      setRecordBrands(new Map());
      setShowCsvInput(true);
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVendors(data.data.map((v: any) => ({
            code: v.code,
            name: v.name,
            business_number: v.business_number,
            invoice_email: v.invoice_email,
          })));
        }
      }
    } catch (err) {
      console.error('거래처 조회 오류:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.data.map((p: any) => ({ code: p.code, name: p.name })));
        }
      }
    } catch (err) {
      console.error('프로젝트 조회 오류:', err);
    }
  };

  // 프로젝트 유형 -> 프로젝트 코드 매핑 가져오기
  const fetchProjectCategoryMapping = async () => {
    try {
      const response = await fetch('/api/income-records?limit=10000', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const mapping = new Map<string, string>();
          // 프로젝트 유형과 프로젝트 코드의 관계를 추출
          data.data.forEach((record: any) => {
            if (record.projectCategory && record.projectCode) {
              // 이미 매핑이 있으면 유지, 없으면 추가
              if (!mapping.has(record.projectCategory)) {
                mapping.set(record.projectCategory, record.projectCode);
              }
            }
          });
          setProjectCategoryToCodeMap(mapping);
          console.log('프로젝트 유형 -> 코드 매핑:', Array.from(mapping.entries()));
        }
      }
    } catch (err) {
      console.error('프로젝트 유형 매핑 조회 오류:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBrands(data.data.map((b: any) => ({ value: b.name, label: b.name })));
        }
      }
    } catch (err) {
      console.error('브랜드 조회 오류:', err);
    }
  };

  const parseCsvText = (text: string): Partial<OnlineCommerceTeam>[] => {
    const parsedRecords: Partial<OnlineCommerceTeam>[] = [];

    if (!text.trim()) return parsedRecords;

    try {

    // 허용된 거래유형 값 목록 (CATEGORIES 상수 사용)
    const validCategories = CATEGORIES;

    // 구분자 확인
    const delimiter = text.includes('\t') ? '\t' : ',';

    // 따옴표를 고려한 CSV 라인 파싱 함수
    const parseCsvLine = (line: string, delimiter: string): string[] => {
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // 이스케이프된 따옴표
            currentPart += '"';
            i += 2;
          } else {
            // 따옴표 시작/끝
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === delimiter && !inQuotes) {
          // 구분자 (따옴표 밖에서만)
          parts.push(currentPart);
          currentPart = '';
          i++;
        } else {
          currentPart += char;
          i++;
        }
      }

      // 마지막 부분 추가
      if (currentPart || parts.length > 0) {
        parts.push(currentPart);
      }

      return parts;
    };

    // 헤더 매핑 정의 (다운로드된 CSV의 헤더명 -> 필드명)
    // 여러 가능한 헤더명을 지원하기 위해 정규화 함수 사용
    const normalizeHeader = (header: string): string => {
      return header.trim().replace(/\s+/g, ' '); // 공백 정규화
    };

    const headerMapping: Record<string, string> = {
      '거래 유형': 'category',
      '거래처코드': 'vendorCode',
      '회사명': 'companyName',
      '브랜드명': 'brandName',
      '입금여부': 'depositStatus',
      '입금예정일': 'expectedDepositDate',
      '예정금액': 'expectedDepositAmount',
      '입금일': 'depositDate',
      '입금액': 'depositAmount',
      '세금계산서 발행 공급가': 'invoiceSupplyPrice',
      '실비금액(VAT제외)': 'oneTimeExpenseAmount',
      '세금계산서 첨부': 'invoiceAttachment',
      '사업자번호': 'businessRegistrationNumber',
      '이메일': 'invoiceEmail',
      '담당자': 'eoeoManager',
      '계약서': 'contractLink',
      '견적서': 'estimateLink',
      '귀속년월': 'attributionYearMonth',
      '귀속연월': 'attributionYearMonth', // 변형 지원
      '선/잔금': 'advanceBalance',
      '비율': 'ratio',
      '적요': 'description',
      '작성일': 'createdDate',
      '작성일자': 'createdDate', // 변형 지원
      '이슈': 'issueNotes',
      '프로젝트 유형 코드': 'projectCode',
      '프로젝트유형코드': 'projectCode', // 공백 없는 변형
      '프로젝트 코드': 'projectCode', // 짧은 변형
      '프로젝트코드': 'projectCode', // 공백 없는 변형
      '프로젝트 유형': 'projectCategory',
      '프로젝트유형': 'projectCategory', // 공백 없는 변형
      'Project Name': 'projectName',
      '프로젝트명': 'projectName', // 한글 변형
      '프로젝트유형2': 'projectCategory2',
      '프로젝트 유형2': 'projectCategory2', // 공백 있는 변형
      '프로젝트유형3': 'projectCategory3',
      '프로젝트 유형3': 'projectCategory3', // 공백 있는 변형
      '프로젝트코드2': 'projectCode2',
      '프로젝트 코드2': 'projectCode2', // 공백 있는 변형
      '프로젝트코드3': 'projectCode3',
      '프로젝트 코드3': 'projectCode3', // 공백 있는 변형
    };

    // 전체 텍스트를 라인으로 분리
    const allLines = text.split('\n').filter(line => line.trim());
    if (allLines.length < 2) return parsedRecords; // 헤더 + 최소 1개 데이터 행 필요

    // 첫 번째 라인을 헤더로 파싱
    const headerLine = parseCsvLine(allLines[0], delimiter);
    const headers = headerLine.map(h => {
      let cleaned = h.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      return cleaned.replace(/""/g, '"');
    });

    // Project Name 관련 헤더 매핑 개선을 위한 디버깅
    console.log('🔍 Project Name 매핑 확인을 위한 헤더:', headers.filter(h => 
      h.toLowerCase().includes('project') || h.toLowerCase().includes('프로젝트') || h.toLowerCase().includes('name') || h.toLowerCase().includes('명')
    ));

    // 헤더 인덱스 매핑 생성
    const headerIndexMap: Record<string, number> = {};
    console.log('📋 원본 헤더:', headers);
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeHeader(header);
      const headerLower = header.toLowerCase();
      const normalizedLower = normalizedHeader.toLowerCase();
      
      // 정확한 매칭 먼저 시도
      let fieldName = headerMapping[normalizedHeader] || headerMapping[normalizedLower] || headerMapping[headerLower];
      
      // 정확한 매칭이 없으면 부분 매칭 시도
      if (!fieldName) {
        for (const [key, value] of Object.entries(headerMapping)) {
          const keyLower = key.toLowerCase();
          if (normalizedLower.includes(keyLower) || keyLower.includes(normalizedLower) ||
              headerLower.includes(keyLower) || keyLower.includes(headerLower)) {
            fieldName = value;
            console.log(`🔗 부분 매칭 성공: "${header}" -> "${key}" -> "${value}"`);
            break;
          }
        }
      }
      
      // Project Name 특별 처리: "Project Name" 또는 "프로젝트명" 관련 헤더
      // 정확한 매칭을 위해 더 엄격한 조건 사용
      if (!fieldName) {
        // "Project Name" 정확히 매칭 (대소문자 구분 없음)
        if (headerLower === 'project name' || normalizedLower === 'project name') {
          fieldName = 'projectName';
          console.log(`✅ Project Name 정확 매칭: "${header}" -> "projectName"`);
        }
        // "프로젝트명" 정확히 매칭
        else if (headerLower === '프로젝트명' || normalizedLower === '프로젝트명') {
          fieldName = 'projectName';
          console.log(`✅ Project Name 한글 매칭: "${header}" -> "projectName"`);
        }
        // 부분 매칭: "project"와 "name"이 모두 포함되어 있고, "code"는 포함되지 않은 경우
        else if (headerLower.includes('project') && headerLower.includes('name') && !headerLower.includes('code')) {
          fieldName = 'projectName';
          console.log(`✅ Project Name 부분 매칭: "${header}" -> "projectName"`);
        }
      }
      
      if (fieldName) {
        // 같은 필드가 여러 번 나타나면 마지막 것을 사용
        headerIndexMap[fieldName] = index;
        // Project Code 관련 디버깅
        if (fieldName === 'projectCode') {
          console.log(`✅ Project Code 매핑 성공: 인덱스 ${index}, 헤더: "${header}" (정규화: "${normalizedHeader}")`);
        }
        // Project Name 관련 디버깅
        if (fieldName === 'projectName') {
          console.log(`✅ Project Name 매핑 성공: 인덱스 ${index}, 헤더: "${header}" (정규화: "${normalizedHeader}")`);
        }
      } else {
        // 매핑되지 않은 헤더 로깅 (디버깅용)
        if (headerLower.includes('project') || headerLower.includes('프로젝트') || headerLower.includes('code') || headerLower.includes('코드') || headerLower.includes('name') || headerLower.includes('명')) {
          console.log(`⚠️ Project/Code/Name 관련 헤더 매핑 실패: "${header}" (정규화: "${normalizedHeader}", 소문자: "${headerLower}")`);
        }
      }
    });
    
    // 디버깅: Project Code 매핑 최종 확인
    if (headerIndexMap['projectCode'] !== undefined) {
      console.log(`✅ Project Code 최종 확인: 인덱스 ${headerIndexMap['projectCode']}, 헤더: "${headers[headerIndexMap['projectCode']]}"`);
    } else {
      console.log(`❌ Project Code 매핑 실패. 사용 가능한 헤더:`, headers);
      console.log(`❌ Project Code 관련 헤더 매핑 테이블 키:`, Object.keys(headerMapping).filter(k => k.includes('프로젝트') || k.includes('코드') || k.includes('project') || k.includes('code')));
      console.log(`📋 모든 헤더 상세:`, headers.map((h, i) => {
        const normalized = normalizeHeader(h);
        return `${i}: "${h}" (정규화: "${normalized}")`;
      }));
      
      // Project Code 관련 헤더 찾기 시도 (더 유연한 매칭)
      let projectCodeIndex = -1;
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const normalized = normalizeHeader(header).toLowerCase();
        const originalLower = header.toLowerCase();
        
        // 다양한 패턴으로 매칭 시도
        if ((normalized.includes('프로젝트') && normalized.includes('코드')) ||
            (normalized.includes('project') && normalized.includes('code')) ||
            (normalized.includes('프로젝트') && normalized.includes('유형') && normalized.includes('코드')) ||
            (originalLower.includes('프로젝트') && originalLower.includes('코드')) ||
            (originalLower.includes('project') && originalLower.includes('code')) ||
            normalized === '프로젝트 유형 코드' ||
            normalized === '프로젝트유형코드' ||
            normalized === '프로젝트 코드' ||
            normalized === '프로젝트코드' ||
            originalLower === '프로젝트 유형 코드' ||
            originalLower === '프로젝트유형코드' ||
            originalLower === '프로젝트 코드' ||
            originalLower === '프로젝트코드') {
          projectCodeIndex = i;
          console.log(`💡 Project Code로 추정되는 헤더: "${header}" (인덱스 ${i}, 정규화: "${normalized}")`);
          break;
        }
      }
      
      if (projectCodeIndex >= 0) {
        headerIndexMap['projectCode'] = projectCodeIndex;
        console.log(`✅ Project Code 매핑 수동 설정 완료`);
      } else {
        console.log(`⚠️ Project Code 헤더를 찾을 수 없습니다. (선택적 필드이므로 계속 진행)`);
        console.log(`🔍 프로젝트/코드 관련 헤더 검색:`, headers.filter(h => {
          const hLower = h.toLowerCase();
          return hLower.includes('프로젝트') || hLower.includes('project') || hLower.includes('코드') || hLower.includes('code');
        }));
        // Project Code가 없어도 계속 진행 (선택적 필드)
      }
    }

    // 데이터 행 파싱
    for (let i = 1; i < allLines.length; i++) {
      let parts = parseCsvLine(allLines[i], delimiter);
      
      // 따옴표 제거 및 trim
      parts = parts.map(p => {
        let cleaned = p.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }
        return cleaned.replace(/""/g, '"');
      });

      // 헤더 개수에 맞춰 부족한 컬럼은 빈 문자열로 채움
      while (parts.length < headers.length) {
        parts.push('');
      }

      // 헤더 기반으로 값 가져오기
      const get = (fieldName: string) => {
        const index = headerIndexMap[fieldName];
        if (index === undefined || index >= parts.length) {
          if (fieldName === 'projectCode') {
            console.log(`⚠️ Project Code 값 가져오기 실패: 인덱스 ${index}, parts.length: ${parts.length}, headerIndexMap:`, headerIndexMap);
          }
          return undefined;
        }
        const value = parts[index];
        const result = value === '' ? undefined : value;
        if (fieldName === 'projectCode' && result) {
          console.log(`✅ Project Code 값: "${result}" (인덱스 ${index})`);
        } else if (fieldName === 'projectCode' && !result) {
          console.log(`⚠️ Project Code 값이 비어있음: 인덱스 ${index}, 원본 값: "${value}"`);
        }
        if (fieldName === 'projectName') {
          console.log(`🔍 Project Name 값 가져오기: 인덱스 ${index}, 값: "${result}", 원본: "${value}"`);
        }
        if (fieldName === 'projectCategory') {
          console.log(`🔍 Project Category 값 가져오기: 인덱스 ${index}, 값: "${result}", 원본: "${value}"`);
        }
        return result;
      };

      // 거래유형 확인
      const category = get('category') || '';
      const categoryUpper = category.toUpperCase();
      const isValidCategory = validCategories.some(valid => 
        categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
      );

      if (!isValidCategory) continue; // 유효한 거래유형이 아니면 스킵

      const parseAmount = (val: string): { amount?: number; currency?: string } => {
        if (!val || val === '') return { amount: undefined, currency: undefined };
        const hasWon = val.includes('₩') || val.includes('원');
        const hasDollar = val.includes('$') || val.includes('USD') || val.toUpperCase().includes('USD');
        const numStr = val.replace(/[₩$,\s원USD]/gi, '');
        const amount = numStr ? Number(numStr) : undefined;
        const currency = hasDollar ? 'USD' : (hasWon ? 'KRW' : 'KRW');
        return { amount, currency };
      };

      const parseNumber = (val: string) => {
        if (!val || val === '') return undefined;
        const numStr = val.replace(/[₩$,\s원USD]/gi, '');
        return numStr ? Number(numStr) : undefined;
      };

      // 날짜 파싱 함수: 다양한 형식을 YYYY-MM-DD로 변환
      const parseDate = (val: string | undefined): string | undefined => {
        if (!val || val === '') return undefined;
        
        // 이미 YYYY-MM-DD 형식이면 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return val;
        }
        
        // "2025. 12. 31." 또는 "2025.12.31" 형식 처리
        const dotFormat = val.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/);
        if (dotFormat) {
          const year = dotFormat[1];
          const month = dotFormat[2].padStart(2, '0');
          const day = dotFormat[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // "2025/12/31" 형식 처리
        const slashFormat = val.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
        if (slashFormat) {
          const year = slashFormat[1];
          const month = slashFormat[2].padStart(2, '0');
          const day = slashFormat[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // "20251231" 형식 처리
        const compactFormat = val.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (compactFormat) {
          return `${compactFormat[1]}-${compactFormat[2]}-${compactFormat[3]}`;
        }
        
        // Date 객체로 파싱 시도
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        console.warn(`날짜 파싱 실패: "${val}"`);
        return undefined;
      };

      const expectedDepositAmountData = parseAmount(get('expectedDepositAmount') || '');
      const depositAmountData = parseAmount(get('depositAmount') || '');

      // invoiceAttachmentStatus 변환
      const invoiceAttachment = get('invoiceAttachment');
      let invoiceAttachmentStatus: 'required' | 'completed' | 'not_required' | undefined = undefined;
      if (invoiceAttachment) {
        if (invoiceAttachment.includes('완료') || invoiceAttachment.includes('completed')) {
          invoiceAttachmentStatus = 'completed';
        } else if (invoiceAttachment.includes('필요') || invoiceAttachment.includes('required')) {
          invoiceAttachmentStatus = 'required';
        } else if (invoiceAttachment.includes('불요') || invoiceAttachment.includes('not_required')) {
          invoiceAttachmentStatus = 'not_required';
        }
      }

      // 프로젝트 유형을 통해 프로젝트 코드 자동 매핑
      const projectCategory = get('projectCategory');
      let projectCode = get('projectCode');
      
      // 프로젝트 코드가 없고 프로젝트 유형이 있으면 매핑에서 찾기
      if (!projectCode && projectCategory) {
        const mappedCode = projectCategoryToCodeMap.get(projectCategory);
        if (mappedCode) {
          projectCode = mappedCode;
          console.log(`✅ 프로젝트 유형 "${projectCategory}" -> 프로젝트 코드 "${projectCode}" 자동 매핑`);
        } else {
          console.log(`⚠️ 프로젝트 유형 "${projectCategory}"에 대한 프로젝트 코드를 찾을 수 없습니다.`);
        }
      }

      parsedRecords.push({
        category: get('category'),
        vendorCode: get('vendorCode'),
        companyName: get('companyName'),
        businessRegistrationNumber: get('businessRegistrationNumber'),
        invoiceEmail: get('invoiceEmail'),
        projectCode: projectCode,
        projectCategory: projectCategory,
        projectName: get('projectName'),
        eoeoManager: get('eoeoManager'),
        contractLink: get('contractLink'),
        estimateLink: get('estimateLink'),
        attributionYearMonth: get('attributionYearMonth'),
        advanceBalance: get('advanceBalance'),
        ratio: get('ratio') || undefined,
        expectedDepositDate: parseDate(get('expectedDepositDate')),
        oneTimeExpenseAmount: parseNumber(get('oneTimeExpenseAmount') || ''),
        expectedDepositAmount: expectedDepositAmountData.amount,
        expectedDepositCurrency: expectedDepositAmountData.currency,
        description: get('description'),
        depositDate: parseDate(get('depositDate')),
        depositAmount: depositAmountData.amount,
        depositCurrency: depositAmountData.currency,
        createdDate: parseDate(get('createdDate')),
        invoiceCopy: get('invoiceCopy'),
        issueNotes: get('issueNotes'),
        taxStatus: get('taxStatus'),
        invoiceSupplyPrice: parseNumber(get('invoiceSupplyPrice') || ''),
        brandName: get('brandName'),
        projectCategory2: get('projectCategory2'),
        projectCategory3: get('projectCategory3'),
        projectCode2: get('projectCode2'),
        projectCode3: get('projectCode3'),
        invoiceAttachmentStatus,
        depositStatus: get('depositStatus') as '입금완료' | '입금예정' | '입금지연' | undefined,
      });
    }

    return parsedRecords;
    } catch (parseError) {
      console.error('CSV 파싱 중 오류 발생:', parseError);
      console.error('파싱 중인 텍스트 (처음 500자):', text.substring(0, 500));
      throw new Error(`CSV 파싱 오류: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`);
    }
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) {
      setError('CSV 데이터를 입력해주세요.');
      return;
    }

    try {
      const parsed = parseCsvText(csvText);
      if (parsed.length === 0) {
        setError('파싱된 데이터가 없습니다.');
        return;
      }

      // 거래처 코드와 프로젝트 코드로 자동 연동
      const enrichedRecords = parsed.map((record, idx) => {
        let enriched = { ...record };

        // 거래처 코드로 연동
        if (record.vendorCode) {
          const vendor = vendors.find(v => v.code === record.vendorCode);
          if (vendor) {
            enriched.companyName = vendor.name;
            enriched.businessRegistrationNumber = vendor.business_number || '';
            enriched.invoiceEmail = vendor.invoice_email || '';
          }
        }

        // 프로젝트 코드로 연동 (projectName이 이미 있으면 덮어쓰지 않음)
        if (record.projectCode && !record.projectName) {
          const project = projects.find(p => p.code === record.projectCode);
          if (project) {
            enriched.projectName = project.name;
            console.log(`✅ 프로젝트 코드 "${record.projectCode}" -> 프로젝트 이름 "${project.name}" 자동 채움`);
          }
        } else if (record.projectCode && record.projectName) {
          console.log(`ℹ️ 프로젝트 이름이 이미 있으므로 자동 채우기 건너뜀: "${record.projectName}"`);
        }

        // brandName을 brandNames 배열로 변환 (쉼표로 구분된 문자열 처리)
        if (record.brandName) {
          const brandArray = record.brandName.split(',').map(b => b.trim()).filter(b => b);
          const newBrands = new Map(recordBrands);
          newBrands.set(idx, brandArray.length > 0 ? brandArray : [record.brandName]);
          setRecordBrands(newBrands);
        }

        return enriched;
      });

      setRecords(enrichedRecords);
      setShowCsvInput(false);
      setError(null);
    } catch (err) {
      console.error('CSV 파싱 오류 상세:', err);
      const errorMessage = err instanceof Error 
        ? `CSV 파싱 중 오류가 발생했습니다: ${err.message}` 
        : 'CSV 파싱 중 오류가 발생했습니다.';
      setError(errorMessage);
    }
  };

  const updateRecord = (index: number, updates: Partial<OnlineCommerceTeam>) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], ...updates };
    setRecords(newRecords);
  };

  const handleVendorCodeChange = (index: number, vendorCode: string) => {
    const vendor = vendors.find(v => v.code === vendorCode);
    if (vendor) {
      updateRecord(index, {
        vendorCode,
        companyName: vendor.name,
        businessRegistrationNumber: vendor.business_number || '',
        invoiceEmail: vendor.invoice_email || '',
      });
    } else {
      updateRecord(index, { vendorCode, companyName: '', businessRegistrationNumber: '', invoiceEmail: '' });
    }
  };

  const handleProjectCodeChange = (index: number, projectCode: string) => {
    const project = projects.find(p => p.code === projectCode);
    if (project) {
      updateRecord(index, { projectCode, projectName: project.name });
    } else {
      updateRecord(index, { projectCode, projectName: '' });
    }
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setInvoiceFiles(new Map(invoiceFiles.set(index, { file, url })));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = new Map(invoiceFiles);
    const fileData = newFiles.get(index);
    if (fileData) {
      URL.revokeObjectURL(fileData.url);
    }
    newFiles.delete(index);
    setInvoiceFiles(newFiles);
  };

  const handleSaveEdit = (index: number) => {
    setEditingIndex(null);
  };


  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 파일 업로드 처리
      const recordsToSubmit = await Promise.all(
        records.map(async (record, index) => {
          const fileData = invoiceFiles.get(index);
          let invoiceCopyUrl = record.invoiceCopy || null;

          if (fileData) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', fileData.file);
            formDataUpload.append('folder', 'invoice-copies');

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload,
            });

            const uploadData = await uploadResponse.json();
            
            if (!uploadResponse.ok || !uploadData.success) {
              const errorMsg = uploadData.error || uploadData.details?.message || `파일 업로드에 실패했습니다. (항목 ${index + 1})`;
              console.error(`파일 업로드 실패 (항목 ${index + 1}):`, uploadData);
              throw new Error(errorMsg);
            }
            
            invoiceCopyUrl = uploadData.url;
          }

          const brandNames = recordBrands.get(index) || (record.brandName ? [record.brandName] : []);
          
          // 필수 필드 검증
          if (!record.vendorCode) {
            console.warn(`⚠️ 항목 ${index + 1}: 거래처코드가 없습니다.`, record);
          }
          if (!record.category) {
            console.warn(`⚠️ 항목 ${index + 1}: 거래유형이 없습니다.`, record);
          }
          // Project Code는 선택적 필드이므로 정보만 출력 (에러 아님)
          if (!record.projectCode) {
            console.log(`ℹ️ 항목 ${index + 1}: 프로젝트 코드가 없습니다 (선택적 필드).`, record);
          }
          
          return {
            ...record,
            brandNames: brandNames.length > 0 ? brandNames : undefined,
            invoiceCopy: invoiceCopyUrl,
          };
        })
      );

      console.log('일괄 등록 요청 데이터:', { recordsCount: recordsToSubmit.length, firstRecord: recordsToSubmit[0], allRecords: recordsToSubmit });

      const response = await fetch('/api/income-records/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team: 'online_commerce', records: recordsToSubmit }),
      });

      const data = await response.json();
      console.log('일괄 등록 API 응답:', data);

      if (!response.ok) {
        const errorMsg = data.error || data.message || '일괄 등록에 실패했습니다.';
        console.error('일괄 등록 API 오류:', { status: response.status, data });
        throw new Error(`일괄 등록 실패 (HTTP ${response.status}): ${errorMsg}`);
      }

      // API 응답이 success: false인 경우
      if (!data.success) {
        const errorMsg = data.error || data.message || '일괄 등록에 실패했습니다.';
        console.error('일괄 등록 API 실패:', data);
        throw new Error(errorMsg);
      }

      // API가 성공했더라도 일부 항목이 실패했을 수 있음 (207 Multi-Status)
      if (response.status === 207 || (data.failedCount && data.failedCount > 0)) {
        const errorDetails = data.errors && data.errors.length > 0
          ? data.errors.join('\n')
          : `${data.failedCount || 0}개의 항목이 등록에 실패했습니다.`;
        console.error('일부 항목 등록 실패:', { successCount: data.successCount, failedCount: data.failedCount, errors: data.errors, fullData: data });
        
        // 에러가 있으면 상세 정보 표시
        if (data.errors && data.errors.length > 0) {
          console.error('상세 에러 정보:', data.errors);
          // 각 에러를 개별적으로 출력
          data.errors.forEach((err: string, idx: number) => {
            console.error(`에러 ${idx + 1}:`, err);
          });
        }
        
        // 성공한 항목이 있으면 경고만 표시하고 계속 진행
        if (data.successCount && data.successCount > 0) {
          console.warn(`일부 항목 등록 실패 (성공: ${data.successCount}개, 실패: ${data.failedCount}개)`);
          // 성공한 항목이 있으면 계속 진행 (에러를 throw하지 않음)
        } else {
          // 모든 항목이 실패한 경우에만 에러 발생
          const fullErrorMsg = `모든 항목 등록 실패 (실패: ${data.failedCount || 0}개):\n${errorDetails}`;
          console.error('전체 등록 실패:', fullErrorMsg);
          throw new Error(fullErrorMsg);
        }
      }

      // 모든 항목이 성공한 경우
      if (data.successCount !== undefined) {
        console.log(`일괄 등록 완료: 성공 ${data.successCount}개`);
        if (data.successCount === 0 && recordsToSubmit.length > 0) {
          throw new Error('모든 항목이 등록에 실패했습니다. 에러 메시지를 확인해주세요.');
        }
      } else if (data.success) {
        // successCount가 없지만 success가 true인 경우
        console.log('일괄 등록 완료');
      }

      console.log('일괄 등록 성공, onSuccess 호출 전');
      onSuccess();
      console.log('onSuccess 호출 후, onClose 호출 전');
      onClose();
      console.log('onClose 호출 후');
    } catch (err) {
      console.error('일괄 등록 오류:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : (typeof err === 'string' ? err : '알 수 없는 오류가 발생했습니다.');
      setError(errorMessage);
      // 에러가 발생해도 모달을 닫지 않음 (사용자가 에러를 확인하고 수정할 수 있도록)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-xl border border-purple-500/20 w-full max-w-7xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-200">일괄 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showCsvInput ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    CSV 데이터 붙여넣기
                  </label>
                </div>
                <div className="mb-3 p-3 bg-black/40 border border-purple-500/30 rounded-md">
                  <p className="text-xs text-cyan-400 mb-2 font-semibold">⚠️ 중요: 다운로드받은 CSV 파일에서 헤더(첫 번째 줄)부터 함께 복사하여 붙여넣기 해주세요.</p>
                  <p className="text-xs text-gray-400 mb-2">필드 순서 (35개 컬럼):</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    0:구분 | 1:거래처코드 | 2:회사명 | 3:사업자등록번호 | 4:인보이스이메일 | 5:프로젝트코드 | 6:프로젝트유형 | 7:프로젝트명 | 8:EOEO담당자 | 9:계약서링크 | 10:견적서링크 | 11:인보이스링크 | 12:귀속연월 | 13:선/잔금 | 14:비율 | 15:입금예정일 | 16:실비금액 | 17:입금예정금액 | 18:입금예정통화 | 19:적요 | 20:입금일 | 21:입금액 | 22:입금통화 | 23:작성일자 | 24:세금계산서사본 | 25:ISSUE사항 | 26:과/면세/영세 | 27:세금계산서발행공급가 | 28:브랜드명(쉼표구분) | 29:프로젝트유형2(생략가능) | 30:프로젝트유형3(생략가능) | 31:프로젝트코드2(생략가능) | 32:프로젝트코드3(생략가능) | 33:세금계산서첨부상태 | 34:입금여부
                  </p>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500 font-mono text-sm"
                  placeholder="CSV 파일에서 복사하여 붙여넣기 하세요 (탭으로 구분)"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded whitespace-pre-wrap">
                  <div className="font-semibold mb-1">오류 발생:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button type="button" onClick={handleParseCsv}>
                  파싱 및 확인
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded whitespace-pre-wrap">
                  <div className="font-semibold mb-1">오류 발생:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200">파싱된 데이터 ({records.length}개)</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCsvInput(true)} className="border-purple-500/30 text-gray-200 hover:bg-black/40">
                  CSV 다시 입력
                </Button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {records.map((record, index) => (
                  <div key={index} className="border border-purple-500/30 rounded-lg p-4 bg-black/40 backdrop-blur-sm">
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              거래처코드 <span className="text-red-400">*</span>
                            </label>
                            <SearchableSelect
                              value={record.vendorCode || ''}
                              onChange={(value) => handleVendorCodeChange(index, value)}
                              options={vendors.map(v => ({ value: v.code, label: `${v.code} - ${v.name}` }))}
                              placeholder="선택하세요"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              거래유형 <span className="text-red-400">*</span>
                            </label>
                            <SearchableSelect
                              value={record.category || ''}
                              onChange={(value) => updateRecord(index, { category: value })}
                              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                              placeholder="선택하세요"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Project code <span className="text-red-400">*</span>
                            </label>
                            <SearchableSelect
                              value={record.projectCode || ''}
                              onChange={(value) => handleProjectCodeChange(index, value)}
                              options={projects.map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                              placeholder="선택하세요"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={record.companyName || ''}
                              onChange={(e) => updateRecord(index, { companyName: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Brand Name
                            </label>
                            <MultiSelect
                              value={recordBrands.get(index) || (record.brandName ? [record.brandName] : [])}
                              onChange={(brands) => {
                                const newBrands = new Map(recordBrands);
                                newBrands.set(index, brands);
                                setRecordBrands(newBrands);
                                updateRecord(index, { brandName: brands.length > 0 ? brands[0] : undefined, brandNames: brands.length > 0 ? brands : undefined });
                              }}
                              options={brands}
                              placeholder="브랜드를 선택하세요"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Project name
                            </label>
                            <input
                              type="text"
                              value={record.projectName || ''}
                              onChange={(e) => updateRecord(index, { projectName: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금 예정금액
                            </label>
                            <input
                              type="number"
                              value={record.expectedDepositAmount || ''}
                              onChange={(e) => updateRecord(index, { expectedDepositAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금액
                            </label>
                            <input
                              type="number"
                              value={record.depositAmount || ''}
                              onChange={(e) => updateRecord(index, { depositAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              프로젝트 유형
                            </label>
                            <input
                              type="text"
                              value={record.projectCategory || ''}
                              onChange={(e) => updateRecord(index, { projectCategory: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금 예정일
                            </label>
                            <input
                              type="date"
                              value={record.expectedDepositDate || ''}
                              onChange={(e) => updateRecord(index, { expectedDepositDate: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금일
                            </label>
                            <input
                              type="date"
                              value={record.depositDate || ''}
                              onChange={(e) => updateRecord(index, { depositDate: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금 예정 통화
                            </label>
                            <SearchableSelect
                              value={record.expectedDepositCurrency || 'KRW'}
                              onChange={(value) => updateRecord(index, { expectedDepositCurrency: value as 'KRW' | 'USD' })}
                              options={[
                                { value: 'KRW', label: 'KRW' },
                                { value: 'USD', label: 'USD' }
                              ]}
                              placeholder="선택하세요"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금 통화
                            </label>
                            <SearchableSelect
                              value={record.depositCurrency || 'KRW'}
                              onChange={(value) => updateRecord(index, { depositCurrency: value as 'KRW' | 'USD' })}
                              options={[
                                { value: 'KRW', label: 'KRW' },
                                { value: 'USD', label: 'USD' }
                              ]}
                              placeholder="선택하세요"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              실비금액
                            </label>
                            <input
                              type="number"
                              value={record.oneTimeExpenseAmount || ''}
                              onChange={(e) => updateRecord(index, { oneTimeExpenseAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서 발행 공급가
                            </label>
                            <input
                              type="number"
                              value={record.invoiceSupplyPrice || ''}
                              onChange={(e) => updateRecord(index, { invoiceSupplyPrice: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              귀속연월
                            </label>
                            <input
                              type="text"
                              value={record.attributionYearMonth || ''}
                              onChange={(e) => updateRecord(index, { attributionYearMonth: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                              placeholder="예: 2512"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              선/잔금
                            </label>
                            <input
                              type="text"
                              value={record.advanceBalance || ''}
                              onChange={(e) => updateRecord(index, { advanceBalance: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              적요
                            </label>
                            <input
                              type="text"
                              value={record.description || ''}
                              onChange={(e) => updateRecord(index, { description: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서 사본 (스크린샷)
                            </label>
                            <div className="flex items-center gap-4">
                              {invoiceFiles.has(index) ? (
                                <div className="flex items-center gap-2">
                                  <img src={invoiceFiles.get(index)!.url} alt="세금계산서" className="max-w-xs max-h-32 border border-purple-500/30 rounded" />
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 rounded-md cursor-pointer hover:bg-black/40 text-gray-200 w-fit">
                                  <UploadIcon className="h-4 w-4" />
                                  <span className="text-sm">파일 선택</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(index, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button type="button" variant="outline" onClick={() => setEditingIndex(null)} className="border-purple-500/30 text-gray-200 hover:bg-black/40">
                            취소
                          </Button>
                          <Button type="button" onClick={() => handleSaveEdit(index)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            <Save className="h-4 w-4 mr-1" />
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">거래처코드:</span>
                            <span className="ml-2 font-medium text-gray-200">{record.vendorCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">거래유형:</span>
                            <span className="ml-2 font-medium text-gray-200">{record.category || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Project code:</span>
                            <span className="ml-2 font-medium text-gray-200">{record.projectCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">입금액:</span>
                            <span className="ml-2 font-medium text-gray-200">{record.depositAmount ? new Intl.NumberFormat('ko-KR').format(record.depositAmount) : '-'}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(index)}
                          className="border-purple-500/30 text-gray-200 hover:bg-black/40"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!showCsvInput && (
          <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-xl border-t border-purple-500/20 p-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-purple-500/30 text-gray-200 hover:bg-black/40"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSubmit} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : `일괄 등록 (${records.length}개)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
