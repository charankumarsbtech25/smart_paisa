export interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export type PrivacyRequestType = 'data_export' | 'account_deletion' | 'consent_withdrawal';

export type PrivacyRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface PrivacyRequest {
  id: string;
  user_id: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'essential_cookies' | 'analytics_cookies' | 'marketing_emails' | 'terms_and_privacy';
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}
