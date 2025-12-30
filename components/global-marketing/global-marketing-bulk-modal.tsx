'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon, Edit2, Save, XCircle } from 'lucide-react';
import { GlobalMarketingTeam } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { GLOBAL_MARKETING_CATEGORIES } from '@/lib/constants';

interface GlobalMarketingBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GlobalMarketingBulkModal({ isOpen, onClose, onSuccess }: GlobalMarketingBulkModalProps) {
  const [csvText, setCsvText] = useState('');
  const [records, setRecords] = useState<Partial<GlobalMarketingTeam>[]>([]);
  const [vendors, setVendors] = useState<Array<{ code: string; name: string; business_number?: string; invoice_email?: string }>>([]);
  const [projects, setProjects] = useState<Array<{ code: string; name: string }>>([]);
  const [projectCategoryToCodeMap, setProjectCategoryToCodeMap] = useState<Map<string, string>>(new Map());
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [recordBrands, setRecordBrands] = useState<Map<number, string[]>>(new Map());
  const [recordProjects, setRecordProjects] = useState<Map<number, string[]>>(new Map());
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
      setRecordProjects(new Map());
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

  const parseCsvText = (text: string, categoryToCodeMap: Map<string, string>): Partial<GlobalMarketingTeam>[] => {
    const parsedRecords: Partial<GlobalMarketingTeam>[] = [];

    if (!text.trim()) return parsedRecords;

    try {
      // 허용된 거래유형 값 목록 (GLOBAL_MARKETING_CATEGORIES 상수 사용)
      const validCategories = GLOBAL_MARKETING_CATEGORIES;

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
      const normalizeHeader = (header: string): string => {
        return header.trim().replace(/\s+/g, ' '); // 공백 정규화
      };

      const headerMapping: Record<string, string> = {
        '거래 유형': 'category',
        '거래처코드': 'vendorCode',
        '회사명': 'companyName',
        'Company Name': 'companyName',
        '브랜드명': 'brandName',
        'Brand Name': 'brandName',
        '사업자번호': 'businessRegistrationNumber',
        '사업자등록번호': 'businessRegistrationNumber',
        '이메일': 'invoiceEmail',
        '세금계산서 발행 이메일': 'invoiceEmail',
        '담당자': 'eoeoManager',
        'EOEO 담당자': 'eoeoManager',
        '계약서': 'contractLink',
        '계약서 (LINK)': 'contractLink',
        '견적서': 'estimateLink',
        '견적서 (LINK)': 'estimateLink',
        '귀속년월': 'attributionYearMonth',
        '귀속연월': 'attributionYearMonth',
        '선/잔금': 'advanceBalance',
        '비율': 'ratio',
        '입금예정일': 'expectedDepositDate',
        '입금 예정일': 'expectedDepositDate',
        'One-time 실비 금액': 'oneTimeExpenseAmount',
        '입금 예정금액': 'expectedDepositAmount',
        '입금 예정금액 (부가세 포함)': 'expectedDepositAmount',
        '예정금액': 'expectedDepositAmount',
        '적요': 'description',
        '입금일': 'depositDate',
        '입금액': 'depositAmount',
        '작성일': 'createdDate',
        '작성일자': 'createdDate',
        '세금계산서 사본': 'invoiceCopy',
        '세금계산서 사본 (LINK)': 'invoiceCopy',
        '이슈': 'issueNotes',
        'ISSUE사항': 'issueNotes',
        '과/면세/영세': 'taxStatus',
        '세금계산서발행공급가': 'invoiceSupplyPrice',
        '세금계산서 발행 공급가': 'invoiceSupplyPrice',
        '프로젝트 유형 코드': 'projectCode',
        '프로젝트유형코드': 'projectCode',
        '프로젝트 코드': 'projectCode',
        '프로젝트코드': 'projectCode',
        '거래 유형 코드': 'projectCode',
        '거래유형코드': 'projectCode',
        '프로젝트 유형': 'projectCategory',
        '프로젝트유형': 'projectCategory',
        '거래유형 세부': 'project',
        'Project Name': 'projectName',
        '프로젝트명': 'projectName',
        'Project name': 'projectName',
        '프로젝트유형2': 'projectCategory2',
        '프로젝트 유형2': 'projectCategory2',
        '프로젝트유형3': 'projectCategory3',
        '프로젝트 유형3': 'projectCategory3',
        '프로젝트코드2': 'projectCode2',
        '프로젝트 코드2': 'projectCode2',
        '프로젝트코드3': 'projectCode3',
        '프로젝트 코드3': 'projectCode3',
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

      // 헤더 인덱스 매핑 생성
      const headerIndexMap: Record<string, number> = {};
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
              break;
            }
          }
        }
        
