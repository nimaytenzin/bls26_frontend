import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminMasterDzongkhagsComponent } from './admin-master-dzongkhags.component';

const routes: Routes = [{ path: '', component: AdminMasterDzongkhagsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminMasterDzongkhagsRoutingModule { }
