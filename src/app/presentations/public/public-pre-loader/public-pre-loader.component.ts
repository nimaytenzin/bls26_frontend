import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-public-pre-loader',
	templateUrl: './public-pre-loader.component.html',
	styleUrls: ['./public-pre-loader.component.scss'],
	standalone: true,
	imports: [CommonModule],
})
export class PublicPreLoaderComponent implements OnInit {
	mouseX: number = 0;
	mouseY: number = 0;
	cursorX: number = 0;
	cursorY: number = 0;

	constructor() {}

	ngOnInit() {}

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

	getCursorStyle() {
		return {
			transform: `translate(${this.cursorX}px, ${this.cursorY}px)`,
			transition: 'transform 0.1s ease-out',
		};
	}
}
