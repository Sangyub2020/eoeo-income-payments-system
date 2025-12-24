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

    // 허용된 거래유형 값 목록
    const validCategories = [
      '파트너십 - 서비스매출',
      '파트너십 - 수출바우처',
      'B2B',
      '재고 바이백',
      '배송비',
      'other',
    ];

    // 구분자 확인
    const delimiter = text.includes('\t') ? '\t' : ',';
    const expectedColumnCount = 33; // 온라인커머스팀은 oneTimeExpenseAmount가 없어서 33개

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
        let parts = parseCsvLine(currentRecord, delimiter);
        
        // 부족한 컬럼은 빈 문자열로 채움
        while (parts.length < expectedColumnCount) {
          parts.push('');
        }
        
        // 따옴표 제거 및 trim
        parts = parts.map(p => {
          let cleaned = p.trim();
          // 앞뒤 따옴표 제거
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
          }
          return cleaned;
        });
        
        // '거래유형' 열(첫 번째 컬럼)이 허용된 값 중 하나인 경우만 새 레코드로 인식
        const category = parts[0] || '';
        const categoryUpper = category.toUpperCase();
        const isValidCategory = validCategories.some(valid => 
          categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
        );
        
        if (isValidCategory && parts.length >= 2) {
          // 레코드 파싱
          // 이스케이프된 따옴표 복원
          parts = parts.map(p => p.replace(/""/g, '"'));
          
          currentRecord = ''; // 다음 레코드를 위해 초기화
          quoteCount = 0; // 따옴표 카운터 초기화
          
          const parseAmount = (val: string): { amount?: number; currency?: string } => {
            if (!val || val === '') return { amount: undefined, currency: undefined };
            // 통화 기호 확인
            const hasWon = val.includes('₩') || val.includes('원');
            const hasDollar = val.includes('$') || val.includes('USD') || val.toUpperCase().includes('USD');
            
            // 통화 기호 제거 및 숫자 추출
            const numStr = val.replace(/[₩$,\s원USD]/gi, '');
            const amount = numStr ? Number(numStr) : undefined;
            const currency = hasDollar ? 'USD' : (hasWon ? 'KRW' : 'KRW'); // 기본값은 KRW
            
            return { amount, currency };
          };
          
          const parseNumber = (val: string) => {
            if (!val || val === '') return undefined;
            const numStr = val.replace(/[₩$,\s원USD]/gi, '');
            return numStr ? Number(numStr) : undefined;
          };

          // 안전하게 인덱스 접근
          const get = (index: number) => {
            const value = index < parts.length ? parts[index] : '';
            return value === '' ? undefined : value;
          };

          parsedRecords.push({
          category: get(0),
          vendorCode: get(1),
          companyName: get(2),
          brandName: get(3),
          businessRegistrationNumber: get(4),
          invoiceEmail: get(5),
          projectCode: get(6),
          project: get(7),
          projectName: get(8),
          eoeoManager: get(9),
          contractLink: get(10),
          estimateLink: get(11),
          installmentNumber: get(12) ? Number(get(12)) : undefined,
          attributionYearMonth: get(13),
          advanceBalance: get(14),
          ratio: get(15) ? Number(get(15)) : undefined,
          count: get(16) ? Number(get(16)) : undefined,
          expectedDepositDate: get(17),
          // 온라인 커머스팀은 oneTimeExpenseAmount가 없지만, CSV 데이터에는 포함되어 있을 수 있음
          // 인덱스 18: oneTimeExpenseAmount (온라인 커머스팀에는 없지만 CSV에 있을 수 있음 - 빈칸)
          // 인덱스 19: expectedDepositAmount (₩3,300,000 또는 $3,300 형식)
          ...(() => {
            const parsed = parseAmount(get(19) || '');
            return {
              expectedDepositAmount: parsed.amount,
              expectedDepositCurrency: parsed.currency,
            };
          })(),
          // 인덱스 20: description (적요) - "아마존 마케팅 서비스"
          description: get(20),
          // 인덱스 21: depositDate (입금일) - 빈칸
          depositDate: get(21),
          // 인덱스 22: depositAmount (입금액) - "3,300,000" 또는 "$3,300"
          ...(() => {
            const parsed = parseAmount(get(22) || '');
            return {
              depositAmount: parsed.amount,
              depositCurrency: parsed.currency,
            };
          })(),
          // 인덱스 23: exchangeGainLoss (환차손익) - "확인중"
          exchangeGainLoss: (() => {
            const value = get(23);
            if (!value) return undefined;
            const lowerValue = value.toLowerCase();
            return lowerValue === '확인중' || lowerValue === 'x' ? undefined : parseNumber(value || '');
          })(),
          // 인덱스 24: difference (차액) - "X"
          difference: (() => {
            const value = get(24);
            if (!value) return undefined;
            return value.toLowerCase() === 'x' ? undefined : parseNumber(value || '');
          })(),
          // 인덱스 25: createdDate (작성일자) - 빈칸
          createdDate: get(25),
          // 인덱스 27: invoiceCopy (세금계산서 사본) - 빈칸
          invoiceCopy: get(27),
          // 인덱스 28: issueNotes (ISSUE사항) - 빈칸
          issueNotes: get(28),
          // 인덱스 29: year (년) - "2024"
          year: get(29) ? Number(get(29)) : undefined,
          // 인덱스 30: expectedDepositMonth (입금 예정월) - "9"
          expectedDepositMonth: get(30) ? Number(get(30)) : undefined,
          // 인덱스 31: depositMonth (입금 월) - "NA"
          depositMonth: (() => {
            const value = get(31);
            return value && value.toUpperCase() !== 'NA' ? Number(value) : undefined;
          })(),
          // 인덱스 32: taxStatus (과/면세/영세) - 빈칸
          taxStatus: get(32),
          // 인덱스 33: invoiceSupplyPrice (세금계산서발행공급가) - "₩3,000,000"
          invoiceSupplyPrice: parseNumber(get(33) || ''),
        });
        }
      }
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

        // 프로젝트 코드로 연동
        if (record.projectCode) {
          const project = projects.find(p => p.code === record.projectCode);
          if (project) {
            enriched.projectName = project.name;
          }
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
          return {
            ...record,
            brandNames: brandNames.length > 0 ? brandNames : undefined,
            invoiceCopy: invoiceCopyUrl,
          };
        })
      );

      console.log('일괄 등록 요청 데이터:', { recordsCount: recordsToSubmit.length, firstRecord: recordsToSubmit[0] });

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

      // API가 성공했더라도 일부 항목이 실패했을 수 있음
      if (data.result && data.result.failed > 0) {
        const errorDetails = data.result.errors && data.result.errors.length > 0
          ? data.result.errors.join('\n')
          : `${data.result.failed}개의 항목이 등록에 실패했습니다.`;
        console.error('일부 항목 등록 실패:', data.result);
        throw new Error(`일부 항목 등록 실패 (성공: ${data.result.success}개, 실패: ${data.result.failed}개):\n${errorDetails}`);
      }

      // 모든 항목이 성공한 경우
      if (data.result) {
        console.log(`일괄 등록 완료: 성공 ${data.result.success}개, 실패 ${data.result.failed || 0}개`);
        if (data.result.success === 0 && recordsToSubmit.length > 0) {
          throw new Error('모든 항목이 등록에 실패했습니다. 에러 메시지를 확인해주세요.');
        }
      }

      onSuccess();
      onClose();
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-wrap">
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-wrap">
                  <div className="font-semibold mb-1">오류 발생:</div>
                  <div>{error}</div>
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
                              거래유형 <span className="text-red-500">*</span>
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
                            <span className="text-gray-500">거래유형:</span>
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
