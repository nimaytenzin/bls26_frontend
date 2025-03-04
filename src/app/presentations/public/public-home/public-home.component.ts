import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import {
    COMPANY_NAME,
    ZHIDHAYCONTACTDETAILS,
} from 'src/app/core/constants/constants';
import {
    RECAPTCHA_V3_SITE_KEY,
    ReCaptchaV3Service,
    RecaptchaV3Module,
} from 'ng-recaptcha';
import { RecaptchaService } from 'src/app/core/dataservice/recaptcha.dataservice';
import { SidebarModule } from 'primeng/sidebar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { GalleriaModule } from 'primeng/galleria';

@Component({
    selector: 'app-public-home',
    templateUrl: './public-home.component.html',
    styleUrls: ['./public-home.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        FormsModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        CalendarModule,
        ReactiveFormsModule,
        SidebarModule,
        InputTextareaModule,
        InputGroupModule,
        InputGroupAddonModule,
        CardModule,
        RecaptchaV3Module,
        GalleriaModule,
    ],
    providers: [],
})
export class PublicHomeComponent implements OnInit, AfterViewInit {
    @ViewChild('hContainer') hContainer: ElementRef;
    @ViewChild('centerElement') centerElement!: ElementRef;
    showRequestDemoModal: boolean = false;
    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    characterLimit = 100;
    characterCountExceeded: boolean = false;
    listedUnits: UnitDTO[] = [];

    date: Date | undefined;
    companyName: string = COMPANY_NAME;
    requestDemoForm: FormGroup;
    captcha: any;
    buildingImages = [
        'https://www.waytobhutan.com/wp-content/uploads/2020/02/dscf26071-1024x768.jpg',
        'https://media.architecturaldigest.com/photos/5aa7f0882ed63a101d5619f3/master/w_1600%2Cc_limit/amankora-gangtey-bhutan-dining.jpg.jpg',
    ];
    constructor(
        private router: Router,
        private fb: FormBuilder,
        private recaptchaV3Service: ReCaptchaV3Service,
        private recaptchaVerificationService: RecaptchaService,

        private messageService: MessageService,
        private unitDataService: UnitDataService
    ) {
        this.requestDemoForm = this.fb.group({
            name: [],
            phoneNumber: [],
            remarks: new FormControl({ value: '', disabled: false }, [
                Validators.maxLength(this.characterLimit),
            ]),
            preferredDemoDate: [],
        });
    }

    ngOnInit() {
        this.unitDataService.GetUnitListings().subscribe({
            next: (res) => {
                this.listedUnits = res;
            },
        });
    }

    ngAfterViewInit(): void {
        gsap.from(this.centerElement.nativeElement, {
            duration: 1,
            opacity: 0,
            scale: 1.19, // Scale up to 1.5 times its original size
            // Move it up by 100% of its height
            ease: 'power1.out', // Use a power1 easing function for a smooth start and end
            delay: 0, // Start the animation after a half-second delay
        });
        // gsap.fromTo(
        //     '.cloud1',
        //     { left: '0%' },
        //     {
        //         left: '30%',
        //         top: '50%',
        //         duration: 5000,
        //         repeat: 1,
        //         opacity: 0,
        //         ease: 'linear',
        //         scrollTrigger: {
        //             trigger: '.cloud1',
        //             start: 'top bottom', // Start the animation when the top of the element hits the bottom of the viewport
        //             end: 'bottom top', // End the animation when the bottom of the element hits the top of the viewport
        //             scrub: true, // Smoothly scrub the animation based on scroll position
        //         },
        //     }
        // );

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
            right: '100%',
            duration: 222,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud4', {
            right: '100%',
            duration: 232,
            repeat: -1,
            ease: 'linear',
        });
        gsap.to('.cloud5', {
            left: '100%',
            duration: 250,
            repeat: -1,
            ease: 'linear',
        });
        // const items = document.querySelectorAll('.data');

        // gsap.from(items, {
        //     textContent: 0,
        //     duration: 4,
        //     ease: 'power1.in',
        //     snap: { textContent: 1 },
        //     onUpdate: function () {
        //         this.targets()[0].innerHTML = this.numberWithCommas(
        //             Math.ceil(this.targets()[0].textContent)
        //         );
        //     },
        // });
    }

    login() {
        this.router.navigate(['auth']);
    }

    onTextareaInput(event: Event): void {
        const value = (event.target as HTMLTextAreaElement).value;
        if (value.length > this.characterLimit) {
            this.characterCountExceeded = true;
        }
    }

    getRemarksCharCount(): number {
        const remarksControl = this.requestDemoForm.get('remarks');
        if (remarksControl) {
            const remarksValue = remarksControl.value;
            return remarksValue ? remarksValue.length : 0;
        }
        return 0;
    }
    requestDemo() {
        const formValue = this.requestDemoForm.value;
        let dateObj = new Date(formValue.preferredDemoDate);

        let month = dateObj.toLocaleString('default', { month: 'short' }); // Gets abbreviated month name
        let day = dateObj.getDate(); // Gets the day of the month
        let year = dateObj.getFullYear(); // Gets the full year

        let formattedDate = `${month} ${day} ${year}`;

        const message = `${formValue.name},#${formValue.phoneNumber} has requested a demo on ${formattedDate}.message: ${formValue.remarks}`;

        this.recaptchaV3Service
            .execute('RequestingDemoForZhidhay')
            .subscribe((token) => {
                this.recaptchaVerificationService
                    .Requestdemo(token, message)
                    .subscribe((res) => {
                        if (res) {
                            this.showRequestDemoModal = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Demo request has been sent.',
                                detail: 'Our Team will contact you shortly with the details.',
                            });
                        }
                    });
            });
    }
}
