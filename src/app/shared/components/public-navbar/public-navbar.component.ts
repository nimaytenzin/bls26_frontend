import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss',
	imports: [CommonModule],
})
export class PublicNavbarComponent {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
