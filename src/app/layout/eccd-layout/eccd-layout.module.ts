import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SidebarEccdComponent } from './sidebar-eccd/sidebar-eccd.component';
import { EccdLayoutComponent } from './eccd-layout.component';

@NgModule({
  declarations: [
    SidebarEccdComponent,
    EccdLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule // This is required for router-outlet
  ],
  exports: [EccdLayoutComponent]
})
export class EccdLayoutModule { }
