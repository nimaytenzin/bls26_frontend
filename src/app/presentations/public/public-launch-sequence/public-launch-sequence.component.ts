import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { gsap } from 'gsap';
import { Router } from '@angular/router';

@Component({
    selector: 'app-public-launch-sequence',
    templateUrl: './public-launch-sequence.component.html',
    styleUrls: ['./public-launch-sequence.component.scss'],
    standalone: true,
    imports: [ButtonModule, CommonModule],
})
export class PublicLaunchSequenceComponent implements OnInit, AfterViewInit {
    live: boolean = false;
    goingLive: boolean = false;
    countDownNumber: number = 3;

    @ViewChild('centerElement') centerElement!: ElementRef;

    constructor(private router: Router) {}

    ngOnInit() {}

    launchSystem() {
        this.goingLive = true;
        this.countDownNumber = 3;

        const countdownInterval = setInterval(() => {
            this.countDownNumber--;
            if (this.countDownNumber === 0) {
                this.goingLive = false;
                this.live = true;
                clearInterval(countdownInterval);
                this.showFeatures();
            }
        }, 1000);
    }

    showFeatures() {
        const featuresContainer = document.querySelector(
            '.features-container'
        )!;
        const timeline = gsap.timeline();

        timeline.to(featuresContainer, { opacity: 1, duration: 1 });

        timeline.from('.feature-item', {
            opacity: 0,
            y: 20,
            duration: 2,
            stagger: 2,
        });

        timeline.to(featuresContainer, {
            opacity: 0,
            duration: 1,
            delay: 2,
        });

        timeline.to(this.centerElement.nativeElement, {
            opacity: 1,
            scale: 1.5,
            duration: 2,
            ease: 'power1.out',
        });
    }

    visitHomePage() {
        this.router.navigate(['/']);
    }

    ngAfterViewInit(): void {
        this.animateClouds();
    }

    private animateClouds() {
        gsap.to('.cloud1', {
            left: '100%',
            duration: 230,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud2', {
            left: '100%',
            duration: 232,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud3', {
            left: '100%',
            duration: 234,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud4', {
            left: '100%',
            duration: 236,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud5', {
            left: '100%',
            duration: 238,
            repeat: -1,
            ease: 'linear',
        });
    }
}
