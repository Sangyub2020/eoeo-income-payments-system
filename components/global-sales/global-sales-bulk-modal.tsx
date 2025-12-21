'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon, Edit2, Save, XCircle } from 'lucide-react';
import { GlobalSalesTeam } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CATEGORIES } from '@/lib/constants';

interface GlobalSalesBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GlobalSalesBulkModal({ isOpen, onClose, onSuccess }: GlobalSalesBulkModalProps) {
  const [csvText, setCsvText] = useState('');
  const [records, setRecords] = useState<Partial<GlobalSalesTeam>[]>([]);
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

  const parseCsvText = (text: string): Partial<GlobalSalesTeam>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsedRecords: Partial<GlobalSalesTeam>[] = [];

    if (lines.length === 0) return parsedRecords;

    // 구분자 확인 (첫 번째 비어있지 않은 행 기준)
    const firstDataLine = lines.find(line => line.trim());
    if (!firstDataLine) return parsedRecords;
    
    const delimiter = firstDataLine.includes('\t') ? '\t' : ',';
    const expectedColumnCount = 34; // 고정된 컬럼 수

    for (const line of lines) {
      // 탭으로 split하면 빈 칸도 빈 문자열로 배열에 포함됨
      let parts = line.split(delimiter);
      
      // 부족한 컬럼은 빈 문자열로 채움 (빈 칸도 올바른 인덱스에 매핑되도록)
      while (parts.length < expectedColumnCount) {
        parts.push('');
      }
      
      // 각 셀의 앞뒤 공백만 제거 (빈 문자열은 유지)
      parts = parts.map(p => p.trim());
      
      // 허용된 구분 값 목록
      const validCategories = [
        'ONE-TIME',
        '파트너십/마케팅지원비',
        '기재고사입',
        '정부지원사업',
        'other',
        'B2B',
        '배송비',
        '기재고판매',
      ];
      
      // '구분' 열(첫 번째 컬럼)이 허용된 값 중 하나인 경우만 새 레코드로 인식
      const category = parts[0] || '';
      const categoryUpper = category.toUpperCase();
      const isValidCategory = validCategories.some(valid => 
        categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
      );
      
      if (!isValidCategory) {
        continue; // 허용된 구분이 없으면 이 행은 건너뜀
      }
      
      // 최소 2개 컬럼은 있어야 데이터로 인식 (구분, 거래처코드)
      if (parts.length >= 2) {
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
          invoiceLink: get(11),
          installmentNumber: get(12) ? Number(get(12)) : undefined,
          attributionYearMonth: get(13),
          advanceBalance: get(14),
          ratio: get(15) ? Number(get(15)) : undefined,
          count: get(16) ? Number(get(16)) : undefined,
          expectedDepositDate: get(17),
          oneTimeExpenseAmount: parseNumber(get(18) || ''),
          expectedDepositAmount: parseNumber(get(19) || ''),
          description: get(20),
          depositDate: get(21),
          depositAmount: parseNumber(get(22) || ''),
          exchangeGainLoss: parseNumber(get(23) || ''),
          difference: parseNumber(get(24) || ''),
          createdDate: get(25),
          invoiceIssued: get(26),
          invoiceCopy: get(27),
          issueNotes: get(28),
          year: get(29) ? Number(get(29)) : undefined,
          expectedDepositMonth: get(30) ? Number(get(30)) : undefined,
          depositMonth: get(31) ? Number(get(31)) : undefined,
          taxStatus: get(32),
          invoiceSupplyPrice: parseNumber(get(33) || ''),
        });
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
      const enrichedRecords = parsed.map(record => {
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

        return enriched;
      });

      setRecords(enrichedRecords);
      setShowCsvInput(false);
      setError(null);
    } catch (err) {
      setError('CSV 파싱 중 오류가 발생했습니다.');
    }
  };

  const updateRecord = (index: number, updates: Partial<GlobalSalesTeam>) => {
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

          return {
            ...record,
            invoiceCopy: invoiceCopyUrl,
          };
        })
      );

      const response = await fetch('/api/global-sales-team/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recordsToSubmit }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '일괄 등록에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (err) {
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
