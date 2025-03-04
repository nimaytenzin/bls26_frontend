import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerLayoutComponent } from './owner-layout.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OwnerSidebarComponent } from './owner-sidebar/owner-sidebar.component';
import { BadgeModule } from 'primeng/badge';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SidebarModule } from 'primeng/sidebar';
import { OwnerMenuitemComponent } from './owner-sidebar/owner-menuitem.component';
import { OwnerTopbarComponent } from './owner-topbar/owner-topbar.component';
import { OwnerHeaderComponent } from './owner-header/owner-header.component';

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
        OwnerTopbarComponent,
        OwnerHeaderComponent,
    ],
    declarations: [
        OwnerLayoutComponent,
        OwnerSidebarComponent,
        OwnerMenuitemComponent,
    ],

    exports: [OwnerLayoutComponent],
})
export class OwnerLayoutModule {}