        // Project Name 특별 처리
        if (!fieldName) {
          if (headerLower === 'project name' || normalizedLower === 'project name') {
            fieldName = 'projectName';
          } else if (headerLower === '프로젝트명' || normalizedLower === '프로젝트명') {
            fieldName = 'projectName';
          } else if (headerLower.includes('project') && headerLower.includes('name') && !headerLower.includes('code')) {
            fieldName = 'projectName';
          }
        }
        
        if (fieldName) {
          headerIndexMap[fieldName] = index;
        }
      });

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
            return undefined;
          }
          const value = parts[index];
          return value === '' ? undefined : value;
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

        // 날짜 파싱 함수
        const parseDate = (val: string | undefined): string | undefined => {
          if (!val || val === '') return undefined;
          
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            return val;
          }
          
          const dotFormat = val.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/);
          if (dotFormat) {
            const year = dotFormat[1];
            const month = dotFormat[2].padStart(2, '0');
            const day = dotFormat[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          
          const slashFormat = val.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (slashFormat) {
            const year = slashFormat[1];
            const month = slashFormat[2].padStart(2, '0');
            const day = slashFormat[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          
          const compactFormat = val.match(/^(\d{4})(\d{2})(\d{2})$/);
          if (compactFormat) {
            return `${compactFormat[1]}-${compactFormat[2]}-${compactFormat[3]}`;
          }
          
          const date = new Date(val);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          
          return undefined;
        };

        // 프로젝트 유형을 통해 프로젝트 코드 자동 매핑
        const projectCategory = get('projectCategory');
        let projectCode = get('projectCode');
        
        if (!projectCode && projectCategory) {
          const mappedCode = categoryToCodeMap.get(projectCategory);
          if (mappedCode) {
            projectCode = mappedCode;
          }
        }

        // Project Name 처리 (줄바꿈으로 분리)
        const projectNameCell = get('projectName') || '';
        const projectNames = projectNameCell.split('\n').map(name => name.trim()).filter(name => name);

        const expectedDepositAmountData = parseAmount(get('expectedDepositAmount') || '');
        const depositAmountData = parseAmount(get('depositAmount') || '');

        const record: Partial<GlobalMarketingTeam> = {
          category: get('category'),
          vendorCode: get('vendorCode'),
          companyName: get('companyName'),
          brandName: get('brandName'),
          businessRegistrationNumber: get('businessRegistrationNumber'),
          invoiceEmail: get('invoiceEmail'),
          projectCode: projectCode,
          projectCategory: projectCategory,
          project: get('project'),
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
          projectCategory2: get('projectCategory2'),
          projectCategory3: get('projectCategory3'),
          projectCode2: get('projectCode2'),
          projectCode3: get('projectCode3'),
        };

        // Project Name들을 각 필드에 할당 (최대 10개)
        if (projectNames.length > 0) {
          record.projectName = projectNames[0] || undefined;
          if (projectNames.length > 1) record.projectName2 = projectNames[1] || undefined;
          if (projectNames.length > 2) record.projectName3 = projectNames[2] || undefined;
          if (projectNames.length > 3) record.projectName4 = projectNames[3] || undefined;
          if (projectNames.length > 4) record.projectName5 = projectNames[4] || undefined;
          if (projectNames.length > 5) record.projectName6 = projectNames[5] || undefined;
          if (projectNames.length > 6) record.projectName7 = projectNames[6] || undefined;
          if (projectNames.length > 7) record.projectName8 = projectNames[7] || undefined;
          if (projectNames.length > 8) record.projectName9 = projectNames[8] || undefined;
          if (projectNames.length > 9) record.projectName10 = projectNames[9] || undefined;
        }

        parsedRecords.push(record);
      }
    } catch (err) {
      console.error('CSV 파싱 오류:', err);
      throw err;
    }

    return parsedRecords;
  };


  const handleParseCsv = () => {
    if (!csvText.trim()) {
      setError('CSV 데이터를 입력해주세요.');
      return;
    }

    try {
      const parsed = parseCsvText(csvText, projectCategoryToCodeMap);
      if (parsed.length === 0) {
        const lines = csvText.split('\n').filter(line => line.trim());
        let errorMsg = '파싱된 데이터가 없습니다.';
        
        if (lines.length === 0) {
          errorMsg += ' (입력된 데이터가 없습니다)';
        } else if (lines.length === 1) {
          errorMsg += ' (헤더만 있고 데이터 행이 없습니다)';
        } else {
          const delimiter = csvText.includes('\t') ? '\t' : ',';
          const headerLine = lines[0] || '';
          const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
          const validCategories = GLOBAL_MARKETING_CATEGORIES;
          
          // 첫 번째 데이터 행 확인
          const firstDataLine = lines[1] || '';
          const firstDataParts = firstDataLine.split(delimiter);
          const firstColumn = firstDataParts[0]?.trim().replace(/^"|"$/g, '') || '';
          const isValidCategory = validCategories.some(valid => 
            firstColumn.toUpperCase() === valid.toUpperCase() || 
            firstColumn.toUpperCase().includes(valid.toUpperCase())
          );
          
          if (!isValidCategory) {
            errorMsg += ` (첫 번째 데이터 행의 거래 유형 "${firstColumn}"이 유효하지 않습니다. 유효한 값: ${validCategories.join(', ')})`;
          } else {
            errorMsg += ' (데이터 형식을 확인해주세요. 헤더가 올바른지 확인하세요)';
          }
        }
        
        setError(errorMsg);
        return;
      }

      const enrichedRecords = parsed.map((record, idx) => {
        let enriched = { ...record };

        if (record.vendorCode) {
          const vendor = vendors.find(v => v.code === record.vendorCode);
          if (vendor) {
            enriched.companyName = vendor.name;
            enriched.businessRegistrationNumber = vendor.business_number || '';
            enriched.invoiceEmail = vendor.invoice_email || '';
          }
        }

        // projectCategory는 CSV에서 직접 입력한 값을 우선 사용
        // CSV에 projectCategory가 없을 때만 프로젝트 마스터 데이터에서 가져옴
        if (record.projectCode && !(record as any).projectCategory) {
          const project = projects.find(p => p.code === record.projectCode);
          if (project) {
            enriched.projectCategory = project.name;
          }
        }
        
        // 기존 projectCode를 recordProjects에 추가
        if (record.projectCode) {
          const codes: string[] = [record.projectCode];
          if ((record as any).projectCode2) codes.push((record as any).projectCode2);
          if ((record as any).projectCode3) codes.push((record as any).projectCode3);
          const newProjects = new Map(recordProjects);
          newProjects.set(idx, codes);
          setRecordProjects(newProjects);
        }

        // brandName을 brandNames 배열로 변환
        if (record.brandName) {
          const newBrands = new Map(recordBrands);
          newBrands.set(idx, [record.brandName]);
          setRecordBrands(newBrands);
        }

        return enriched;
      });

      setRecords(enrichedRecords);
      setShowCsvInput(false);
      setError(null);
    } catch (err) {
      setError('CSV 파싱 중 오류가 발생했습니다.');
    }
  };

  const updateRecord = (index: number, updates: Partial<GlobalMarketingTeam>) => {
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

  const handleProjectCodesChange = (index: number, projectCodes: string[]) => {
    const newProjects = new Map(recordProjects);
    newProjects.set(index, projectCodes);
    setRecordProjects(newProjects);
    
    // 선택된 프로젝트들을 project_code, project_code2, project_code3과 project_category, project_category2, project_category3에 매핑
    const updates: Record<string, string | undefined> = {};
    
    // 최대 3개까지만 저장
    const codesToSave = projectCodes.slice(0, 3);
    const categoriesToSave = codesToSave.map(code => {
      const project = projects.find(p => p.code === code);
      return project ? project.name : '';
    });
    
    // project_code 매핑
    updates.projectCode = codesToSave[0] || undefined;
    updates.projectCode2 = codesToSave[1] || undefined;
    updates.projectCode3 = codesToSave[2] || undefined;
    
    // project_category 매핑
    updates.projectCategory = categoriesToSave[0] || undefined;
    updates.projectCategory2 = categoriesToSave[1] || undefined;
    updates.projectCategory3 = categoriesToSave[2] || undefined;
    
    updateRecord(index, updates);
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
          return {
            ...record,
            brandNames: brandNames.length > 0 ? brandNames : undefined,
            invoiceCopy: invoiceCopyUrl,
            invoiceAttachmentStatus: invoiceCopyUrl ? 'completed' : (record.invoiceAttachmentStatus || 'required'),
          };
        })
      );

      const response = await fetch('/api/income-records/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team: 'global_marketing', records: recordsToSubmit }),
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
          
          const errorDetails = data.errors.slice(0, 10).join('\n');
          setError(`성공: ${data.successCount || 0}개, 실패: ${data.failedCount || 0}개\n\n실패한 항목:\n${errorDetails}${data.errors.length > 10 ? `\n... 외 ${data.errors.length - 10}개` : ''}`);
        } else {
          setError(`성공: ${data.successCount || 0}개, 실패: ${data.failedCount || 0}개`);
        }
      } else {
        // 모든 항목이 성공
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('일괄 등록 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
                  <p className="text-xs text-gray-400 mb-2">필드 순서 (37개 컬럼):</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    0:구분 | 1:거래처코드 | 2:회사명 | 3:사업자등록번호 | 4:인보이스이메일 | 5:프로젝트코드 | 6:프로젝트유형 | 7:프로젝트명 | 8:EOEO담당자 | 9:계약서링크 | 10:견적서링크 | 11:인보이스링크 | 12:차수 | 13:귀속연월 | 14:선/잔금 | 15:비율 | 16:건수 | 17:입금예정일 | 18:실비금액 | 19:입금예정금액 | 20:입금예정통화 | 21:적요 | 22:입금일 | 23:입금액 | 24:입금통화 | 25:작성일자 | 26:세금계산서사본 | 27:ISSUE사항 | 28:과/면세/영세 | 29:세금계산서발행공급가 | 30:브랜드명(쉼표구분) | 31:프로젝트유형2(생략가능) | 32:프로젝트유형3(생략가능) | 33:프로젝트코드2(생략가능) | 34:프로젝트코드3(생략가능) | 35:세금계산서첨부상태 | 36:입금여부
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
                              거래처코드 <span className="text-red-500">*</span>
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
                              구분 <span className="text-red-400">*</span>
                            </label>
                            <SearchableSelect
                              value={record.category || ''}
                              onChange={(value) => updateRecord(index, { category: value })}
                              options={GLOBAL_MARKETING_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                              placeholder="선택하세요"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Project code <span className="text-red-400">*</span>
                            </label>
                            <MultiSelect
                              value={recordProjects.get(index) || [
                                record.projectCode,
                                record.projectCode2,
                                record.projectCode3,
                              ].filter((code): code is string => !!code)}
                              onChange={(codes) => handleProjectCodesChange(index, codes)}
                              options={projects.map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                              placeholder="프로젝트를 선택하세요 (최대 3개)"
                              className="w-full"
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
                              사업자등록번호
                            </label>
                            <input
                              type="text"
                              value={record.businessRegistrationNumber || ''}
                              onChange={(e) => updateRecord(index, { businessRegistrationNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서 발행 이메일
                            </label>
                            <input
                              type="email"
                              value={record.invoiceEmail || ''}
                              onChange={(e) => updateRecord(index, { invoiceEmail: e.target.value })}
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
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              EOEO 담당자
                            </label>
                            <input
                              type="text"
                              value={record.eoeoManager || ''}
                              onChange={(e) => updateRecord(index, { eoeoManager: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              계약서 (LINK)
                            </label>
                            <input
                              type="url"
                              value={record.contractLink || ''}
                              onChange={(e) => updateRecord(index, { contractLink: e.target.value || undefined })}
                              placeholder="https://example.com/contract"
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                            {record.contractLink && (
                              <a 
                                href={record.contractLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                              >
                                링크 열기 →
                              </a>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              견적서 (LINK)
                            </label>
                            <input
                              type="url"
                              value={record.estimateLink || ''}
                              onChange={(e) => updateRecord(index, { estimateLink: e.target.value || undefined })}
                              placeholder="https://example.com/estimate"
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                            {record.estimateLink && (
                              <a 
                                href={record.estimateLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                              >
                                링크 열기 →
                              </a>
                            )}
                          </div>


                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              귀속년월
                            </label>
                            <input
                              type="text"
                              value={record.attributionYearMonth || ''}
                              onChange={(e) => updateRecord(index, { attributionYearMonth: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
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
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              비율
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={record.ratio || ''}
                              onChange={(e) => updateRecord(index, { ratio: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              건수
                            </label>
                            <input
                              type="number"
                              value={record.count || ''}
                              onChange={(e) => updateRecord(index, { count: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              입금예정일
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
                              One-time 실비 금액
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
                              입금 예정금액 (부가세 포함)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={record.expectedDepositAmount || ''}
                                onChange={(e) => updateRecord(index, { expectedDepositAmount: e.target.value ? Number(e.target.value) : undefined })}
                                className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                                placeholder="금액 입력"
                              />
                              <select
                                value={record.expectedDepositCurrency || 'KRW'}
                                onChange={(e) => updateRecord(index, { expectedDepositCurrency: e.target.value })}
                                className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                              >
                                <option value="KRW">KRW</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              적요
                            </label>
                            <input
                              type="text"
                              value={record.description || ''}
                              onChange={(e) => updateRecord(index, { description: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
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
                              입금액
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={record.depositAmount || ''}
                                onChange={(e) => updateRecord(index, { depositAmount: e.target.value ? Number(e.target.value) : undefined })}
                                className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                                placeholder="금액 입력"
                              />
                              <select
                                value={record.depositCurrency || 'KRW'}
                                onChange={(e) => updateRecord(index, { depositCurrency: e.target.value })}
                                className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                              >
                                <option value="KRW">KRW</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              작성일자
                            </label>
                            <input
                              type="date"
                              value={record.createdDate || ''}
                              onChange={(e) => updateRecord(index, { createdDate: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서 첨부 상태
                            </label>
                            <SearchableSelect
                              value={record.invoiceAttachmentStatus || 'required'}
                              onChange={(value) => updateRecord(index, { invoiceAttachmentStatus: value as 'required' | 'completed' | 'not_required' })}
                              options={[
                                { value: 'required', label: '첨부필요' },
                                { value: 'not_required', label: '첨부불요' },
                                ...(invoiceFiles.has(index) || record.invoiceCopy ? [{ value: 'completed', label: '첨부완료' }] : []),
                              ]}
                              placeholder="상태 선택"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              ISSUE사항
                            </label>
                            <input
                              type="text"
                              value={record.issueNotes || ''}
                              onChange={(e) => updateRecord(index, { issueNotes: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              과/면세/영세
                            </label>
                            <input
                              type="text"
                              value={record.taxStatus || ''}
                              onChange={(e) => updateRecord(index, { taxStatus: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서발행공급가
                            </label>
                            <input
                              type="number"
                              value={record.invoiceSupplyPrice || ''}
                              onChange={(e) => updateRecord(index, { invoiceSupplyPrice: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              세금계산서 사본 (스크린샷)
                            </label>
                            <div className="flex items-center gap-4">
                              {invoiceFiles.has(index) ? (
                                <div className="flex items-center gap-2">
                                  <img src={invoiceFiles.get(index)!.url} alt="세금계산서" className="max-w-xs max-h-32 border rounded" />
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 rounded-md cursor-pointer hover:bg-black/40 bg-black/40 text-gray-200 w-fit">
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
                          <Button type="button" variant="outline" onClick={() => setEditingIndex(null)}>
                            취소
                          </Button>
                          <Button type="button" onClick={() => handleSaveEdit(index)}>
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
                            <span className="text-gray-400">구분:</span>
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


