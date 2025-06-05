import { NgModule } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password'; // optional if used
import { DropdownModule } from 'primeng/dropdown'; // optional
import { ToastModule } from 'primeng/toast'; // optional
import { DialogModule } from 'primeng/dialog'; // optional
import { TableModule } from 'primeng/table'; // optional
import { TooltipModule } from 'primeng/tooltip'; // optional
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // optional
import { PanelMenuModule } from 'primeng/panelmenu'; // optional

const PRIME_NG_MODULES = [
	CardModule,
	InputTextModule,
	ButtonModule,
	PasswordModule,
	DropdownModule,
	ToastModule,
	DialogModule,
	TableModule,
	TooltipModule,
	ConfirmDialogModule,
	PanelMenuModule,
];

@NgModule({
	imports: PRIME_NG_MODULES,
	exports: PRIME_NG_MODULES,
})
export class PrimeNgModules {}
