import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';



@NgModule({
  declarations: [
    PublicNavbarComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PublicNavbarComponent
  ],
})

export class SharedModule {}