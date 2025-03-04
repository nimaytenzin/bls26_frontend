import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { BuildingOwnershipDataService } from 'src/app/core/dataservice/ownership/buildingownership.dataservice';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { BankAccountDto } from 'src/app/core/dataservice/bankaccounts/bankaccount.dto';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';
import { LandLordDTO } from 'src/app/core/dto/users/landlord.dto';

@Component({
    selector: 'app-admin-create-unit-bank-linkage',
    templateUrl: './admin-create-unit-bank-linkage.component.html',
    styleUrls: ['./admin-create-unit-bank-linkage.component.css'],
    standalone: true,
    imports: [CommonModule, ButtonModule],
})
export class AdminCreateUnitBankLinkageComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;

    owners: LandLordDTO[] = [];
    bankList;
    unit: UnitDTO;
    constructor(
        private ref: DynamicDialogRef,
        private route: ActivatedRoute,
        private buildingOwnershipDataService: BuildingOwnershipDataService,
        private bankAccountDataservice: BankAccountDataService,
        private dialogService: DialogService,
        private unitDataService: UnitDataService
    ) {
        this.bankList = bankAccountDataservice.BankListWithLogo;
        this.instance = this.dialogService.getInstance(this.ref);

        if (this.instance && this.instance.data) {
            this.unit = this.instance.data;
        }

        this.buildingOwnershipDataService
            .FindAllOwnersAndBankAccountsByBuilding(this.unit.buildingId)
            .subscribe((res) => {
                console.log(res);
                this.owners = res;
            });
    }

    ngOnInit() {}

    getBankLogo(shorthand: string) {
        let result = this.bankList.find((item) => item.shorthand === shorthand);
        return result.logourl;
    }

    linkBankAccount(bankAccount: BankAccountDto) {
        console.log(bankAccount);
        this.unitDataService
            .UpdateUnit(
                {
                    bankAccountId: bankAccount.id,
                },
                this.unit.id
            )
            .subscribe({
                next: (res) => {
                    if (res) {
                        this.ref.close({
                            status: 200,
                        });
                    }
                },
            });
    }
}
