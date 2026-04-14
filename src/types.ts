export type UserRole = 'requester' | 'donor' | 'eyewitness';
export type RequestCategory = 'Food' | 'Medical' | 'Emergency' | 'Education';
export type Urgency = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'Pending' | 'Verified' | 'Completed' | 'Flagged';

export interface Review {
  id: string;
  requesterId: string;
  donorId: string;
  donorName: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole | null;
  reputation: number;
  upiId?: string;
  location?: { lat: number; lng: number; address: string };
}

export interface NeededItem {
  name: string;
  total: number;
  fulfilled: number;
}

export interface CharityRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  title: string;
  description: string;
  category: RequestCategory;
  targetAmount: number;
  raisedAmount: number;
  neededItems?: NeededItem[];
  urgency: Urgency;
  status: RequestStatus;
  location: { lat: number; lng: number; address: string };
  proofUrls: string[];
  createdAt: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: RequestCategory;
  rating: number;
  distance: string;
  items: { name: string; price: number }[];
  upiId: string;
}

export interface Donation {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  amount: number;
  transactionId: string;
  timestamp: number;
}

export interface Verification {
  id: string;
  requestId: string;
  verifierId: string;
  verifierName: string;
  photoUrl: string;
  location: { lat: number; lng: number };
  timestamp: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes: string;
}
