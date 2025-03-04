import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
} from 'primeng/dynamicdialog';
import { TabViewModule } from 'primeng/tabview';
import { PARSEFLOORLEVELS } from 'src/app/core/utility/helper.function';

@Component({
    selector: 'app-tenant-view-lease-details',
    templateUrl: './tenant-view-lease-details.component.html',
    styleUrls: ['./tenant-view-lease-details.component.scss'],
    standalone: true,
    imports: [CommonModule, TabViewModule, DividerModule],
})
export class TenantViewLeaseDetailsComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    lease;
    parseFloorLevel = PARSEFLOORLEVELS;

    constructor(
        public ref: DynamicDialogRef,
        private dialogService: DialogService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.lease = this.instance.data;
    }

    ngOnInit() {}

    computeMonthlyPayable(item) {
        let total = item.rent;
        for (let i = 0; i < item.leaseSurcharges.length; i++) {
            total += item.leaseSurcharges[i].amount;
        }
        return total;
    }

    parseReadableDate(date: string) {
        return new Date(date).toDateString();
    }
}
