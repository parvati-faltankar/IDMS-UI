// ─── Shared KYC configuration types and mock data ────────────────────────────
// Imported by KycSetupPage (admin) and ComplianceDocChecklist (BP form).

export interface KycProofRow {
  id: string;
  country: string;
  proofCategory: string;
  proofType: string;
  documentNumberRequired: boolean;
  tooltip: string;
  placeholderText: string;
  isCharAllowed: boolean;
  isNumberAllowed: boolean;
  isSpecialCharAllowed: boolean;
  allowedSpecialCharacters: string;
  minLength: string;
  maxLength: string;
  mustMatchRegex: boolean;
  regexPattern: string;
  regexErrorMessage: string;
  isAttachmentEnabled: boolean;
  isAttachmentMandatory: boolean;
  allowedFileTypes: string[];
  maxFileSize: string;
  minFileSize: string;
  maximumFileCount: string;
  isMandatory: boolean;
  isActive: boolean;
}

export interface KycFormData {
  name: string;
  displayName: string;
  entity: string;
  entityType: string;
  description: string;
  isActive: boolean;
  proofRows: KycProofRow[];
}

export interface KycConfig extends KycFormData {
  id: string;
  code: string;
  status: 'Draft' | 'Active' | 'Inactive';
}

export const MOCK_CONFIGS: KycConfig[] = [
  // ── Customer KYC ─────────────────────────────────────────────────────────
  {
    id: '1', code: 'KYC-001', name: 'Individual Customer KYC', displayName: 'Individual Customer KYC',
    entity: 'Customer', entityType: 'Individual', description: 'KYC for individual customers',
    isActive: true, status: 'Active',
    proofRows: [
      { id: 'r1', country: 'India', proofCategory: 'Identity Proof', proofType: 'Aadhaar Card', documentNumberRequired: true, tooltip: 'Enter 12-digit Aadhaar number', placeholderText: 'XXXX XXXX XXXX', isCharAllowed: false, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '', minLength: '12', maxLength: '12', mustMatchRegex: true, regexPattern: '^[0-9]{12}$', regexErrorMessage: 'Must be a 12-digit number', isAttachmentEnabled: true, isAttachmentMandatory: true, allowedFileTypes: ['PDF', 'JPG', 'PNG'], maxFileSize: '2048', minFileSize: '10', maximumFileCount: '2', isMandatory: true, isActive: true },
      { id: 'r2', country: 'India', proofCategory: 'Address Proof', proofType: 'Electricity Bill', documentNumberRequired: false, tooltip: '', placeholderText: '', isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '', minLength: '', maxLength: '', mustMatchRegex: false, regexPattern: '', regexErrorMessage: '', isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF', 'JPG'], maxFileSize: '5120', minFileSize: '10', maximumFileCount: '3', isMandatory: false, isActive: true },
    ],
  },

  // ── Supplier KYC (India — Corporate) ─────────────────────────────────────
  {
    id: '2', code: 'KYC-002', name: 'Corporate Supplier KYC — India', displayName: 'Corporate Supplier KYC',
    entity: 'Supplier', entityType: 'Corporate', description: 'KYC for corporate supplier partners registered in India',
    isActive: true, status: 'Active',
    proofRows: [
      // ── Mandatory ─────────────────────────────────────────────────────
      {
        id: 's1', country: 'India', proofCategory: 'Business Proof', proofType: 'GST Certificate',
        documentNumberRequired: true, tooltip: 'Enter 15-character GSTIN (e.g. 27AAPCA1234B1Z5)', placeholderText: '27AAPCA1234B1Z5',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '',
        minLength: '15', maxLength: '15',
        mustMatchRegex: true,
        regexPattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
        regexErrorMessage: 'Must be a valid 15-char GSTIN (e.g. 27AAPCA1234B1Z5)',
        isAttachmentEnabled: true, isAttachmentMandatory: true, allowedFileTypes: ['PDF', 'JPG', 'PNG'],
        maxFileSize: '2048', minFileSize: '10', maximumFileCount: '2',
        isMandatory: true, isActive: true,
      },
      {
        id: 's2', country: 'India', proofCategory: 'Identity Proof', proofType: 'PAN Card',
        documentNumberRequired: true, tooltip: 'Enter 10-character Permanent Account Number', placeholderText: 'AAPCA1234B',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '',
        minLength: '10', maxLength: '10',
        mustMatchRegex: true, regexPattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
        regexErrorMessage: 'Must be a valid 10-char PAN (e.g. AAPCA1234B)',
        isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF', 'JPG', 'PNG'],
        maxFileSize: '1024', minFileSize: '10', maximumFileCount: '1',
        isMandatory: true, isActive: true,
      },

      // ── Optional ──────────────────────────────────────────────────────
      {
        id: 's3', country: 'India', proofCategory: 'Business Proof', proofType: 'MSME Certificate',
        documentNumberRequired: true, tooltip: 'Enter Udyam Registration Number', placeholderText: 'UDYAM-MH-01-0001234',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: true, allowedSpecialCharacters: '-',
        minLength: '19', maxLength: '19',
        mustMatchRegex: true, regexPattern: '^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$',
        regexErrorMessage: 'Format must be UDYAM-XX-00-0000000',
        isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF'],
        maxFileSize: '2048', minFileSize: '10', maximumFileCount: '1',
        isMandatory: false, isActive: true,
      },
      {
        id: 's4', country: 'India', proofCategory: 'Business Proof', proofType: 'Trade License',
        documentNumberRequired: true, tooltip: 'Enter Trade License number issued by municipal authority', placeholderText: 'TL/2024/123456',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: true, allowedSpecialCharacters: '/-',
        minLength: '5', maxLength: '30',
        mustMatchRegex: false, regexPattern: '', regexErrorMessage: '',
        isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF', 'JPG'],
        maxFileSize: '2048', minFileSize: '10', maximumFileCount: '2',
        isMandatory: false, isActive: true,
      },
      {
        id: 's5', country: 'India', proofCategory: 'Financial Proof', proofType: 'Bank Statement',
        documentNumberRequired: false, tooltip: 'Upload last 3 months bank statement (PDF, max 5 MB)', placeholderText: '',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '',
        minLength: '', maxLength: '',
        mustMatchRegex: false, regexPattern: '', regexErrorMessage: '',
        isAttachmentEnabled: true, isAttachmentMandatory: true, allowedFileTypes: ['PDF'],
        maxFileSize: '5120', minFileSize: '10', maximumFileCount: '3',
        isMandatory: false, isActive: true,
      },
      {
        id: 's6', country: 'India', proofCategory: 'Business Proof', proofType: 'Incorporation Certificate',
        documentNumberRequired: true, tooltip: 'Enter Certificate of Incorporation number (CIN)', placeholderText: 'U12345MH2001PTC123456',
        isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '',
        minLength: '21', maxLength: '21',
        mustMatchRegex: true, regexPattern: '^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$',
        regexErrorMessage: 'Must be a valid 21-char CIN (e.g. U12345MH2001PTC123456)',
        isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF'],
        maxFileSize: '2048', minFileSize: '10', maximumFileCount: '1',
        isMandatory: false, isActive: true,
      },
    ],
  },
];
