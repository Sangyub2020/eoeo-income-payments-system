'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon, Edit2, Save, XCircle } from 'lucide-react';
import { GlobalMarketingTeam } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<Map<number, { file: File; url: string }>>(new Map());
  const [showCsvInput, setShowCsvInput] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchProjects();
      setCsvText('');
      setRecords([]);
      setError(null);
      setEditingIndex(null);
      setInvoiceFiles(new Map());
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

  const parseCsvText = (text: string): Partial<GlobalMarketingTeam>[] => {
    const parsedRecords: Partial<GlobalMarketingTeam>[] = [];

    if (!text.trim()) return parsedRecords;

    // 구분자 확인
    const delimiter = text.includes('\t') ? '\t' : ',';
    const expectedColumnCount = 34; // 고정된 컬럼 수

    // 허용된 구분 값 목록
    const validCategories = [
      '용역사업 - 서비스매출',
      '파트너십/마케팅지원비',
      '기재고사입',
      '용역사업 - 수출바우처',
      'other',
      'B2B',
      '배송비',
      '기재고판매',
    ];

    // 따옴표를 고려한 CSV 파싱 함수
    function parseCsvLine(text: string, delimiter: string): string[] {
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      let i = 0;

      while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1];

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
        } else if (char === '\n' && !inQuotes) {
          // 줄바꿈 (따옴표 밖에서만)
          parts.push(currentPart);
          break;
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
    }

    // 전체 텍스트를 레코드 단위로 분리 (따옴표 고려)
    const allLines = text.split('\n');
    let currentRecord = '';
    let inQuotes = false;
    let quoteCount = 0;

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      
      // 따옴표 개수 세기
      const lineQuoteCount = (line.match(/"/g) || []).length;
      quoteCount += lineQuoteCount;
      inQuotes = quoteCount % 2 === 1;

      // 현재 레코드에 줄 추가
      currentRecord = currentRecord ? currentRecord + '\n' + line : line;

      // 따옴표가 닫혔고, 탭으로 구분된 열이 예상 개수에 도달했는지 확인
      if (!inQuotes) {
        const parts = parseCsvLine(currentRecord, delimiter);
        
        // 첫 번째 열이 유효한 category인지 확인
        const firstColumn = parts[0]?.trim().replace(/^"|"$/g, '') || '';
        const categoryUpper = firstColumn.toUpperCase();
        const isValidCategory = validCategories.some(valid => 
          categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
        );

        // 유효한 category이고 열 수가 충분하면 레코드로 파싱
        if (isValidCategory && parts.length >= expectedColumnCount * 0.8) {
          // 부족한 컬럼은 빈 문자열로 채움
          while (parts.length < expectedColumnCount) {
            parts.push('');
          }
          
          // 따옴표 제거 및 trim
          const cleanedParts = parts.map(p => {
            let cleaned = p.trim();
            // 앞뒤 따옴표 제거
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            // 이스케이프된 따옴표 복원
            cleaned = cleaned.replace(/""/g, '"');
            return cleaned;
          });

          const record = parseRecord(cleanedParts);
          if (record) {
            parsedRecords.push(record);
          }
          currentRecord = '';
          quoteCount = 0;
        }
      }
    }

    // 마지막 레코드 처리 (따옴표가 닫히지 않았어도)
    if (currentRecord) {
      const parts = parseCsvLine(currentRecord, delimiter);
      while (parts.length < expectedColumnCount) {
        parts.push('');
      }
      
      const cleanedParts = parts.map(p => {
        let cleaned = p.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }
        cleaned = cleaned.replace(/""/g, '"');
        return cleaned;
      });

      const record = parseRecord(cleanedParts);
      if (record) parsedRecords.push(record);
    }

    function parseRecord(parts: string[]): Partial<GlobalMarketingTeam> | null {
      // '구분' 열(첫 번째 컬럼)이 허용된 값 중 하나인 경우만 레코드로 인식
      const category = parts[0] || '';
      const categoryUpper = category.toUpperCase();
      const isValidCategory = validCategories.some(valid => 
        categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
      );
      
      if (!isValidCategory || parts.length < 2) {
        return null;
      }

      const parseNumber = (val: string) => {
        if (!val || val === '') return undefined;
        const numStr = val.replace(/[₩,\s]/g, '');
        return numStr ? Number(numStr) : undefined;
      };

      // 안전하게 인덱스 접근
      const get = (index: number) => {
        const value = index < parts.length ? parts[index] : '';
        return value === '' ? undefined : value;
      };

      // 사용자 제공 열 순서에 맞게 매핑:
      // 0: 거래 유형, 1: 거래처코드, 2: Company Name, 3: Brand Name, 4: 사업자등록번호,
      // 5: 세금계산서 발행 이메일, 6: 거래 유형 코드, 7: 거래유형 세부, 8: Project name,
      // 9: EOEO 담당자, 10: 계약서 (LINK), 11: 견적서 (LINK), 12: 차수, 13: 귀속년월,
      // 14: 선/잔금, 15: 비율, 16: 건수, 17: 입금예정일, 18: One-time 실비 금액,
      // 19: 입금 예정금액 (부가세 포함), 20: 적요, 21: 입금일, 22: 입금액,
      // 23: 환차손익, 24: 차액, 25: 작성일자, 26: 세금계산서 발행 여부,
      // 27: 세금계산서 사본, 28: ISSUE사항, 29: 년, 30: 입금 예정월,
      // 31: 입금 월, 32: 과/면세/영세, 33: 세금계산서발행공급가
      // 주의: 7번 "거래유형 세부"는 project 필드에, 8번 "Project name"은 projectName 필드에 매핑
      // Project Name 셀에 줄바꿈이 있으면 각 줄을 projectName, projectName2, ...로 분리
      const projectNameCell = get(8) || '';
      const projectNames = projectNameCell.split('\n').map(name => name.trim()).filter(name => name);
      
      const record: Partial<GlobalMarketingTeam> = {
        category: get(0),                    // 거래 유형
        vendorCode: get(1),                  // 거래처코드
        companyName: get(2),                 // Company Name
        brandName: get(3),                   // Brand Name
        businessRegistrationNumber: get(4),  // 사업자등록번호
        invoiceEmail: get(5),                 // 세금계산서 발행 이메일
        projectCode: get(6),                 // 거래 유형 코드
        project: get(7),                     // 거래유형 세부 (더 이상 사용하지 않지만 호환성을 위해 유지)
        eoeoManager: get(9),                 // EOEO 담당자
        contractLink: get(10),               // 계약서 (LINK)
        estimateLink: get(11),               // 견적서 (LINK)
        installmentNumber: get(12) ? Number(get(12)) : undefined,  // 차수
        attributionYearMonth: get(13),       // 귀속년월
        advanceBalance: get(14),             // 선/잔금
        ratio: get(15) ? Number(get(15)) : undefined,  // 비율
        count: get(16) ? Number(get(16)) : undefined,  // 건수
        expectedDepositDate: get(17),        // 입금예정일
        oneTimeExpenseAmount: parseNumber(get(18) || ''),  // One-time 실비 금액
        expectedDepositAmount: parseNumber(get(19) || ''),  // 입금 예정금액 (부가세 포함)
        description: get(20),                // 적요
        depositDate: get(21),                 // 입금일
        depositAmount: parseNumber(get(22) || ''),  // 입금액
        exchangeGainLoss: parseNumber(get(23) || ''),  // 환차손익
        difference: parseNumber(get(24) || ''),  // 차액
        createdDate: get(25),                // 작성일자
        invoiceIssued: get(26),               // 세금계산서 발행 여부
        invoiceCopy: get(27),                // 세금계산서 사본
        issueNotes: get(28),                 // ISSUE사항
        year: get(29) ? Number(get(29)) : undefined,  // 년
        expectedDepositMonth: get(30) ? Number(get(30)) : undefined,  // 입금 예정월
        depositMonth: get(31) ? Number(get(31)) : undefined,  // 입금 월
        taxStatus: get(32),                  // 과/면세/영세
        invoiceSupplyPrice: parseNumber(get(33) || ''),  // 세금계산서발행공급가
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

      return record;
    }

    return parsedRecords;
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

      const enrichedRecords = parsed.map(record => {
        let enriched = { ...record };

        if (record.vendorCode) {
          const vendor = vendors.find(v => v.code === record.vendorCode);
          if (vendor) {
            enriched.companyName = vendor.name;
            enriched.businessRegistrationNumber = vendor.business_number || '';
            enriched.invoiceEmail = vendor.invoice_email || '';
          }
        }

        // projectName은 CSV에서 직접 입력한 값을 우선 사용
        // CSV에 projectName이 없을 때만 프로젝트 마스터 데이터에서 가져옴
        if (record.projectCode && !record.projectName) {
          const project = projects.find(p => p.code === record.projectCode);
          if (project) {
            enriched.projectName = project.name;
          }
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

          return {
            ...record,
            invoiceCopy: invoiceCopyUrl,
          };
        })
      );

      const response = await fetch('/api/global-marketing-team/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recordsToSubmit }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 에러 상세 정보 표시
        const errorDetails = data.result?.errors || [];
        const errorMessage = errorDetails.length > 0
          ? `일괄 등록 중 ${data.result?.failed || 0}개 실패:\n${errorDetails.slice(0, 10).join('\n')}${errorDetails.length > 10 ? `\n... 외 ${errorDetails.length - 10}개` : ''}`
          : (data.error || '일괄 등록에 실패했습니다.');
        throw new Error(errorMessage);
      }

      // 성공/실패 통계 표시
      if (data.result) {
        const { success, failed, errors } = data.result;
        if (failed > 0) {
          const errorDetails = errors.slice(0, 10).join('\n');
          setError(`성공: ${success}개, 실패: ${failed}개\n\n실패한 항목:\n${errorDetails}${errors.length > 10 ? `\n... 외 ${errors.length - 10}개` : ''}`);
        } else {
          onSuccess();
          onClose();
        }
      } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">일괄 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showCsvInput ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV 데이터 붙여넣기 (탭으로 구분)
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="CSV 파일에서 복사하여 붙여넣기 하세요"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">파싱된 데이터 ({records.length}개)</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCsvInput(true)}>
                  CSV 다시 입력
                </Button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {records.map((record, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              구분 <span className="text-red-500">*</span>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project code <span className="text-red-500">*</span>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={record.companyName || ''}
                              onChange={(e) => updateRecord(index, { companyName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Brand Name
                            </label>
                            <input
                              type="text"
                              value={record.brandName || ''}
                              onChange={(e) => updateRecord(index, { brandName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project name
                            </label>
                            <input
                              type="text"
                              value={record.projectName || ''}
                              onChange={(e) => updateRecord(index, { projectName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              실비금액
                            </label>
                            <input
                              type="number"
                              value={record.oneTimeExpenseAmount || ''}
                              onChange={(e) => updateRecord(index, { oneTimeExpenseAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              입금 예정금액
                            </label>
                            <input
                              type="number"
                              value={record.expectedDepositAmount || ''}
                              onChange={(e) => updateRecord(index, { expectedDepositAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              입금액
                            </label>
                            <input
                              type="number"
                              value={record.depositAmount || ''}
                              onChange={(e) => updateRecord(index, { depositAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              세금계산서 발행 여부
                            </label>
                            <SearchableSelect
                              value={record.invoiceIssued || ''}
                              onChange={(value) => updateRecord(index, { invoiceIssued: value })}
                              options={[
                                { value: 'O', label: 'O (발행)' },
                                { value: 'X', label: 'X (미발행)' },
                              ]}
                              placeholder="선택하세요"
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 w-fit">
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
                            <span className="text-gray-500">거래처코드:</span>
                            <span className="ml-2 font-medium">{record.vendorCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">구분:</span>
                            <span className="ml-2 font-medium">{record.category || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Project code:</span>
                            <span className="ml-2 font-medium">{record.projectCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">입금액:</span>
                            <span className="ml-2 font-medium">{record.depositAmount ? new Intl.NumberFormat('ko-KR').format(record.depositAmount) : '-'}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(index)}
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
          <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : `일괄 등록 (${records.length}개)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


