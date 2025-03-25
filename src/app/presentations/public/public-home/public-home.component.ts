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
import { DropdownModule } from 'primeng/dropdown';

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
        DropdownModule,
    ],
    providers: [],
})
export class PublicHomeComponent implements OnInit, AfterViewInit {
    features = [
        { name: 'Center Management' },
        { name: 'Family Engagement' },
        { name: 'Billing and Payments' },
        { name: 'Professional Development' },
    ];

    users = [
        { name: 'Owners & Directors' },
        { name: 'Parents' },
        { name: 'Facilitators' },
    ];

    constructor(private router: Router) {}

    ngOnInit() {}

    ngAfterViewInit(): void {}

    login() {
        this.router.navigate(['admin']);
    }
}
