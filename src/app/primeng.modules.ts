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
import { InputNumberModule } from 'primeng/inputnumber';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel'; // optional
import { DividerModule } from 'primeng/divider'; // optional
import { ListboxModule } from 'primeng/listbox'; // optio
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { KnobModule } from 'primeng/knob';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ContextMenuModule } from 'primeng/contextmenu';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { TabsModule } from 'primeng/tabs';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputOtpModule } from 'primeng/inputotp';
import { DatePickerModule } from 'primeng/datepicker';
import { ColorPickerModule } from 'primeng/colorpicker';
import { StepsModule } from 'primeng/steps';
import { DataViewModule } from 'primeng/dataview';
import { PaginatorModule } from 'primeng/paginator';
const PRIME_NG_MODULES = [
	CardModule,
	InputTextModule,
	InputNumberModule,
	ButtonModule,
	PasswordModule,
	DropdownModule,
	ToastModule,
	DialogModule,
	TableModule,
	TooltipModule,
	ConfirmDialogModule,
	PanelMenuModule,
	MenubarModule,
	AvatarModule,
	ScrollPanelModule,
	DividerModule,
	ListboxModule,
	ChipModule,
	TagModule,
	ProgressBarModule,
	ChartModule,
	PanelModule,
	BadgeModule,
	KnobModule,
	SkeletonModule,
	CheckboxModule,
	SelectButtonModule,
	ContextMenuModule,
	InputGroupModule,
	InputGroupAddonModule,
	MessageModule,
	CalendarModule,
	MultiSelectModule,
	TextareaModule,
	FileUploadModule,
	TabsModule,
	TabViewModule,
	ProgressSpinnerModule,
	InputOtpModule,
	DatePickerModule,
	ColorPickerModule,
	StepsModule,
	DataViewModule,
	PaginatorModule,
];

@NgModule({
	imports: PRIME_NG_MODULES,
	exports: PRIME_NG_MODULES,
})
export class PrimeNgModules {}
