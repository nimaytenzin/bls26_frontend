import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Message, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { LocationDataService } from 'src/app/core/dataservice/location/location.dataservice';
import { CreateDzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';

@Component({
    selector: 'app-admin-add-dzongkhag',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        InputNumberModule,
        InputTextModule,
        MessagesModule,
        ButtonModule,
    ],
    providers: [DialogService, MessageService],
    templateUrl: './admin-add-dzongkhag.component.html',
    styleUrl: './admin-add-dzongkhag.component.scss',
})
export class AdminAddDzongkhagComponent {
    constructor(
        private fb: FormBuilder,
        private locationDataService: LocationDataService,
        public ref: DynamicDialogRef
    ) {}
    messages: Message[] | undefined;
    createDzongkhagForm!: FormGroup;

    ngOnInit(): void {
        this.createDzongkhagForm = this.fb.group({
            name: ['', Validators.required],
            nameDzo: [''],
        });
    }

    createDzongkhag() {
        const data: CreateDzongkhagDTO = {
            name: this.createDzongkhagForm.controls['name'].value,
            nameDzo: this.createDzongkhagForm.controls['nameDzo'].value,
        };

        this.locationDataService.CreateDzongkhag(data).subscribe({
            next: (res: any) => {
                console.log(res);
                this.messages = [
                    {
                        severity: 'success',
                        summary: 'Entry Created',
                        detail: res.message,
                    },
                ];
                setTimeout(() => {
                    this.ref.close({
                        added: true,
                    });
                }, 0);
            },
            error: (err) => {
                console.log(err);
                this.messages = [
                    {
                        severity: 'error',
                        summary: 'Error: ' + err.error.statusCode,
                        detail: err.error.message,
                    },
                ];
            },
        });
    }
}
