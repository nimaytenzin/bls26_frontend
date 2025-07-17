import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PrimeNgModules } from '../../../../../primeng.modules';
import {
	Movie,
	MovieMedia,
} from '../../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../../core/constants/constants';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminMovieMediaUploadComponent } from '../admin-movie-media-upload/admin-movie-media-upload.component';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { ConfirmationService, MessageService } from 'primeng/api';

export type MediaTypeFilter = 'ALL' | 'IMAGE' | 'VIDEO';

interface FilterOption {
	label: string;
	value: MediaTypeFilter;
	icon: string;
}

@Component({
	selector: 'app-admin-movie-details-media-tab',
	templateUrl: './admin-movie-details-media-tab.component.html',
	styleUrls: ['./admin-movie-details-media-tab.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [DialogService, ConfirmationService, MessageService],
})
export class AdminMovieDetailsMediaTabComponent implements OnDestroy, OnInit {
	@Input() movieId!: number;
	loading = false;

	movie: Movie | null = null;

	ref: DynamicDialogRef | null = null;

	// Internal component state
	selectedMedia: any = null;
	mediaTypeFilter: MediaTypeFilter = 'ALL';

	// Modal state
	showMediaModal = false;
	modalMedia: any = null;

	// Delete confirmation state
	mediaToDelete: any = null;

	// Static current date to prevent change detection issues
	currentDate: Date = new Date();
	private dateUpdateInterval: any;

	constructor(
		private dialogService: DialogService,
		private movieService: MovieApiDataService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService
	) {}
	ngOnInit(): void {
		this.loadMovieDetails();
	}

	// Filter options with proper typing
	filterOptions: FilterOption[] = [
		{ label: 'All', value: 'ALL', icon: 'pi-th-large' },
		{ label: 'Photos', value: 'IMAGE', icon: 'pi-image' },
		{ label: 'Videos', value: 'VIDEO', icon: 'pi-video' },
	];

	/**
	 * Component cleanup
	 */
	ngOnDestroy() {
		// Clean up interval
		if (this.dateUpdateInterval) {
			clearInterval(this.dateUpdateInterval);
		}
	}

	loadMovieDetails() {
		this.movieService.findMovieById(this.movieId).subscribe({
			next: (movie) => {
				this.movie = movie;
			},
			error: (error) => {
				console.error('Error loading movie details:', error);
			},
		});
	}

	/**
	 * Get media URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Get filtered media based on current filters
	 */
	getFilteredMedia(): any[] {
		if (!this.movie?.media) return [];

		return this.movie.media.filter((media: any) => {
			// Type filter
			if (
				this.mediaTypeFilter !== 'ALL' &&
				media.type !== this.mediaTypeFilter
			) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Open media in modal viewer
	 */
	openMediaModal(media: any, event?: Event) {
		if (event) {
			event.stopPropagation();
		}
		this.modalMedia = media;
		this.showMediaModal = true;
	}

	/**
	 * Close media modal
	 */
	closeMediaModal() {
		this.showMediaModal = false;
		this.modalMedia = null;
		// Remove any event listeners that might be causing issues
	}

	/**
	 * Show delete confirmation dialog
	 */
	confirmDeleteMedia(media: MovieMedia, event?: Event) {
		this.confirmationService.confirm({
			target: event && event.target ? (event.target as EventTarget) : undefined,
			message: 'Are you sure that you want to delete?',
			header: 'Confirmation',
			closable: true,
			closeOnEscape: true,
			icon: 'pi pi-exclamation-triangle',
			rejectButtonProps: {
				label: 'Cancel',
				severity: 'secondary',
				outlined: true,
			},
			acceptButtonProps: {
				label: 'Save',
			},
			accept: () => {
				this.movieService.deleteMovieMedia(media.id).subscribe({
					next: (res) => {
						if (res) {
							this.messageService.add({
								severity: 'info',
								summary: 'Confirmed',
								detail: 'Media delted',
							});
						}
					},
					error: (err) => {
						this.messageService.add({
							severity: 'error	',
							summary: 'Confirmed',
							detail: 'Failed to delete Media',
						});
					},
				});
			},
		});
	}

	/**
	 * Navigate to previous media in modal
	 */
	previousMedia() {
		if (!this.modalMedia || !this.movie?.media) return;

		const filteredMedia = this.getFilteredMedia();
		const currentIndex = filteredMedia.findIndex(
			(m) => m.id === this.modalMedia.id
		);

		if (currentIndex > 0) {
			this.modalMedia = filteredMedia[currentIndex - 1];
		} else {
			// Loop to last media
			this.modalMedia = filteredMedia[filteredMedia.length - 1];
		}
	}

	/**
	 * Navigate to next media in modal
	 */
	nextMedia() {
		if (!this.modalMedia || !this.movie?.media) return;

		const filteredMedia = this.getFilteredMedia();
		const currentIndex = filteredMedia.findIndex(
			(m) => m.id === this.modalMedia.id
		);

		if (currentIndex < filteredMedia.length - 1) {
			this.modalMedia = filteredMedia[currentIndex + 1];
		} else {
			// Loop to first media
			this.modalMedia = filteredMedia[0];
		}
	}

	/**
	 * Set media type filter
	 */
	setMediaTypeFilter(filter: MediaTypeFilter) {
		this.mediaTypeFilter = filter;
	}

	/**
	 * Clear all filters
	 */
	clearFilters() {
		this.mediaTypeFilter = 'ALL';
		this.selectedMedia = null;
	}

	/**
	 * Open upload modal
	 */
	openUploadModal() {
		this.ref = this.dialogService.open(AdminMovieMediaUploadComponent, {
			header: `Upload Media - ${this.movie?.name}`,
			data: { movie: this.movie },
			dismissableMask: true,
			closable: true,
			width: '500px',
		});
	}

	/**
	 * Download media file
	 */
	downloadMedia(media: any) {
		// Implementation for downloading media
		console.log('Download media:', media);
		const url = this.getMediaUrl(media.uri);
		const link = document.createElement('a');
		link.href = url;
		link.download = media.name || `media-${Date.now()}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	/**
	 * Get media type icon
	 */
	getMediaTypeIcon(type: string): string {
		switch (type) {
			case 'IMAGE':
				return 'pi pi-image';
			case 'VIDEO':
				return 'pi pi-video';
			default:
				return 'pi pi-file';
		}
	}

	/**
	 * Format date for media posts (Instagram-style)
	 */
	formatMediaDate(date: Date | string | null | undefined): string {
		if (!date) return 'Recently';

		const now = this.currentDate;
		const mediaDate = new Date(date);

		// Check if the date is valid
		if (isNaN(mediaDate.getTime())) return 'Recently';

		const diffTime = Math.abs(now.getTime() - mediaDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return '1 day ago';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;

		return `${Math.ceil(diffDays / 365)} years ago`;
	}

	/**
	 * Get current date - returns the static date to prevent change detection issues
	 */
	getCurrentDate(): Date {
		return this.currentDate;
	}

	/**
	 * Handle image load error
	 */
	onImageError(event: any) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Handle video load error
	 */
	onVideoError(event: any) {
		const videoElement = event.target as HTMLVideoElement;
		if (videoElement) {
			videoElement.style.display = 'none';

			// Create a fallback element
			const fallback = document.createElement('div');
			fallback.className =
				'w-full h-full bg-gray-200 flex items-center justify-center';
			fallback.innerHTML =
				'<i class="pi pi-video text-2xl text-gray-500"></i><span class="ml-2 text-gray-500">Video unavailable</span>';

			// Replace the video with the fallback
			if (videoElement.parentNode) {
				videoElement.parentNode.insertBefore(fallback, videoElement);
			}
		}
	}

	/**
	 * Handle video focus events to prevent modal control interference
	 */
	onVideoFocus(event: any) {
		// Prevent video from taking full focus and blocking modal controls
		const videoElement = event.target as HTMLVideoElement;
		if (videoElement) {
			// Remove tabindex to prevent keyboard navigation conflicts
			videoElement.setAttribute('tabindex', '-1');
		}
	}

	/**
	 * Handle video click to ensure it doesn't interfere with modal
	 */
	onVideoClick(event: any) {
		event.stopPropagation();
		// Keep the video controls functional but prevent event bubbling
	}
}
