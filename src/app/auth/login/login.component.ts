import { Component, HostListener, OnInit } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PrimeNgModules } from '../../primeng.modules';

@Component({
	selector: 'app-login',
	standalone: true,
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNgModules],
})
export class LoginComponent implements OnInit {
	loginForm!: FormGroup;

	mouseX: number = 0;
	mouseY: number = 0;
	cursorX: number = 0;
	cursorY: number = 0;

	constructor(
		private fb: FormBuilder,
		private http: HttpClient,
		private router: Router
	) {}

	ngOnInit(): void {
		this.loginForm = this.fb.group({
			username: ['nimaytenzin', [Validators.required]],
			password: ['overlord123', Validators.required],
		});
	}

	login(): void {
		console.log('LOGGIN IN');
		this.router.navigate(['admin']);
	}

	@HostListener('mousemove', ['$event'])
	onMouseMove(event: MouseEvent) {
		this.cursorX = event.clientX;
		this.cursorY = event.clientY;

		this.mouseX = (event.clientX / window.innerWidth - 0.5) * 100;
		this.mouseY = (event.clientY / window.innerHeight - 0.5) * 100;
	}

	getTopCircleStyle() {
		return {
			transform: `translate3d(${this.mouseX * 2}px, ${this.mouseY * 2}px, 0)`,
			transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)',
		};
	}

	getBottomCircleStyle() {
		return {
			transform: `translate3d(${-this.mouseX * 2}px, ${-this.mouseY * 2}px, 0)`,
			transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)',
		};
	}
}
