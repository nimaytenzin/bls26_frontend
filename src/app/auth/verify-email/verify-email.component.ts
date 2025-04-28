import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
	standalone: true,
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
	imports: [
		CommonModule
	],
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = true;
  success = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    this.http.get<any[]>(`http://localhost:3000/users?verifyToken=${token}`).subscribe(users => {
      const user = users[0];
      if (user) {
        this.http.patch(`http://localhost:3000/users/${user.id}`, {
          isVerified: true
        }).subscribe(() => {
          this.success = true;
          this.isVerifying = false;
          setTimeout(() => this.router.navigate(['/auth/set-password'], { queryParams: { id: user.id } }), 2000);
        });
      } else {
        this.success = false;
        this.isVerifying = false;
      }
    });
  }
}
