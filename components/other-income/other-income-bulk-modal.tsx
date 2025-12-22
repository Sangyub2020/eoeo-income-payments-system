'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload as UploadIcon, Edit2, Save, XCircle, Check } from 'lucide-react';
import { OtherIncome } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CATEGORIES } from '@/lib/constants';

interface OtherIncomeBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OtherIncomeBulkModal({ isOpen, onClose, onSuccess }: OtherIncomeBulkModalProps) {
  const [csvText, setCsvText] = useState('');
  const [records, setRecords] = useState<Partial<OtherIncome>[]>([]);
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
      console.error('Í±∞ÎûòÏ≤?Ï°∞Ìöå ?§Î•ò:', err);
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
      console.error('?ÑÎ°ú?ùÌä∏ Ï°∞Ìöå ?§Î•ò:', err);
    }
  };

  const parseCsvText = (text: string): Partial<OtherIncome>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsedRecords: Partial<OtherIncome>[] = [];

    if (lines.length === 0) return parsedRecords;

    // ?àÏö©??Íµ¨Î∂Ñ Í∞?Î™©Î°ù
    const validCategories = [
      'ONE-TIME',
      '?åÌä∏?àÏã≠/ÎßàÏ??ÖÏ??êÎπÑ',
      'Í∏∞Ïû¨Í≥†ÏÇ¨??,
      '?ïÎ?ÏßÄ?êÏÇ¨??,
      'other',
      'B2B',
      'Î∞∞ÏÜ°Îπ?,
      'Í∏∞Ïû¨Í≥†ÌåêÎß?,
    ];

    // Íµ¨Î∂Ñ???ïÏù∏ (Ï≤?Î≤àÏß∏ ÎπÑÏñ¥?àÏ? ?äÏ? ??Í∏∞Ï?)
    const firstDataLine = lines.find(line => line.trim());
    if (!firstDataLine) return parsedRecords;
    
    const delimiter = firstDataLine.includes('\t') ? '\t' : ',';
    const expectedColumnCount = 33; // ?®Îùº?∏Ïª§Î®∏Ïä§?Ä?Ä oneTimeExpenseAmountÍ∞Ä ?ÜÏñ¥??33Í∞?
    for (const line of lines) {
      // ??úºÎ°?split?òÎ©¥ Îπ?Ïπ∏ÎèÑ Îπ?Î¨∏Ïûê?¥Î°ú Î∞∞Ïó¥???¨Ìï®??      let parts = line.split(delimiter);
      
      // Î∂ÄÏ°±Ìïú Ïª¨Îüº?Ä Îπ?Î¨∏Ïûê?¥Î°ú Ï±ÑÏ? (Îπ?Ïπ∏ÎèÑ ?¨Î∞îÎ•??∏Îç±?§Ïóê Îß§Ìïë?òÎèÑÎ°?
      while (parts.length < expectedColumnCount) {
        parts.push('');
      }
      
      // Í∞??Ä???ûÎí§ Í≥µÎ∞±Îß??úÍ±∞ (Îπ?Î¨∏Ïûê?¥Ï? ?†Ï?)
      parts = parts.map(p => p.trim());
      
      // 'Íµ¨Î∂Ñ' ??Ï≤?Î≤àÏß∏ Ïª¨Îüº)???àÏö©??Í∞?Ï§??òÎÇò??Í≤ΩÏö∞Îß????àÏΩî?úÎ°ú ?∏Ïãù
      const category = parts[0] || '';
      const categoryUpper = category.toUpperCase();
      const isValidCategory = validCategories.some(valid => 
        categoryUpper === valid.toUpperCase() || categoryUpper.includes(valid.toUpperCase())
      );
      
      if (!isValidCategory) {
        continue; // ?àÏö©??Íµ¨Î∂Ñ???ÜÏúºÎ©????âÏ? Í±¥ÎÑà?Ä
      }
      
      // ÏµúÏÜå 2Í∞?Ïª¨Îüº?Ä ?àÏñ¥???∞Ïù¥?∞Î°ú ?∏Ïãù (Íµ¨Î∂Ñ, Í±∞ÎûòÏ≤òÏΩî??
      if (parts.length >= 2) {
        const parseNumber = (val: string) => {
          if (!val || val === '') return undefined;
          const numStr = val.replace(/[??\s]/g, '');
          return numStr ? Number(numStr) : undefined;
        };

        // ?àÏ†Ñ?òÍ≤å ?∏Îç±???ëÍ∑º
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
          // ?®Îùº??Ïª§Î®∏?§Ì??Ä oneTimeExpenseAmountÍ∞Ä ?ÜÏ?Îß? CSV ?∞Ïù¥?∞Ïóê???¨Ìï®?òÏñ¥ ?àÏùÑ ???àÏùå
          // ?∏Îç±??18: oneTimeExpenseAmount (?®Îùº??Ïª§Î®∏?§Ì??êÎäî ?ÜÏ?Îß?CSV???àÏùÑ ???àÏùå - ÎπàÏπ∏)
          // ?∏Îç±??19: expectedDepositAmount (??,300,000 ?ïÏãù)
          expectedDepositAmount: parseNumber(get(19) || ''),
          // ?∏Îç±??20: description (?ÅÏöî) - "?ÑÎßàÏ°?ÎßàÏ????úÎπÑ??
          description: get(20),
          // ?∏Îç±??21: depositDate (?ÖÍ∏à?? - ÎπàÏπ∏
          depositDate: get(21),
          // ?∏Îç±??22: depositAmount (?ÖÍ∏à?? - "3,300,000"
          depositAmount: parseNumber(get(22) || ''),
          // ?∏Îç±??23: exchangeGainLoss (?òÏ∞®?êÏùµ) - "?ïÏù∏Ï§?
          exchangeGainLoss: get(23) ? (get(23).toLowerCase() === '?ïÏù∏Ï§? || get(23).toLowerCase() === 'x' ? undefined : parseNumber(get(23) || '')) : undefined,
          // ?∏Îç±??24: difference (Ï∞®Ïï°) - "X"
          difference: get(24) ? (get(24).toLowerCase() === 'x' ? undefined : parseNumber(get(24) || '')) : undefined,
          // ?∏Îç±??25: createdDate (?ëÏÑ±?ºÏûê) - ÎπàÏπ∏
          createdDate: get(25),
          // ?∏Îç±??26: invoiceIssued (?∏Í∏àÍ≥ÑÏÇ∞??Î∞úÌñâ ?¨Î?) - ÎπàÏπ∏
          invoiceIssued: get(26),
          // ?∏Îç±??27: invoiceCopy (?∏Í∏àÍ≥ÑÏÇ∞???¨Î≥∏) - ÎπàÏπ∏
          invoiceCopy: get(27),
          // ?∏Îç±??28: issueNotes (ISSUE?¨Ìï≠) - ÎπàÏπ∏
          issueNotes: get(28),
          // ?∏Îç±??29: year (?? - "2024"
          year: get(29) ? Number(get(29)) : undefined,
          // ?∏Îç±??30: expectedDepositMonth (?ÖÍ∏à ?àÏ†ï?? - "9"
          expectedDepositMonth: get(30) ? Number(get(30)) : undefined,
          // ?∏Îç±??31: depositMonth (?ÖÍ∏à ?? - "NA"
          depositMonth: get(31) && get(31).toUpperCase() !== 'NA' ? Number(get(31)) : undefined,
          // ?∏Îç±??32: taxStatus (Í≥?Î©¥ÏÑ∏/?ÅÏÑ∏) - ÎπàÏπ∏
          taxStatus: get(32),
          // ?∏Îç±??33: invoiceSupplyPrice (?∏Í∏àÍ≥ÑÏÇ∞?úÎ∞ú?âÍ≥µÍ∏âÍ?) - "??,000,000"
          invoiceSupplyPrice: parseNumber(get(33) || ''),
        });
      }
    }

    return parsedRecords;
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) {
      setError('CSV ?∞Ïù¥?∞Î? ?ÖÎ†•?¥Ï£º?∏Ïöî.');
      return;
    }

    try {
      const parsed = parseCsvText(csvText);
      if (parsed.length === 0) {
        setError('?åÏã±???∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§.');
        return;
      }

      // Í±∞ÎûòÏ≤?ÏΩîÎìú?Ä ?ÑÎ°ú?ùÌä∏ ÏΩîÎìúÎ°??êÎèô ?∞Îèô
      const enrichedRecords = parsed.map(record => {
        let enriched = { ...record };

        // Í±∞ÎûòÏ≤?ÏΩîÎìúÎ°??∞Îèô
        if (record.vendorCode) {
          const vendor = vendors.find(v => v.code === record.vendorCode);
          if (vendor) {
            enriched.companyName = vendor.name;
            enriched.businessRegistrationNumber = vendor.business_number || '';
            enriched.invoiceEmail = vendor.invoice_email || '';
          }
        }

        // ?ÑÎ°ú?ùÌä∏ ÏΩîÎìúÎ°??∞Îèô
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
      setError('CSV ?åÏã± Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.');
    }
  };

  const updateRecord = (index: number, updates: Partial<OtherIncome>) => {
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
      // ?åÏùº ?ÖÎ°ú??Ï≤òÎ¶¨
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
              const errorMsg = uploadData.error || uploadData.details?.message || `?åÏùº ?ÖÎ°ú?úÏóê ?§Ìå®?àÏäµ?àÎã§. (??™© ${index + 1})`;
              console.error(`?åÏùº ?ÖÎ°ú???§Ìå® (??™© ${index + 1}):`, uploadData);
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

      console.log('?ºÍ¥Ñ ?±Î°ù ?îÏ≤≠ ?∞Ïù¥??', { recordsCount: recordsToSubmit.length, firstRecord: recordsToSubmit[0] });

      const response = await fetch('/api/other-income-team/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recordsToSubmit }),
      });

      const data = await response.json();
      console.log('?ºÍ¥Ñ ?±Î°ù API ?ëÎãµ:', data);

      if (!response.ok) {
        const errorMsg = data.error || data.message || '?ºÍ¥Ñ ?±Î°ù???§Ìå®?àÏäµ?àÎã§.';
        console.error('?ºÍ¥Ñ ?±Î°ù API ?§Î•ò:', { status: response.status, data });
        throw new Error(`?ºÍ¥Ñ ?±Î°ù ?§Ìå® (HTTP ${response.status}): ${errorMsg}`);
      }

      // APIÍ∞Ä ?±Í≥µ?àÎçî?ºÎèÑ ?ºÎ? ??™©???§Ìå®?àÏùÑ ???àÏùå
      if (data.result && data.result.failed > 0) {
        const errorDetails = data.result.errors && data.result.errors.length > 0
          ? data.result.errors.join('\n')
          : `${data.result.failed}Í∞úÏùò ??™©???±Î°ù???§Ìå®?àÏäµ?àÎã§.`;
        console.error('?ºÎ? ??™© ?±Î°ù ?§Ìå®:', data.result);
        throw new Error(`?ºÎ? ??™© ?±Î°ù ?§Ìå® (?±Í≥µ: ${data.result.success}Í∞? ?§Ìå®: ${data.result.failed}Í∞?:\n${errorDetails}`);
      }

      // Î™®Îì† ??™©???±Í≥µ??Í≤ΩÏö∞
      if (data.result) {
        console.log(`?ºÍ¥Ñ ?±Î°ù ?ÑÎ£å: ?±Í≥µ ${data.result.success}Í∞? ?§Ìå® ${data.result.failed || 0}Í∞?);
        if (data.result.success === 0 && recordsToSubmit.length > 0) {
          throw new Error('Î™®Îì† ??™©???±Î°ù???§Ìå®?àÏäµ?àÎã§. ?êÎü¨ Î©îÏãúÏßÄÎ•??ïÏù∏?¥Ï£º?∏Ïöî.');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('?ºÍ¥Ñ ?±Î°ù ?§Î•ò:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : (typeof err === 'string' ? err : '?????ÜÎäî ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.');
      setError(errorMessage);
      // ?êÎü¨Í∞Ä Î∞úÏÉù?¥ÎèÑ Î™®Îã¨???´Ï? ?äÏùå (?¨Ïö©?êÍ? ?êÎü¨Î•??ïÏù∏?òÍ≥† ?òÏ†ï?????àÎèÑÎ°?
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">?ºÍ¥Ñ Ï∂îÍ?</h2>
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
                  CSV ?∞Ïù¥??Î∂ôÏó¨?£Í∏∞ (??úºÎ°?Íµ¨Î∂Ñ)
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="CSV ?åÏùº?êÏÑú Î≥µÏÇ¨?òÏó¨ Î∂ôÏó¨?£Í∏∞ ?òÏÑ∏??
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-wrap">
                  <div className="font-semibold mb-1">?§Î•ò Î∞úÏÉù:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Ï∑®ÏÜå
                </Button>
                <Button type="button" onClick={handleParseCsv}>
                  ?åÏã± Î∞??ïÏù∏
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-wrap">
                  <div className="font-semibold mb-1">?§Î•ò Î∞úÏÉù:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">?åÏã±???∞Ïù¥??({records.length}Í∞?</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCsvInput(true)}>
                  CSV ?§Ïãú ?ÖÎ†•
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
                              Í±∞ÎûòÏ≤òÏΩî??<span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                              value={record.vendorCode || ''}
                              onChange={(value) => handleVendorCodeChange(index, value)}
                              options={vendors.map(v => ({ value: v.code, label: `${v.code} - ${v.name}` }))}
                              placeholder="?†ÌÉù?òÏÑ∏??
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Íµ¨Î∂Ñ <span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                              value={record.category || ''}
                              onChange={(value) => updateRecord(index, { category: value })}
                              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                              placeholder="?†ÌÉù?òÏÑ∏??
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
                              placeholder="?†ÌÉù?òÏÑ∏??
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
                              ?ÖÍ∏à ?àÏ†ïÍ∏àÏï°
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
                              ?ÖÍ∏à??                            </label>
                            <input
                              type="number"
                              value={record.depositAmount || ''}
                              onChange={(e) => updateRecord(index, { depositAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ?∏Í∏àÍ≥ÑÏÇ∞??Î∞úÌñâ ?¨Î?
                            </label>
                            <SearchableSelect
                              value={record.invoiceIssued || ''}
                              onChange={(value) => updateRecord(index, { invoiceIssued: value })}
                              options={[
                                { value: 'O', label: 'O (Î∞úÌñâ)' },
                                { value: 'X', label: 'X (ÎØ∏Î∞ú??' },
                              ]}
                              placeholder="?†ÌÉù?òÏÑ∏??
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ?∏Í∏àÍ≥ÑÏÇ∞???¨Î≥∏ (?§ÌÅ¨Î¶∞ÏÉ∑)
                            </label>
                            <div className="flex items-center gap-4">
                              {invoiceFiles.has(index) ? (
                                <div className="flex items-center gap-2">
                                  <img src={invoiceFiles.get(index)!.url} alt="?∏Í∏àÍ≥ÑÏÇ∞?? className="max-w-xs max-h-32 border rounded" />
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
                                  <span className="text-sm">?åÏùº ?†ÌÉù</span>
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
                            Ï∑®ÏÜå
                          </Button>
                          <Button type="button" onClick={() => handleSaveEdit(index)}>
                            <Save className="h-4 w-4 mr-1" />
                            ?Ä??                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Í±∞ÎûòÏ≤òÏΩî??</span>
                            <span className="ml-2 font-medium">{record.vendorCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Íµ¨Î∂Ñ:</span>
                            <span className="ml-2 font-medium">{record.category || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Project code:</span>
                            <span className="ml-2 font-medium">{record.projectCode || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">?ÖÍ∏à??</span>
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
                          ?òÏ†ï
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
              Ï∑®ÏÜå
            </Button>
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '?±Î°ù Ï§?..' : `?ºÍ¥Ñ ?±Î°ù (${records.length}Í∞?`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
