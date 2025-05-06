export interface Announcement {
    id?: number; // Optional for creation, required for update
    title: string;
    message: string;
    date: string; // ISO format string (e.g., "2025-05-06")
    type: 'announcement' | 'event';
    imageUrl?: string; // Optional media
  }
  