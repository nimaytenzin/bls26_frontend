import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AddChildComponent } from './children/add-child.component';
import { ParentRoutingModule } from './parent-routing.module'; // Adjust the path as necessary



@NgModule({
  declarations: [
   AddChildComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ParentRoutingModule
  ]
})

export class ParentModule {}