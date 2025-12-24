'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { InfluencerAccount } from '@/lib/types';

interface InfluencerAccountBulkFormProps {
  onSuccess: () => void;
}

export function InfluencerAccountBulkForm({ onSuccess }: InfluencerAccountBulkFormProps) {
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // 과학적 표기법을 일반 숫자로 변환하는 함수
  const parseScientificNotation = (value: string): string => {
    if (!value) return '';
    
    // 과학적 표기법 패턴 확인 (예: 3.223E+8, 3.25177E+11)
    const scientificMatch = value.match(/^(\d+\.?\d*)[Ee][\+\-]?(\d+)$/);
    if (scientificMatch) {
      const base = parseFloat(scientificMatch[1]);
      const exponent = parseInt(scientificMatch[2]);
      const result = base * Math.pow(10, exponent);
      // 소수점 제거 (정수로 변환)
      return Math.floor(result).toString();
    }
    
    return value.trim();
  };

  // 큰따옴표로 감싸진 필드를 처리하는 CSV 파싱 함수
  const parseTabSeparatedLine = (line: string): string[] => {
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
      } else if (char === '\t' && !inQuotes) {
        // 구분자 (따옴표 밖에서만)
        parts.push(currentPart.trim());
        currentPart = '';
        i++;
      } else if (char === '\n' && inQuotes) {
        // 큰따옴표 안의 줄바꿈은 공백이나 쉼표로 변환
        currentPart += ' ';
        i++;
      } else {
        currentPart += char;
        i++;
      }
    }

    // 마지막 부분 추가
    if (currentPart || parts.length > 0) {
      parts.push(currentPart.trim());
    }

    return parts;
  };

  const parseBulkText = (text: string): Omit<InfluencerAccount, 'id' | 'createdAt' | 'updatedAt'>[] => {
    // 전체 텍스트를 줄바꿈으로 분리하되, 큰따옴표 안의 줄바꿈은 무시
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 이스케이프된 따옴표
          currentLine += '"';
          i++; // 다음 따옴표 건너뛰기
        } else {
          // 따옴표 시작/끝
          inQuotes = !inQuotes;
          currentLine += char;
        }
      } else if (char === '\n' && !inQuotes) {
        // 큰따옴표 밖의 줄바꿈만 실제 줄바꿈으로 처리
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else if (char === '\n' && inQuotes) {
        // 큰따옴표 안의 줄바꿈은 특수 문자로 변환 (나중에 복원)
        currentLine += '\u0001'; // 제어 문자 사용
      } else {
        currentLine += char;
      }
    }
    
    // 마지막 줄 추가
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    const accounts: Omit<InfluencerAccount, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const line of lines) {
      // 탭으로 구분된 필드 파싱 (큰따옴표 처리 포함)
      const parts = line.includes('\t') 
        ? parseTabSeparatedLine(line)
        : line.split(',').map(p => p.trim());
      
      // 헤더 행 스킵 (첫 번째 행이 헤더일 수 있음)
      if (parts[0]?.toLowerCase() === 'email') {
        continue;
      }
      
      // 최소 필수 항목: Email, Recipient Type, Account Holder
      if (parts.length >= 5) {
        const recipientType = parts[1] as 'Personal' | 'Business' | undefined;
        const isBusiness = recipientType === 'Business';
        
        // Tiktok Account와 Instagram Account 처리
        let tiktokHandle = '';
        let tiktokHandles: string[] = [];
        let instagramHandles: string[] = [];
        
        if (isBusiness) {
          // Business일 때는 쉼표 또는 줄바꿈으로 구분된 여러 계정
          let tiktokAccountStr = parts[2] || '';
          let instagramAccountStr = parts[3] || '';
          
          // 큰따옴표 제거
          tiktokAccountStr = tiktokAccountStr.replace(/^"|"$/g, '');
          instagramAccountStr = instagramAccountStr.replace(/^"|"$/g, '');
          
          // 제어 문자를 줄바꿈으로 복원
          tiktokAccountStr = tiktokAccountStr.replace(/\u0001/g, '\n');
          instagramAccountStr = instagramAccountStr.replace(/\u0001/g, '\n');
          
          // 쉼표 또는 줄바꿈으로 분리하고 정리
          const tiktokAccounts = tiktokAccountStr
            ? tiktokAccountStr
                .split(/[,\n]+/)
                .map(a => a.trim())
                .filter(a => a)
                .map(a => a.startsWith('@') ? a : `@${a}`)
            : [];
          
          const instagramAccounts = instagramAccountStr
            ? instagramAccountStr
                .split(/[,\n]+/)
                .map(a => a.trim())
                .filter(a => a)
                .map(a => a.startsWith('@') ? a : `@${a}`)
            : [];
          
          tiktokHandles = tiktokAccounts;
          instagramHandles = instagramAccounts;
        } else {
          // Personal일 때는 단일 계정
          tiktokHandle = parts[2] || '';
          if (parts[3]) {
            // Instagram도 있을 수 있음 (단일)
            instagramHandles = [parts[3]];
          }
        }
        
        // 과학적 표기법 처리 (ACH routing number, Account Number)
        const achRoutingNumber = parseScientificNotation(parts[5] || '');
        const accountNumber = parseScientificNotation(parts[7] || '');
        
        accounts.push({
          email: parts[0] || '',
          recipientType: recipientType,
          tiktokHandle: isBusiness ? undefined : tiktokHandle,
          tiktokHandles: isBusiness ? tiktokHandles : undefined,
          instagramHandles: instagramHandles.length > 0 ? instagramHandles : undefined,
          fullName: parts[4] || '',
          achRoutingNumber: achRoutingNumber,
          swiftCode: parts[6] || '',
          accountNumber: accountNumber,
          accountType: parts[8] || '',
          wiseTag: parts[9] || '',
          address: parts[10] || '',
          phoneNumber: parts[11] || '',
        });
      }
    }

    return accounts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setWarning(null);
    setSuccess(false);
    setResult(null);

    try {
      const accounts = parseBulkText(bulkText);
      
      if (accounts.length === 0) {
        throw new Error('등록할 계좌 정보가 없습니다.');
      }

      // 경고: fullName이 없는 계좌가 있는지 확인
      const accountsWithoutName = accounts.filter(a => !a.fullName);
      const hasWarning = accountsWithoutName.length > 0;

      const response = await fetch('/api/influencer-accounts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '일괄 등록에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data.result);
      
      // 경고 메시지 표시
      if (hasWarning) {
        setWarning(`⚠️ ${accountsWithoutName.length}개의 계좌에 계좌 소유자 이름이 없습니다. 모든 계좌는 계좌 소유자 이름이 필수입니다.`);
      }
      
      if (data.result && data.result.failed > 0 && data.result.errors.length > 0) {
        const failedEmails = new Set<string>();
        data.result.errors.forEach((err: string) => {
          const match = err.match(/^([^:]+):/);
          if (match) {
            failedEmails.add(match[1].trim());
          }
        });
        
        const accounts = parseBulkText(bulkText);
        const failedAccounts = accounts.filter(a => failedEmails.has(a.email || ''));
        
        if (failedAccounts.length > 0) {
          const failedText = failedAccounts
            .map(a => {
              const recipientType = a.recipientType || '';
              const isBusiness = recipientType === 'Business';
              const tiktokAccount = isBusiness 
                ? (a.tiktokHandles?.join(', ') || '')
                : (a.tiktokHandle || '');
              const instagramAccount = isBusiness
                ? (a.instagramHandles?.join(', ') || '')
                : '';
              
              return [
                a.email || '',
                recipientType,
                tiktokAccount,
                instagramAccount,
                a.fullName || '',
                a.achRoutingNumber || '',
                a.swiftCode || '',
                a.accountNumber || '',
                a.accountType || '',
                a.wiseTag || '',
                a.address || '',
                a.phoneNumber || '',
              ].join('\t');
            })
            .join('\n');
          
          setBulkText(failedText);
        }
      } else {
        setBulkText('');
      }
      
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    // CSV 템플릿 헤더
    const headers = [
      'Email',
      'Recipient Type',
      'Tiktok Account',
      'Instagram Account',
      'Full Name of the Bank Account Holder',
      'ACH routing number',
      'SWIFT code (BIC)',
      'Account Number',
      'Account Type',
      'WISE TAG',
      'Address (Building number, Street, City, State, Country)',
      'Phone Number (With the Country Code)'
    ];

    // 예시 데이터 (Personal과 Business 각각)
    const exampleData = [
      [
        'example@email.com',
        'Personal',
        '@tiktokuser',
        '',
        'John Doe',
        '123456789',
        'SWIFTCODE',
        '1234567890',
        'Checking',
        'WISE123',
        '123 Main St, Seoul, Seoul, South Korea',
        '+82 10-1234-5678'
      ],
      [
        'business@email.com',
        'Business',
        '@business1, @business2',
        '@instagram1, @instagram2',
        'Business Name Inc.',
        '987654321',
        'SWIFTCODE2',
        '0987654321',
        'Savings',
        'WISE456',
        '456 Business Ave, Seoul, Seoul, South Korea',
        '+82 10-9876-5432'
      ]
    ];

    // CSV 내용 생성 (탭으로 구분)
    const csvContent = [
      headers.join('\t'),
      ...exampleData.map(row => row.join('\t'))
    ].join('\n');

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'influencer_accounts_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">일괄 등록</h3>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm text-blue-800 mb-2">
              <strong>입력 형식:</strong> CSV 파일에서 복사하여 붙여넣기 하세요 (탭으로 구분)
            </p>
        <p className="text-sm text-blue-700">
          헤더 순서: Email [탭] Recipient Type [탭] Tiktok Account [탭] Instagram Account [탭] Full Name of the Bank Account Holder [탭] ACH routing number [탭] SWIFT code (BIC) [탭] Account Number [탭] Account Type [탭] WISE TAG [탭] Address (Building number, Street, City, State, Country) [탭] Phone Number (With the Country Code)
        </p>
            <p className="text-xs text-blue-600 mt-2">
              * Recipient Type은 Personal 또는 Business를 입력하세요
              * Business일 경우 Tiktok Account와 Instagram Account는 쉼표(,)로 구분하여 여러 계정을 입력할 수 있습니다
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="ml-4 flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            템플릿 다운로드
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          {warning}
        </div>
      )}

      {success && result && (
        <div className={`border rounded mb-4 ${
          result.failed > 0 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="px-4 py-3">
            <p className="font-medium">
              {result.failed > 0 ? '⚠️ 부분 등록 완료' : '✅ 등록 완료'}: 성공 {result.success}건, 실패 {result.failed}건
            </p>
            {result.failed > 0 && (
              <p className="text-sm mt-2">
                실패한 항목은 텍스트 영역에 남아있습니다. 수정 후 다시 등록해주세요.
              </p>
            )}
            {result.errors.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium hover:underline">
                  실패 상세 내역 보기 ({result.errors.length}건)
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto bg-white rounded p-3 border">
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    {result.errors.slice(0, 100).map((err, idx) => (
                      <li key={idx} className="text-red-700">{err}</li>
                    ))}
                    {result.errors.length > 100 && (
                      <li className="text-gray-500 italic">
                        ... 외 {result.errors.length - 100}건의 오류가 더 있습니다.
                      </li>
                    )}
                  </ul>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bulkText" className="block text-sm font-medium text-gray-700 mb-2">
            계좌 정보 입력 (CSV에서 복사하여 붙여넣기)
          </label>
          <textarea
            id="bulkText"
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              if (error) setError(null);
              if (warning) setWarning(null);
              if (success) {
                setSuccess(false);
                setResult(null);
              }
            }}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="CSV 파일에서 복사하여 붙여넣기 하세요"
          />
          {bulkText.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              입력된 줄 수: {bulkText.split('\n').filter(line => line.trim()).length}줄
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            <span className="text-sm">파일 업로드</span>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {bulkText.trim() && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBulkText('');
                setError(null);
                setWarning(null);
                setSuccess(false);
                setResult(null);
              }}
              disabled={isSubmitting}
            >
              초기화
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !bulkText.trim()}>
            {isSubmitting ? '등록 중...' : '일괄 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}





