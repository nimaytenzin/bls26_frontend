export interface Package {
  id: number;
  name: string;
  amount: number;
  description?: string;
  facilityId: number;
}

export interface BillingRule {
  id: number;
  name: string;
  condition: string;
  value: string;
  facilityId: number;
}

export interface Invoice {
  id: number;
  childName: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  issueDate: string;
  dueDate: string;
  facilityId: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amountPaid: number;
  paymentDate: string;
  method: 'Card' | 'Bank Transfer';
}
