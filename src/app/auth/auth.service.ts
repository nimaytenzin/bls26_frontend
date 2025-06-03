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
}
