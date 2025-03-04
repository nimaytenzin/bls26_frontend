import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { BankAccountDto } from 'src/app/core/dataservice/bankaccounts/bankaccount.dto';
import { AdminCreateBankAccountComponent } from '../admin-create-bank-account/admin-create-bank-account.component';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { AdminEditBankAccoutComponent } from '../admin-edit-bank-accout/admin-edit-bank-accout.component';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';

@Component({
    selector: 'app-admin-bank-account-list',
    templateUrl: './admin-bank-account-list.component.html',
    styleUrls: ['./admin-bank-account-list.component.css'],
    standalone: true,
    imports: [TableModule, CommonModule, ButtonModule],
    providers: [DialogService],
})
export class AdminBankAccountListComponent implements OnInit {
    ref: DynamicDialogRef;

    bankAccounts: BankAccountDto[];
    constructor(
        private dialogService: DialogService,
        private bankAccountDataService: BankAccountDataService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.getBankAccountsByAdmin();
    }

    getBankAccountsByAdmin() {
        this.bankAccountDataService
            .GetAllBankAccountsByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe((res) => {
                this.bankAccounts = res;
            });
    }

    openAddBankAccountModal() {
        this.ref = this.dialogService.open(AdminCreateBankAccountComponent, {
            header: 'Create Bank Account',
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                this.getBankAccountsByAdmin();
            }
        });
    }
    openUpdateBankAccountModal(item: BankAccountDto) {
        this.ref = this.dialogService.open(AdminEditBankAccoutComponent, {
            header: 'update',
            data: { ...item },
        });
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                this.getBankAccountsByAdmin();
            }
        });
    }
    downloadMasterTable() {
        this.bankAccountDataService
            .DownloadAllBankAccountsAsExcel()
            .subscribe((res) => {
                const blob = new Blob([res], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Bank_Accounts.xlsx'; // Specify the file name
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Downloaded',
                    detail: 'Bank Account List Downloaded',
                });
            });
    }
}
