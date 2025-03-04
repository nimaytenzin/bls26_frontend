import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { TenantEntryDamageItemCreateModalComponent } from './subcomponents/tenant-entry-damage-item-create-modal/tenant-entry-damage-item-create-modal.component';
import {
    CreateEntryDamageReportItemDTO,
    EntryDamageReportItemDTO,
} from 'src/app/core/dataservice/damage/entry-damage-report-item.dto';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ENTRYDAMAGEACTIONSTATUS } from 'src/app/core/constants/enums';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import {
    CreateEntryDamageReportDTO,
    EntryDamageReportDTO,
} from 'src/app/core/dataservice/damage/entry-damage-report.dto';
import { EntryDamageReportDataservice } from 'src/app/core/dataservice/damage/entry-damage-report.dataservice';
import { API_URL } from 'src/app/core/constants/constants';

@Component({
    selector: 'app-tenant-submit-damage-report-modal',
    templateUrl: './tenant-submit-damage-report-modal.component.html',
    styleUrls: ['./tenant-submit-damage-report-modal.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        DividerModule,
        TableModule,
        CheckboxModule,
        FormsModule,
        CommonModule,
    ],
    providers: [DialogService],
})
export class TenantSubmitDamageReportModalComponent implements OnInit {
    leaseAgreement;
    damageReportItems: EntryDamageReportItemDTO[] = [];
    agree: boolean = false;

    entryDamageReport: EntryDamageReportDTO;

    constructor(
        private dialogService: DialogService,
        private ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
        private primeConfig: PrimeNGConfig,
        private messageService: MessageService,
        private entryDamageReportDataService: EntryDamageReportDataservice
    ) {
        this.leaseAgreement = this.config.data;
    }

    ngOnInit() {
        this.createOrGetEntryDamageReport();
        console.log('CREAT DAMAGE REPORT FOR ', this.leaseAgreement);
    }

    createOrGetEntryDamageReport() {
        console.log('GET or create');
        this.entryDamageReportDataService
            .GetEntryDamageReportByLease(this.leaseAgreement.id)
            .subscribe({
                next: (res) => {
                    if (!res) {
                        this.entryDamageReportDataService
                            .CreateEntryDamageReport({
                                leaseAgreementId: this.leaseAgreement.id,
                            })
                            .subscribe((resp) => {
                                if (resp) {
                                    this.entryDamageReport = resp;
                                    this.fetchEntryDamageReportItems();
                                }
                            });
                    } else {
                        this.entryDamageReport = res;
                        this.fetchEntryDamageReportItems();
                    }
                },
            });
    }

    fetchEntryDamageReportItems() {
        this.entryDamageReportDataService
            .GetEntryDamageReportItemsByReport(this.entryDamageReport.id)
            .subscribe((res) => {
                this.damageReportItems = res;
                console.log('ITEMS', res);
            });
    }

    openAddDamageItemModal() {
        this.ref = this.dialogService.open(
            TenantEntryDamageItemCreateModalComponent,
            {
                header: 'Damage Item',
                data: {
                    entryDamageReportId: this.entryDamageReport.id,
                },
            }
        );

        this.ref.onClose.subscribe((res) => {
            if (res && res.data) {
                this.fetchEntryDamageReportItems();
            }
        });
    }
    formatSize(bytes) {
        const k = 1024;
        const dm = 3;
        const sizes = this.primeConfig.translation.fileSizeTypes;
        if (bytes === 0) {
            return `0 ${sizes[0]}`;
        }

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

        return `${formattedSize} ${sizes[i]}`;
    }

    getImageSrc(src: string) {
        return API_URL + '/' + src;
    }

    submitDamageReport() {
        if (!this.agree) {
            this.messageService.add({
                severity: 'error',
                summary: 'Please Check the checkbox',
                detail: 'Please Check the acknowledgement checkbox',
            });
        } else {
            this.entryDamageReportDataService
                .SubmitEntryDamageReport({
                    reportDate: new Date().toDateString(),
                    entryDamageReportId: this.entryDamageReport.id,
                    leaseAgreementId: this.leaseAgreement.id,
                })
                .subscribe((res) => {
                    if (this.ref) {
                        this.ref.close({
                            status: 201,
                        });
                    } else {
                        console.error('Dialog reference is undefined');
                    }
                });
        }
    }

    urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
        return fetch(url)
            .then((res) => res.arrayBuffer())
            .then((buffer) => new File([buffer], filename, { type: mimeType }));
    }
}
