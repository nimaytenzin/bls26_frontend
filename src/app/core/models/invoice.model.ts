export interface Invoice {
  id: number;
  childId: number;
  childName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'voided';
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
	isRecurring?: boolean;
  recurrencePattern?: 'weekly' | 'monthly';
  nextDueDate?: string;
}
