'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon } from 'lucide-react';
import { OnlineCommerceTeam } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { CATEGORIES } from '@/lib/constants';

interface OnlineCommerceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OnlineCommerceFormModal({ isOpen, onClose, onSuccess }: OnlineCommerceFormModalProps) {
  const [formData, setFormData] = useState<Partial<OnlineCommerceTeam>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileUrl, setInvoiceFileUrl] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Array<{ code: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ code: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [expectedDepositAmountInput, setExpectedDepositAmountInput] = useState<string>('');
  const [depositAmountInput, setDepositAmountInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchProjects();
      fetchBrands();
      setFormData({
        invoiceAttachmentStatus: 'required', // 기본값: 첨부필요
      });
      setSelectedBrands([]);
      setError(null);
      setInvoiceFile(null);
      setInvoiceFileUrl(null);
      setExpectedDepositAmountInput('');
      setDepositAmountInput('');
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const vendorList = data.data.map((v: any) => ({ code: v.code, name: v.name })).filter((v: any) => v.code && v.name);
          setVendors(vendorList);
          console.log('거래처 로드 완료:', vendorList.length, '개');
        } else {
          console.error('거래처 데이터 형식 오류:', data);
        }
      } else {
        console.error('거래처 조회 실패:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('거래처 조회 오류:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const projectList = data.data.map((p: any) => ({ code: p.code, name: p.name })).filter((p: any) => p.code && p.name);
          setProjects(projectList);
          console.log('프로젝트 로드 완료:', projectList.length, '개');
        } else {
          console.error('프로젝트 데이터 형식 오류:', data);
        }
      } else {
        console.error('프로젝트 조회 실패:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('프로젝트 조회 오류:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      console.log('🔵 브랜드 조회 시작...');
      const response = await fetch('/api/brands', { cache: 'no-store' });
      console.log('🔵 브랜드 API 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔵 브랜드 API 응답 데이터:', data);
        console.log('🔵 data.success:', data.success);
        console.log('🔵 data.data:', data.data);
        console.log('🔵 data.data 타입:', typeof data.data);
        console.log('🔵 data.data 길이:', data.data?.length);
        
        if (data.success && data.data) {
          console.log('🔵 브랜드 원본 데이터 개수:', data.data.length);
          console.log('🔵 브랜드 원본 데이터 (처음 3개):', data.data.slice(0, 3));
          // 필터링을 먼저 하고, 그 다음에 매핑해야 함!
          const brandList = data.data
            .filter((b: any) => {
              const hasName = !!b.name && b.name.trim() !== '';
              if (!hasName) {
                console.log('⚠️ name이 없는 브랜드 필터링됨:', b);
              }
              return hasName;
            })
            .map((b: any) => {
              return { value: b.name, label: b.name };
            });
          console.log('🔵 브랜드 필터링 후 개수:', brandList.length);
          console.log('🔵 브랜드 목록 (처음 10개):', brandList.slice(0, 10));
          setBrands(brandList);
          console.log('✅ 브랜드 로드 완료:', brandList.length, '개');
        } else {
          console.error('❌ 브랜드 데이터 형식 오류:', data);
          setBrands([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ 브랜드 조회 실패:', response.status, response.statusText, errorText);
        setBrands([]);
      }
    } catch (err) {
      console.error('❌ 브랜드 조회 오류:', err);
      setBrands([]);
    }
  };

  // 거래처 코드 연동
  const handleVendorCodeChange = async (vendorCode: string) => {
    if (!vendorCode) {
      setFormData((prev) => ({
        ...prev,
        vendorCode: '',
        companyName: '',
        businessRegistrationNumber: '',
        invoiceEmail: '',
      }));
      return;
    }

    try {
      const response = await fetch(`/api/vendors?code=${vendorCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const vendor = data.data[0];
          setFormData((prev) => ({
            ...prev,
            vendorCode,
            companyName: vendor.name,
            businessRegistrationNumber: vendor.business_number || '',
            invoiceEmail: vendor.invoice_email || '',
          }));
        }
      }
    } catch (err) {
      console.error('거래처 정보 조회 오류:', err);
    }
  };

  // Project Code 연동
  const handleProjectCodeChange = async (projectCode: string) => {
    if (!projectCode) {
      setFormData((prev) => ({
        ...prev,
        projectCode: '',
        projectName: '',
      }));
      return;
    }

    const project = projects.find(p => p.code === projectCode);
    if (project) {
      setFormData((prev) => ({
        ...prev,
        projectCode,
        project: project.name,
        // projectName은 사용자가 직접 입력하므로 자동으로 채우지 않음
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        projectCode,
        project: '',
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setInvoiceFileUrl(url);
      // 파일이 업로드되면 상태를 'completed'로 자동 변경
      setFormData(prev => ({
        ...prev,
        invoiceAttachmentStatus: 'completed',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let invoiceCopyUrl = formData.invoiceCopy || null;

      // 파일 업로드
      if (invoiceFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', invoiceFile);
        formDataUpload.append('folder', 'invoice-copies');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok || !uploadData.success) {
          const errorMsg = uploadData.error || uploadData.details?.message || '파일 업로드에 실패했습니다.';
          console.error('파일 업로드 실패:', uploadData);
          throw new Error(errorMsg);
        }
        
        invoiceCopyUrl = uploadData.url;
      }

      const response = await fetch('/api/income-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team: 'online_commerce',
          ...formData,
          brandNames: selectedBrands.length > 0 ? selectedBrands : undefined,
          invoiceCopy: invoiceCopyUrl,
          invoiceAttachmentStatus: invoiceCopyUrl ? 'completed' : (formData.invoiceAttachmentStatus || 'required'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '입금 정보 등록에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 비율 필드 처리 (자동으로 % 붙이기)
    if (name === 'ratio') {
      // 숫자만 추출 (% 제거)
      const numericValue = value.replace(/[%]/g, '').replace(/[^\d.]/g, '');
      // 숫자가 있으면 %를 붙여서 저장, 없으면 빈 문자열
      const ratioValue = numericValue ? `${numericValue}%` : '';
      setFormData((prev) => ({
        ...prev,
        ratio: ratioValue,
      }));
      return;
    }
    
    // 입금액 필드 처리 (통화 기호 인식)
    if (name === 'expectedDepositAmount') {
      // 숫자만 추출 (통화 기호, 쉼표, 공백 등 제거)
      const numericValue = value.replace(/[₩$,\s원USD]/gi, '').replace(/[^\d]/g, '');
      setExpectedDepositAmountInput(numericValue);
      
      const amount = numericValue ? Number(numericValue) : undefined;
      
      // 통화 감지
      const hasWon = value.includes('₩') || value.includes('원');
      const hasDollar = value.includes('$') || value.includes('USD') || value.toUpperCase().includes('USD');
      
      setFormData((prev) => {
        const currency = hasDollar ? 'USD' : (hasWon ? 'KRW' : (prev.expectedDepositCurrency || 'KRW'));
        return {
          ...prev,
          expectedDepositAmount: amount,
          expectedDepositCurrency: currency,
        };
      });
      return;
    }
    
    if (name === 'depositAmount') {
      // 숫자만 추출 (통화 기호, 쉼표, 공백 등 제거)
      const numericValue = value.replace(/[₩$,\s원USD]/gi, '').replace(/[^\d]/g, '');
      setDepositAmountInput(numericValue);
      
      const amount = numericValue ? Number(numericValue) : undefined;
      
      // 통화 감지
      const hasWon = value.includes('₩') || value.includes('원');
      const hasDollar = value.includes('$') || value.includes('USD') || value.toUpperCase().includes('USD');
      
      setFormData((prev) => {
        const currency = hasDollar ? 'USD' : (hasWon ? 'KRW' : (prev.depositCurrency || 'KRW'));
        return {
          ...prev,
          depositAmount: amount,
          depositCurrency: currency,
        };
      });
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : (name.includes('Amount') || name.includes('Number') || name === 'ratio' || name === 'invoiceSupplyPrice')
        ? (value === '' ? undefined : Number(value))
        : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-xl w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-200">입금 정보 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              거래유형 <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              value={formData.category || ''}
              onChange={(value) => handleChange({ target: { name: 'category', value } } as any)}
              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
              placeholder="선택하세요"
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="vendorCode" className="block text-sm font-medium text-gray-300 mb-1">
                거래처코드 <span className="text-red-400">*</span>
              </label>
              <SearchableSelect
                value={formData.vendorCode || ''}
                onChange={(value) => handleVendorCodeChange(value)}
                options={vendors.map(v => ({ value: v.code, label: `${v.code} - ${v.name}` }))}
                placeholder="선택하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">
                Company Name <span className="text-cyan-400 text-xs">(자동 기입)</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-stone-700/30 backdrop-blur-sm"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-300 mb-1">
                사업자등록번호 <span className="text-cyan-400 text-xs">(자동 기입)</span>
              </label>
              <input
                type="text"
                id="businessRegistrationNumber"
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-stone-700/30 backdrop-blur-sm"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="invoiceEmail" className="block text-sm font-medium text-gray-300 mb-1">
                세금계산서 발행 이메일 <span className="text-cyan-400 text-xs">(자동 기입)</span>
              </label>
              <input
                type="email"
                id="invoiceEmail"
                name="invoiceEmail"
                value={formData.invoiceEmail || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-stone-700/30 backdrop-blur-sm"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="brandNames" className="block text-sm font-medium text-gray-300 mb-1">
                Brand Name
              </label>
              <MultiSelect
                value={selectedBrands}
                onChange={setSelectedBrands}
                options={brands}
                placeholder="브랜드를 선택하세요"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="projectCode" className="block text-sm font-medium text-gray-300 mb-1">
                project code <span className="text-red-400">*</span>
              </label>
              <SearchableSelect
                value={formData.projectCode || ''}
                onChange={(value) => handleProjectCodeChange(value)}
                options={projects.map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                placeholder="선택하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-300 mb-1">
                project category <span className="text-cyan-400 text-xs">(자동 기입)</span>
              </label>
              <input
                type="text"
                id="project"
                name="project"
                value={formData.project || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-stone-700/30 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
                Project name
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="eoeoManager" className="block text-sm font-medium text-gray-300 mb-1">
                EOEO 담당자
              </label>
              <input
                type="text"
                id="eoeoManager"
                name="eoeoManager"
                value={formData.eoeoManager || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="contractLink" className="block text-sm font-medium text-gray-300 mb-1">
                계약서 (LINK)
              </label>
              <input
                type="url"
                id="contractLink"
                name="contractLink"
                value={formData.contractLink || ''}
                onChange={handleChange}
                placeholder="https://example.com/contract"
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
              {formData.contractLink && (
                <a 
                  href={formData.contractLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                >
                  링크 열기 →
                </a>
              )}
            </div>

            <div>
              <label htmlFor="estimateLink" className="block text-sm font-medium text-gray-300 mb-1">
                견적서 (LINK)
              </label>
              <input
                type="url"
                id="estimateLink"
                name="estimateLink"
                value={formData.estimateLink || ''}
                onChange={handleChange}
                placeholder="https://example.com/estimate"
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
              {formData.estimateLink && (
                <a 
                  href={formData.estimateLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                >
                  링크 열기 →
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="attributionYearMonth" className="block text-sm font-medium text-gray-300 mb-1">
                귀속년월
              </label>
              <input
                type="text"
                id="attributionYearMonth"
                name="attributionYearMonth"
                value={formData.attributionYearMonth || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="advanceBalance" className="block text-sm font-medium text-gray-300 mb-1">
                선/잔금
              </label>
              <select
                id="advanceBalance"
                name="advanceBalance"
                value={formData.advanceBalance || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
              >
                <option value="">선택하세요</option>
                <option value="선금">선금</option>
                <option value="잔금">잔금</option>
                <option value="일시불">일시불</option>
              </select>
            </div>

            <div>
              <label htmlFor="ratio" className="block text-sm font-medium text-gray-300 mb-1">
                비율
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="ratio"
                  name="ratio"
                  value={formData.ratio ? formData.ratio.replace('%', '') : ''}
                  onChange={handleChange}
                  placeholder="예: 70"
                  className="w-full px-3 py-2 pr-8 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="expectedDepositDate" className="block text-sm font-medium text-gray-300 mb-1">
                입금예정일
              </label>
              <input
                type="date"
                id="expectedDepositDate"
                name="expectedDepositDate"
                value={formData.expectedDepositDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="expectedDepositAmount" className="block text-sm font-medium text-gray-300 mb-1">
                입금 예정금액 (부가세 포함)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="expectedDepositAmount"
                  name="expectedDepositAmount"
                  value={expectedDepositAmountInput ? `${formData.expectedDepositCurrency === 'USD' ? '$' : '₩'}${expectedDepositAmountInput.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : ''}
                  onChange={handleChange}
                  onBlur={() => {
                    // blur 시 포맷팅된 값으로 업데이트
                    if (expectedDepositAmountInput) {
                      const amount = Number(expectedDepositAmountInput);
                      setFormData((prev) => ({
                        ...prev,
                        expectedDepositAmount: amount,
                      }));
                    }
                  }}
                  placeholder="₩1,000,000 또는 $1,000"
                  className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                />
                <select
                  name="expectedDepositCurrency"
                  value={formData.expectedDepositCurrency || 'KRW'}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setFormData(prev => ({ ...prev, expectedDepositCurrency: newCurrency }));
                  }}
                  className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                >
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                적요
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="depositDate" className="block text-sm font-medium text-gray-300 mb-1">
                입금일
              </label>
              <input
                type="date"
                id="depositDate"
                name="depositDate"
                value={formData.depositDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-300 mb-1">
                입금액
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="depositAmount"
                  name="depositAmount"
                  value={formData.depositAmount ? `${formData.depositCurrency === 'USD' ? '$' : '₩'}${formData.depositAmount.toLocaleString()}` : ''}
                  onChange={handleChange}
                  placeholder="₩1,000,000 또는 $1,000"
                  className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
                />
                <select
                  name="depositCurrency"
                  value={formData.depositCurrency || 'KRW'}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositCurrency: e.target.value }))}
                  className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                >
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>



            <div>
              <label htmlFor="invoiceAttachmentStatus" className="block text-sm font-medium text-gray-300 mb-1">
                세금계산서 첨부 상태
              </label>
              <SearchableSelect
                value={formData.invoiceAttachmentStatus || 'required'}
                onChange={(value) => handleChange({ target: { name: 'invoiceAttachmentStatus', value } } as any)}
                options={[
                  { value: 'required', label: '첨부필요' },
                  { value: 'not_required', label: '첨부불요' },
                  ...(invoiceFileUrl || formData.invoiceCopy ? [{ value: 'completed', label: '첨부완료' }] : []),
                ]}
                placeholder="상태 선택"
                disabled={false}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="invoiceCopy" className="block text-sm font-medium text-gray-300 mb-1">
                세금계산서 사본 (스크린샷)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 rounded-md cursor-pointer hover:bg-black/40 backdrop-blur-sm w-fit">
                  <UploadIcon className="h-4 w-4" />
                  <span className="text-sm">파일 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {invoiceFileUrl && (
                  <div className="mt-2">
                    <img src={invoiceFileUrl} alt="세금계산서 사본" className="max-w-xs max-h-48 border rounded" />
                    <p className="text-xs text-gray-400 mt-1">{invoiceFile?.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="issueNotes" className="block text-sm font-medium text-gray-300 mb-1">
                ISSUE사항
              </label>
              <input
                type="text"
                id="issueNotes"
                name="issueNotes"
                value={formData.issueNotes || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>


            <div>
              <label htmlFor="taxStatus" className="block text-sm font-medium text-gray-300 mb-1">
                과/면세/영세
              </label>
              <input
                type="text"
                id="taxStatus"
                name="taxStatus"
                value={formData.taxStatus || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="invoiceSupplyPrice" className="block text-sm font-medium text-gray-300 mb-1">
                세금계산서발행공급가
              </label>
              <input
                type="number"
                id="invoiceSupplyPrice"
                name="invoiceSupplyPrice"
                value={formData.invoiceSupplyPrice || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-purple-500/20 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

