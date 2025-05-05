export interface Observation {
  id?: number;
  childId: number;
  childName?: string;
  outcomes: string[];
  description: string;
  visibility: 'internal' | 'family';
  mediaUrls?: string[];
  createdAt?: string;
}
