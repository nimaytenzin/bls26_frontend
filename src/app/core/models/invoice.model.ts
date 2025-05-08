export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'voided';

export interface Invoice {
  id: number;
  childId: number;
  childName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  date: string; // ISO string
  method: 'cash' | 'card' | 'bank' | 'online';
  reference?: string;
	deleted?: boolean; // ✅ Soft delete support
}

export interface Package {
  id: number;
  name: string;
  description?: string;
  price: number;
  frequency: 'weekly' | 'monthly';
}
