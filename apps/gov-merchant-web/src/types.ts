export type ApplicationStatus =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Application {
  id: string;          // short display ID (first 8 chars)
  requestId: string;   // full backend id
  applicant: string;
  type: string;
  status: ApplicationStatus;
  date: string;
  priority: 'NORMAL' | 'URGENT';
  // Extra metadata for richer details view
  rawItems?: string[];
  isGov?: boolean;
}

