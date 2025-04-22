import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FacilitySidebarComponent } from './facility-sidebar/facility-sidebar.component';
import { FacilityLayoutComponent } from './facility-layout.component';

@NgModule({
  declarations: [
    FacilitySidebarComponent,
    FacilityLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule, // This is required for router-outlet
    FormsModule // required for two-way binding
  ],
  exports: [FacilityLayoutComponent]
})
export class FacilityLayoutModule { }
