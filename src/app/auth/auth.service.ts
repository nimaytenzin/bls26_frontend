import { Injectable } from '@angular/core';
import { User } from '../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'currentUser';

  constructor() {}

  /**
   * Store the logged-in user to localStorage
   */
  login(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  /**
   * Retrieve current user from localStorage
   */
  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) as User : null;
  }

	/**
	* Get the current user's role
	*/
	getCurrentUserRole(): 'admin' | 'owner' | 'parent' | 'facilitator' {
		const user = this.getCurrentUser();
		return user?.role ?? 'parent'; // default fallback if role is undefined
	}


  /**
   * Returns true if a user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Clears user session
   */
  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

	getRedirectPathByRole(role: string): string {
		switch (role) {
			case 'admin': return '/admin-dashboard';
			case 'owner': return '/owner-dashboard';
			case 'parent': return '/parent-dashboard';
			case 'facilitator': return '/facilitator-dashboard';
			default: return '/unauthorized';
		}
	}
}
