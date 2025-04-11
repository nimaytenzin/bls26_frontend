import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddChildComponent } from './children/add-child.component';


const routes: Routes = [
    { path: 'children/add', component: AddChildComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentRoutingModule {}