export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  date: string; // ISO string
  method: 'cash' | 'card' | 'bank' | 'online';
  reference?: string;
	deleted?: boolean; // ✅ Soft delete support
}
