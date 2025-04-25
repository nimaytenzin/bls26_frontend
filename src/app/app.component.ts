import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter, first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}


  ngOnInit(): void {
    const savedTab = localStorage.getItem('activeTab');

    // Listen to first navigation event ONLY
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart),
      first()
    ).subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl === '/' && savedTab) {
        console.log('🔁 Redirecting to savedTab:', savedTab);
        this.router.navigateByUrl(savedTab).catch(err => {
          console.warn('Redirect failed, fallback to /dashboard', err);
          this.router.navigateByUrl('/dashboard');
        });
      }
    });
  }
}
