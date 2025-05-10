import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../../core/services/billing.service';
import { Invoice } from '../../../core/models/invoice.model';
import { FormsModule } from '@angular/forms';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';
import { InvoiceDetailComponent } from '../invoice-detail/invoice-detail.component';


@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
		CommonModule,
		FormsModule,
		CreateInvoiceComponent,
		InvoiceDetailComponent
	],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
	selectedInvoice: Invoice | null = null;
  searchTerm = '';
  statusFilter: 'all' | 'paid' | 'unpaid' | 'overdue' | 'voided' = 'all';

  showCreateModal = false;
	showVoidModal = false;
	invoiceToVoid: Invoice | null = null;

  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

	loadInvoices(): void {
		this.billingService.fetchInvoices().subscribe(data => {
			const today = new Date();
			this.invoices = data.map(inv => {
				if (inv.status === 'unpaid' && new Date(inv.dueDate) < today) {
					return { ...inv, status: 'overdue' };
				}
				return inv;
			});
			this.applyFilters();
		});
	}

	applyFilters(): void {
		this.filteredInvoices = this.invoices.filter(inv => {
			const matchesSearch = inv.childName.toLowerCase().includes(this.searchTerm.toLowerCase());
			const matchesStatus =
				this.statusFilter === 'all'
					? inv.status !== 'voided'
					: inv.status === this.statusFilter;
			return matchesSearch && matchesStatus;
		});
	}

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(status: 'all' | 'paid' | 'unpaid' | 'overdue' | 'voided'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onInvoiceCreated(): void {
    this.closeCreateModal();
    this.loadInvoices();
  }

	viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
  }

	closeInvoiceDetail(): void {
    this.selectedInvoice = null;
  }

	onInvoiceUpdated(updated: Invoice): void {
		this.billingService.updateInvoice(updated).subscribe(() => {
			const index = this.invoices.findIndex(i => i.id === updated.id);
			if (index !== -1) {
				this.invoices[index] = updated;
				this.applyFilters();
			}
			this.selectedInvoice = null;
		});
	}

	openVoidModal(invoice: Invoice): void {
		this.invoiceToVoid = invoice;
		this.showVoidModal = true;
	}

	confirmVoid(): void {
		if (!this.invoiceToVoid) return;

		this.billingService
			.updateInvoice({ ...this.invoiceToVoid, status: 'voided' })
			.subscribe(() => {
				this.showVoidModal = false;
				this.invoiceToVoid = null;
				this.loadInvoices();
			});
	}
}
