import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import { SurveyEnumeratorDataService } from '../../../../../core/dataservice/survey-enumerator/survey-enumerator.dataservice';
import { EnumeratorDataService } from '../../../../../core/dataservice/enumerator-service/enumerator.dataservice';
import {
	User,
	UserRole,
	UserProfile,
	SupervisorProfile,
	EnumeratorProfile,
} from '../../../../../core/dataservice/auth/auth.interface';
import { SurveyEnumerator } from '../../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';

@Component({
	selector: 'app-admin-user-profile-view',
	templateUrl: './admin-user-profile-view.component.html',
	styleUrls: ['./admin-user-profile-view.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class AdminUserProfileViewComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	user: User | null = null;
	profileData: any = null;
	loading = false;
	error: string | null = null;

	// Expose enum to template
	UserRole = UserRole;

	constructor(
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private authService: AuthService,
		private surveyEnumeratorService: SurveyEnumeratorDataService,
		private enumeratorService: EnumeratorDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		const user = this.config.data?.user as User;
		if (user) {
			this.user = user;
			this.loadUserProfile(user.id);
		} else {
			this.error = 'User data not provided';
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load complete user profile with all assignments
	 */
	loadUserProfile(userId: number): void {
		this.loading = true;
		this.error = null;

		this.authService
			.getUserProfile(userId)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (profile) => {
					this.profileData = profile;
					console.log('Loaded profile:', profile);
				},
				error: (error) => {
					console.error('Error loading user profile:', error);
					this.error = error.error?.message || 'Failed to load user profile';
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: this.error || undefined,
						life: 3000,
					});
				},
			});
	}

	/**
	 * Check if user is supervisor
	 */
	isSupervisor(): boolean {
		return this.user?.role === UserRole.SUPERVISOR;
	}

	/**
	 * Check if user is enumerator
	 */
	isEnumerator(): boolean {
		return this.user?.role === UserRole.ENUMERATOR;
	}

	/**
	 * Check if user is admin
	 */
	isAdmin(): boolean {
		return this.user?.role === UserRole.ADMIN;
	}

	/**
	 * Get supervisor profile data
	 */
	getSupervisorProfile(): SupervisorProfile | null {
		if (this.isSupervisor() && this.profileData) {
			return this.profileData as SupervisorProfile;
		}
		return null;
	}

	/**
	 * Get enumerator profile data
	 */
	getEnumeratorProfile(): EnumeratorProfile | null {
		if (this.isEnumerator() && this.profileData) {
			return this.profileData as EnumeratorProfile;
		}
		return null;
	}

	/**
	 * Format date for display
	 */
	formatDate(date: Date | string | undefined): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get survey status badge severity
	 */
	getSurveyStatusSeverity(status: string): string {
		switch (status?.toUpperCase()) {
			case 'ACTIVE':
				return 'success';
			case 'ENDED':
			case 'COMPLETED':
				return 'info';
			case 'DRAFT':
				return 'warning';
			case 'CANCELLED':
				return 'danger';
			default:
				return 'secondary';
		}
	}

	/**
	 * Get active survey assignments from allSurveys
	 */
	getActiveSurveyAssignments(): any[] {
		const profile = this.getEnumeratorProfile();
		if (!profile?.allSurveys) return [];
		return profile.allSurveys.filter(
			(assignment) => assignment.survey?.status?.toUpperCase() === 'ACTIVE'
		);
	}

	/**
	 * Get ended survey assignments from allSurveys
	 */
	getEndedSurveyAssignments(): any[] {
		const profile = this.getEnumeratorProfile();
		if (!profile?.allSurveys) return [];
		return profile.allSurveys.filter(
			(assignment) => assignment.survey?.status?.toUpperCase() !== 'ACTIVE'
		);
	}

}

