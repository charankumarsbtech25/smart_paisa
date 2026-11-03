export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  age_verified: boolean;
  marketing_consent: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      age_verified?: boolean;
      marketing_consent?: boolean;
    };
  } | null;
  profile: UserProfile | null;
  loading: boolean;
}
