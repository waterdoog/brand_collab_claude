export interface EmailCredentials {
  email: string;
  password: string; // 授权码
}

export interface BrandEmail {
  id: string;
  messageId: string;
  from: string;
  brandName: string;
  contactPerson: string;
  subject: string;
  receivedDate: Date;
  collaborationSummary: string;
  requirements: string;
  hasPricing: boolean;
  body: string;
  rawEmail: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'YES' | 'NO';
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailFilter {
  startDate?: Date;
  endDate?: Date;
  brandName?: string;
  hasPricing?: boolean;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  emails?: BrandEmail[];
  error?: string;
}
