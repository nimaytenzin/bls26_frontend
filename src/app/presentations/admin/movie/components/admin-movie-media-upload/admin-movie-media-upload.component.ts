import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../../core/constants/constants';

@Component({
	selector: 'app-admin-movie-media-upload',
	templateUrl: './admin-movie-media-upload.component.html',
	styleUrls: ['./admin-movie-media-upload.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
})
export class AdminMovieMediaUploadComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data properties
	movie: Movie | null = null;
	uploadingMedia = false;
	mediaUploadError: string | null = null;
	selectedFile: File | null = null;

	// User selection properties
	selectedType: 'IMAGE' | 'VIDEO' = 'IMAGE';
	selectedOrientation: 'LANDSCAPE' | 'PORTRAIT' = 'LANDSCAPE';
	mediaName: string = '';
	filePreviewUrl: string | null = null;

	// Options for dropdowns
	typeOptions = [
		{ label: 'Image', value: 'IMAGE', icon: 'pi pi-image' },
		{ label: 'Video', value: 'VIDEO', icon: 'pi pi-video' },
	];

	orientationOptions = [
		{ label: 'Landscape', value: 'LANDSCAPE', icon: 'pi pi-arrow-right' },
		{ label: 'Portrait', value: 'PORTRAIT', icon: 'pi pi-arrow-down' },
	];

	constructor(
		private movieApiService: MovieApiDataService,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig
	) {}

	ngOnInit() {
		// Get movie data from dialog config
		if (this.config.data && this.config.data.movie) {
			this.movie = this.config.data.movie;
			// Set default media name
			if (this.movie) {
				this.mediaName = `${this.movie.name} - Poster`;
			}
		}
	}

	ngOnDestroy() {
		// Clean up object URL to prevent memory leaks
		if (this.filePreviewUrl && this.selectedFile?.type.startsWith('video/')) {
			URL.revokeObjectURL(this.filePreviewUrl);
		}

		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Get media URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Handle type selection change
	 */
	onTypeChange() {
		if (this.movie) {
			const suffix = this.selectedType === 'IMAGE' ? 'Poster' : 'Video';
			this.mediaName = `${this.movie.name} - ${suffix}`;
		}
	}

	/**
	 * Handle file selection (not upload yet)
	 */
	onFileSelect(event: any) {
		const file = event.files[0];
		if (!file) {
			return;
		}

		this.selectedFile = file;
		this.mediaUploadError = null;

		// Auto-detect type based on file
		const detectedType: 'IMAGE' | 'VIDEO' = file.type.startsWith('image/')
			? 'IMAGE'
			: 'VIDEO';

		// Update selection if it differs from detected type
		if (this.selectedType !== detectedType) {
			this.selectedType = detectedType;
			this.onTypeChange();
		}

		// Create preview URL for images and videos
		if (detectedType === 'IMAGE') {
			const reader = new FileReader();
			reader.onload = (e) => {
				this.filePreviewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		} else if (detectedType === 'VIDEO') {
			// Create object URL for video preview
			this.filePreviewUrl = URL.createObjectURL(file);
		} else {
			this.filePreviewUrl = null;
		}
	}

	/**
	 * Upload the selected file with user choices
	 */
	uploadFile() {
		if (!this.selectedFile || !this.movie || !this.mediaName.trim()) {
			this.mediaUploadError = 'Please select a file and provide a name.';
			return;
		}

		this.uploadingMedia = true;
		this.mediaUploadError = null;

		this.movieApiService
			.uploadMovieMedia(
				this.selectedFile,
				this.movie.id,
				this.mediaName.trim(),
				this.selectedOrientation,
				this.selectedType
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Media uploaded successfully:', response);
					this.uploadingMedia = false;
					this.resetForm();
					// Close dialog and return success
					this.ref.close({ success: true, refresh: true });
				},
				error: (error) => {
					console.error('Error uploading media:', error);
					this.mediaUploadError = 'Failed to upload media. Please try again.';
					this.uploadingMedia = false;
				},
			});
	}

	/**
	 * Reset the form
	 */
	resetForm() {
		// Clean up object URL to prevent memory leaks
		if (this.filePreviewUrl && this.selectedFile?.type.startsWith('video/')) {
			URL.revokeObjectURL(this.filePreviewUrl);
		}

		this.selectedFile = null;
		this.selectedType = 'IMAGE';
		this.selectedOrientation = 'LANDSCAPE';
		this.mediaUploadError = null;
		this.filePreviewUrl = null;
		if (this.movie) {
			this.mediaName = `${this.movie.name} - Poster`;
		}
	}

	/**
	 * Handle file upload (legacy method - keeping for compatibility)
	 */
	onFileUpload(event: any) {
		// For now, redirect to the new flow
		this.onFileSelect(event);
	}

	/**
	 * Delete movie media
	 */
	deleteMovieMedia(mediaId: number, movieName: string) {
		if (
			confirm(`Are you sure you want to delete this media from "${movieName}"?`)
		) {
			this.movieApiService
				.deleteMovieMedia(mediaId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						console.log('Media deleted successfully:', response);
						// Refresh the movie data by closing and signaling refresh
						this.ref.close({ success: true, refresh: true });
					},
					error: (error) => {
						console.error('Error deleting media:', error);
						alert('Failed to delete media. Please try again.');
					},
				});
		}
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
			// Hide the video and show a fallback message
			videoElement.style.display = 'none';

			// Create a fallback element
			const fallback = document.createElement('div');
			fallback.className =
				'w-full h-48 bg-gray-200 flex items-center justify-center';
			fallback.innerHTML =
				'<i class="pi pi-video text-2xl text-gray-500"></i><span class="ml-2 text-gray-500">Video unavailable</span>';

			// Replace the video with the fallback
			if (videoElement.parentNode) {
				videoElement.parentNode.insertBefore(fallback, videoElement);
			}
		}
	}

	/**
	 * Close dialog
	 */
	close() {
		this.ref.close();
	}

	/**
	 * Format file size to human readable format
	 */
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Check if file is large (over 100MB)
	 */
	isLargeFile(): boolean {
		if (!this.selectedFile) return false;
		return this.selectedFile.size > 100 * 1024 * 1024; // 100MB
	}

	/**
	 * Get file size warning message
	 */
	getFileSizeWarning(): string {
		if (!this.selectedFile) return '';

		const sizeInMB = this.selectedFile.size / (1024 * 1024);

		if (sizeInMB > 500) {
			return 'Very large file detected. Upload may take several minutes.';
		} else if (sizeInMB > 100) {
			return 'Large file detected. Upload may take some time.';
		}
		return '';
	}
}
