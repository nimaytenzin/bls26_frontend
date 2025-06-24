import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SessionInfo {
	sessionId: string;
	createdAt: Date;
	lastActivity: Date;
	userAgent: string;
	isActive: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class SessionService {
	private readonly SESSION_KEY = 'movie_booking_session';
	private readonly SESSION_ACTIVITY_KEY = 'movie_booking_session_activity';

	private sessionSubject = new BehaviorSubject<SessionInfo | null>(null);
	private isDestroyed = false;

	constructor() {
		this.initializeSession();
		this.setupSessionTracking();
		this.setupBeforeUnloadCleanup();
	}

	/**
	 * Get the current session observable
	 */
	getSession(): Observable<SessionInfo | null> {
		return this.sessionSubject.asObservable();
	}

	/**
	 * Get the current session ID
	 */
	getSessionId(): string | null {
		const session = this.sessionSubject.value;
		return session?.sessionId || null;
	}

	/**
	 * Get the current session info
	 */
	getCurrentSession(): SessionInfo | null {
		return this.sessionSubject.value;
	}

	/**
	 * Create a new session
	 */
	createSession(): string {
		const sessionId = this.generateSessionId();
		const sessionInfo: SessionInfo = {
			sessionId,
			createdAt: new Date(),
			lastActivity: new Date(),
			userAgent: navigator.userAgent,
			isActive: true,
		};

		// Store in sessionStorage (cleared when browser/tab is closed)
		sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionInfo));
		sessionStorage.setItem(this.SESSION_ACTIVITY_KEY, Date.now().toString());

		this.sessionSubject.next(sessionInfo);

		console.log('New session created:', sessionId);
		return sessionId;
	}

	/**
	 * Update session activity timestamp
	 */
	updateActivity(): void {
		const currentSession = this.sessionSubject.value;
		if (currentSession) {
			currentSession.lastActivity = new Date();

			// Update in sessionStorage
			sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(currentSession));
			sessionStorage.setItem(this.SESSION_ACTIVITY_KEY, Date.now().toString());

			this.sessionSubject.next(currentSession);
		}
	}

	/**
	 * End the current session
	 */
	endSession(): void {
		console.log('Ending session');

		// Clear session storage
		sessionStorage.removeItem(this.SESSION_KEY);
		sessionStorage.removeItem(this.SESSION_ACTIVITY_KEY);

		// Update session state
		const currentSession = this.sessionSubject.value;
		if (currentSession) {
			currentSession.isActive = false;
			this.sessionSubject.next(currentSession);
		}

		// Clear the session
		this.sessionSubject.next(null);
	}

	/**
	 * Check if session is valid and active
	 */
	isSessionValid(): boolean {
		const session = this.sessionSubject.value;
		return session !== null && session.isActive;
	}

	/**
	 * Get session duration in minutes
	 */
	getSessionDuration(): number {
		const session = this.sessionSubject.value;
		if (!session) return 0;

		const now = new Date();
		const created = new Date(session.createdAt);
		return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
	}

	/**
	 * Get time since last activity in minutes
	 */
	getTimeSinceLastActivity(): number {
		const session = this.sessionSubject.value;
		if (!session) return 0;

		const now = new Date();
		const lastActivity = new Date(session.lastActivity);
		return Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
	}

	/**
	 * Cleanup method for component destruction
	 */
	destroy(): void {
		this.isDestroyed = true;
	}

	/**
	 * Initialize session from storage or create new one
	 */
	private initializeSession(): void {
		try {
			const storedSession = sessionStorage.getItem(this.SESSION_KEY);
			const storedActivity = sessionStorage.getItem(this.SESSION_ACTIVITY_KEY);

			if (storedSession && storedActivity) {
				const sessionInfo: SessionInfo = JSON.parse(storedSession);

				// Check if session is recent (within last 30 minutes of inactivity)
				const lastActivity = parseInt(storedActivity, 10);
				const timeSinceActivity = Date.now() - lastActivity;
				const maxInactivityTime = 30 * 60 * 1000; // 30 minutes

				if (timeSinceActivity < maxInactivityTime) {
					// Restore existing session
					sessionInfo.lastActivity = new Date();
					this.sessionSubject.next(sessionInfo);
					this.updateActivity();
					console.log('Restored existing session:', sessionInfo.sessionId);
					return;
				} else {
					console.log(
						'Session expired due to inactivity, creating new session'
					);
				}
			}
		} catch (error) {
			console.error('Error restoring session:', error);
		}

		// Create new session if no valid session exists
		this.createSession();
	}

	/**
	 * Setup session activity tracking
	 */
	private setupSessionTracking(): void {
		// Track user activity
		const activityEvents = [
			'mousedown',
			'mousemove',
			'keypress',
			'scroll',
			'touchstart',
			'click',
		];

		activityEvents.forEach((event) => {
			document.addEventListener(
				event,
				() => {
					if (!this.isDestroyed) {
						this.updateActivity();
					}
				},
				true
			);
		});

		// Update activity every 5 minutes
		setInterval(() => {
			if (!this.isDestroyed && this.isSessionValid()) {
				this.updateActivity();
			}
		}, 5 * 60 * 1000); // 5 minutes

		// Check for session validity every minute
		setInterval(() => {
			if (!this.isDestroyed) {
				this.validateSession();
			}
		}, 60 * 1000); // 1 minute
	}

	/**
	 * Setup cleanup when browser/tab is closed
	 */
	private setupBeforeUnloadCleanup(): void {
		// Handle page unload (browser/tab close)
		window.addEventListener('beforeunload', () => {
			console.log('Browser closing, cleaning up session');
			this.endSession();
		});

		// Handle visibility change (tab switch, minimize, etc.)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				// Tab became visible - update activity
				if (!this.isDestroyed && this.isSessionValid()) {
					this.updateActivity();
				}
			}
		});

		// Handle page navigation away
		window.addEventListener('pagehide', () => {
			console.log('Page hiding, ending session');
			this.endSession();
		});
	}

	/**
	 * Validate current session
	 */
	private validateSession(): void {
		const session = this.sessionSubject.value;
		if (!session) return;

		// Check for inactivity timeout (30 minutes)
		const timeSinceActivity = this.getTimeSinceLastActivity();
		if (timeSinceActivity > 30) {
			console.log('Session expired due to inactivity');
			this.endSession();
			return;
		}

		// Check for maximum session duration (8 hours)
		const sessionDuration = this.getSessionDuration();
		if (sessionDuration > 480) {
			// 8 hours
			console.log('Session expired due to maximum duration');
			this.endSession();
			return;
		}
	}

	/**
	 * Generate a unique session ID
	 */
	private generateSessionId(): string {
		const timestamp = Date.now().toString(36);
		const randomString = Math.random().toString(36).substr(2, 9);
		const userAgentHash = this.hashCode(navigator.userAgent).toString(36);

		return `session_${timestamp}_${randomString}_${userAgentHash}`;
	}

	/**
	 * Simple hash function for user agent
	 */
	private hashCode(str: string): number {
		let hash = 0;
		if (str.length === 0) return hash;

		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}

		return Math.abs(hash);
	}
}
