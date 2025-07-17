import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingStatusEnum,
	EntryStatusEnum,
} from '../../../../core/dataservice/booking/booking.interface';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../primeng.modules';
import { PaginatedData } from '../../../../core/utility/pagination.interface';
import { BASEAPI_URL } from '../../../../core/constants/constants';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminBookingsSearchByCustomerComponent } from '../components/admin-bookings-search-by-customer/admin-bookings-search-by-customer.component';

@Component({
	selector: 'app-admin-master-bookings',
	templateUrl: './admin-master-bookings.component.html',
	styleUrls: ['./admin-master-bookings.component.css'],
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService, DialogService],
})
export class AdminMasterBookingsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchDialogRef: DynamicDialogRef | undefined;

	// Tab management
	activeTabIndex = 0; // 0 = Confirmed, 1 = Processing, 2 = Failed

	// Separate arrays for each tab
	confirmedBookings: Booking[] = [];
	processingBookings: Booking[] = [];
	failedBookings: Booking[] = [];

	// Loading states
	loading = false;
	confirmedLoading = false;
	processingLoading = false;
	failedLoading = false;

	// Pagination for confirmed bookings
	confirmedPagination: PaginatedData<Booking> | null = null;
	confirmedPage = 1;
	confirmedPageSize = 10;

	// Pagination for processing bookings
	processingPagination: PaginatedData<Booking> | null = null;
	processingPage = 1;
	processingPageSize = 10;

	// Pagination for failed bookings
	failedPagination: PaginatedData<Booking> | null = null;
	failedPage = 1;
	failedPageSize = 10;

	constructor(
		private bookingDataService: BookingDataService,
		private messageService: MessageService,
		private dialogService: DialogService
	) {}

	ngOnInit() {
		this.loadInitialData();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.searchDialogRef) {
			this.searchDialogRef.close();
		}
	}

	loadInitialData() {
		// Load confirmed bookings by default (first tab)
		this.loadConfirmedBookings();
	}

	onTabChange(event: any) {
		this.activeTabIndex = event.index;

		switch (event.index) {
			case 0: // Confirmed
				this.loadConfirmedBookings();

				break;
			case 1: // Processing
				this.loadProcessingBookings();

				break;
			case 2: // Failed
				this.loadFailedBookings();

				break;
		}
	}

	loadConfirmedBookings(page: number = 1) {
		this.confirmedLoading = true;
		this.confirmedPage = page;

		this.bookingDataService
			.getConfirmedBookingsPaginated(page, this.confirmedPageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.confirmedPagination = result;
					this.confirmedBookings = result.data || [];
					this.confirmedLoading = false;
				},
				error: (error) => {
					console.error('Error loading confirmed bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load confirmed bookings',
					});
					this.confirmedLoading = false;
				},
			});
	}

	loadProcessingBookings(page: number = 1) {
		this.processingLoading = true;
		this.processingPage = page;

		this.bookingDataService
			.getUnderProcessingBookingsPaginated(page, this.processingPageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.processingPagination = result;
					this.processingBookings = result.data || [];
					this.processingLoading = false;
				},
				error: (error) => {
					console.error('Error loading processing bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load processing bookings',
					});
					this.processingLoading = false;
				},
			});
	}

	loadFailedBookings(page: number = 1) {
		this.failedLoading = true;
		this.failedPage = page;

		this.bookingDataService
			.getFailedBookingsPaginated(page, this.failedPageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.failedPagination = result;
					this.failedBookings = result.data || [];
					this.failedLoading = false;
				},
				error: (error) => {
					console.error('Error loading failed bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load failed bookings',
					});
					this.failedLoading = false;
				},
			});
	}

	// Pagination handlers
	onConfirmedPageChange(event: any) {
		const page = event.first ? Math.floor(event.first / event.rows) + 1 : 1;
		this.loadConfirmedBookings(page);
	}

	onProcessingPageChange(event: any) {
		const page = event.first ? Math.floor(event.first / event.rows) + 1 : 1;
		this.loadProcessingBookings(page);
	}

	onFailedPageChange(event: any) {
		const page = event.first ? Math.floor(event.first / event.rows) + 1 : 1;
		this.loadFailedBookings(page);
	}

	getStatusSeverity(status: BookingStatusEnum): string {
		switch (status) {
			case BookingStatusEnum.CONFIRMED:
				return 'success';
			case BookingStatusEnum.PENDING:
			case BookingStatusEnum.PAYMENT_PENDING:
				return 'warning';
			case BookingStatusEnum.FAILED:
			case BookingStatusEnum.CANCELLED:
				return 'danger';
			case BookingStatusEnum.TIMEOUT:
				return 'info';
			default:
				return 'info';
		}
	}

	getEntryStatusSeverity(status: EntryStatusEnum): string {
		switch (status) {
			case EntryStatusEnum.ENTERED:
				return 'success';
			case EntryStatusEnum.VALID:
				return 'info';
			default:
				return 'info';
		}
	}

	formatDate(date: any): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount?.toFixed(2) || '0.00'}`;
	}

	refreshBookings() {
		switch (this.activeTabIndex) {
			case 0:
				this.loadConfirmedBookings(1);
				break;
			case 1:
				this.loadProcessingBookings(1);
				break;
			case 2:
				this.loadFailedBookings(1);
				break;
		}
	}

	// Utility methods for getting current tab data
	getCurrentTabBookings(): Booking[] {
		switch (this.activeTabIndex) {
			case 0:
				return this.confirmedBookings;
			case 1:
				return this.processingBookings;
			case 2:
				return this.failedBookings;
			default:
				return [];
		}
	}

	getCurrentTabPagination(): PaginatedData<Booking> | null {
		switch (this.activeTabIndex) {
			case 0:
				return this.confirmedPagination;
			case 1:
				return this.processingPagination;
			case 2:
				return this.failedPagination;
			default:
				return null;
		}
	}

	getCurrentTabLoading(): boolean {
		switch (this.activeTabIndex) {
			case 0:
				return this.confirmedLoading;
			case 1:
				return this.processingLoading;
			case 2:
				return this.failedLoading;
			default:
				return false;
		}
	}

	getMovieTitle(booking: Booking): string {
		return booking.screening?.movie?.name || 'Unknown Movie';
	}

	getTheatreInfo(booking: Booking): string {
		const theatre = booking.screening?.hall?.theatre?.name;
		const hall = booking.screening?.hall?.name;
		if (theatre && hall) {
			return `${theatre} - ${hall}`;
		}
		return theatre || hall || 'Unknown Theatre';
	}

	getScreeningTime(booking: Booking): string {
		if (!booking.screening) return 'Unknown Time';

		const date = booking.screening.date;
		const startTime = booking.screening.startTime;

		if (date && startTime) {
			const screeningDate = new Date(date);
			return `${screeningDate.toLocaleDateString()} at ${this.formatTime(
				startTime
			)}`;
		}

		return 'Unknown Time';
	}

	formatTime(time: string): string {
		if (!time) return '';

		// Handle HH:MM:SS format
		if (time.includes(':')) {
			const timeParts = time.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = timeParts[1];
				const period = hours >= 12 ? 'PM' : 'AM';
				const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
				return `${displayHours}:${minutes} ${period}`;
			}
		}

		return time;
	}

	getMoviePosterUrl(booking: Booking): string | null {
		const movie = booking.screening?.movie;
		if (!movie?.media || !Array.isArray(movie.media)) {
			return null;
		}

		const posterImage = movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);

		return posterImage ? `${BASEAPI_URL}${posterImage.uri}` : null;
	}

	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	// Statistics methods
	getTotalConfirmedBookings(): number {
		return this.confirmedPagination?.pagination?.totalCount || 0;
	}

	getTotalProcessingBookings(): number {
		return this.processingPagination?.pagination?.totalCount || 0;
	}

	getTotalFailedBookings(): number {
		return this.failedPagination?.pagination?.totalCount || 0;
	}

	/**
	 * Open search by customer dialog
	 */
	openSearchByCustomer(): void {
		this.searchDialogRef = this.dialogService.open(
			AdminBookingsSearchByCustomerComponent,
			{
				header: 'Search Bookings by Customer',

				maximizable: true,
				closable: true,
				dismissableMask: true,
			}
		);

		this.searchDialogRef.onClose.subscribe((result) => {
			// Handle any result from the search dialog if needed
			if (result) {
				console.log('Search dialog closed with result:', result);
			}
		});
	}
}
