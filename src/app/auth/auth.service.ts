import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'currentUser';

  constructor() {}

  /**
   * Simulate login by saving user info to localStorage
   * This would normally be done via backend response.
   */
  login(user: { id: number; name: string; email: string; role: string }) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  /**
   * Returns the currently logged-in user object
   */
  getCurrentUser(): { id: number; name: string; email: string; role: string } | null {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Log out and clear session
   */
  logout(): void {
    localStorage.removeItem(this.storageKey);
  }
}
