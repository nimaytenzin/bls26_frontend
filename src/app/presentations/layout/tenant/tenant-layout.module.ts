import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantLayoutComponent } from './tenant-layout.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TenantTopbarComponent } from './tenant-topbar/tenant-topbar.component';
import { TenantSidebarComponent } from './tenant-sidebar/tenant-sidebar.component';
import { TenantMenuitemComponent } from './tenant-sidebar/tenant-menuitem.component';
import { BadgeModule } from 'primeng/badge';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SidebarModule } from 'primeng/sidebar';
import { TenantFooterComponent } from './tenant-footer/tenant-footer.component';
import { TenantHeaderComponent } from './tenant-header/tenant-header.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        InputTextModule,
        SidebarModule,
        BadgeModule,
        RadioButtonModule,
        InputSwitchModule,
        RippleModule,
        RouterModule,
        TenantTopbarComponent,
        TenantHeaderComponent,
    ],
    declarations: [
        TenantLayoutComponent,
        TenantSidebarComponent,
        TenantMenuitemComponent,
        TenantFooterComponent,
    ],

    exports: [TenantLayoutComponent],
})
export class TenantLayoutModule {}
