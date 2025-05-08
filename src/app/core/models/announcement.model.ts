export interface Announcement {
  id?: number;
  title: string;
  message: string;
  date: string; // ISO string
  type: 'announcement' | 'event';
  imageUrls?: string[];

  // New fields
  createdBy?: string; // user ID or email
  visibility?: 'all' | 'owners' | 'parents';

  likes?: string[]; // list of userIds who liked
  comments?: {
    user: string;
    text: string;
    date: string;
  }[];
}
