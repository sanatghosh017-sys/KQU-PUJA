export type Language = 'bn' | 'en' | 'hi';

export interface StaffMember {
  slNo: number;
  name: string;
  mobileNo: string;
  amount: number;
  unit: string;
  index: number;
}

export interface Member {
  id: string;
  name: string;
  amount: number;
  unit: string;
  index: number;
  mobileNo?: string;
}

export interface PaymentState {
  [key: string]: {
    paid: boolean;
    paidAt?: string;
    method?: 'Cash' | 'UPI' | 'Bank' | 'Online' | 'Other';
    notes?: string;
    receivedBy?: string;
  };
}

export type UnitKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | 'MISC' | 'CONTACT';

export type AppTab = 
  | 'website' 
  | 'tracker' 
  | 'summary' 
  | 'sse-je-clerk'
  | 'contact' 
  | 'nirghonto' 
  | 'pandals' 
  | 'ai-studio' 
  | 'ai-voice' 
  | 'receipts' 
  | 'html-version' 
  | 'admin-portal';

export interface SseJeClerkEntry {
  id: string;
  name: string;
  designationCategory: 'SSE' | 'JE' | 'Clerk' | 'Supervisor' | 'Office';
  designationTitle: string;
  mobileNo: string;
  department: string;
  officeLocation: string;
  notes?: string;
}

export interface UnitStats {
  total: number;
  collected: number;
  pending: number;
  totalMembers: number;
  paidMembers: number;
  percentage: number;
}

export interface AuthSession {
  role: 'admin' | 'unit';
  userId: string;
  unit?: string | null;
  name: string;
  canChangeData: boolean;
  email?: string;
  photoURL?: string;
}

export interface AIImageItem {
  id: string;
  url: string;
  prompt: string;
  type: 'generated' | 'edited';
  timestamp: string;
  aspectRatio: string;
}

export interface DonationRecord {
  id?: string;
  donorName: string;
  amount: number;
  unit: string;
  phone?: string;
  email?: string;
  userId?: string;
  receiptNo: string;
  status: 'verified' | 'pending';
  createdAt: string;
}

export interface DevoteeWish {
  id?: string;
  name: string;
  location: string;
  message: string;
  date?: string;
  createdAt?: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  category: 'mahalaya' | 'stotra' | 'dhak' | 'custom';
  url?: string;
  isCustom?: boolean;
  addedAt?: string;
}

export interface PujaScheduleItem {
  dayName: string;
  dateBengali: string;
  dateEnglish: string;
  tag: string;
  rituals: { time: string; event: string }[];
  description: string;
}
