import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminMasterStudentsComponent } from '../students/admin-master-students/admin-master-students.component';
import { AdminEnrollStudentComponent } from '../students/admin-enroll-student/admin-enroll-student.component';
import { AdminClassDetailedViewComponent } from '../class/admin-class-detailed-view/admin-class-detailed-view.component';
import { AdminMasterFacilityComponent } from '../facility/admin-master-facility/admin-master-facility.component';
import { AdminMasterPackageComponent } from '../students/admin-master-package/admin-master-package.component';

const routes: Routes = [
    {
        path: '',
        component: AdminDashboardComponent,
    },
    {
        path: 'students',
        component: AdminMasterStudentsComponent,
    },
    {
        path: 'facility',
        component: AdminMasterFacilityComponent,
    },
    {
        path: 'enroll',
        component: AdminEnrollStudentComponent,
    },
    {
        path: 'package',
        component: AdminMasterPackageComponent,
    },
    {
        path: 'class',
        component: AdminClassDetailedViewComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminDashboardRoutingModule {}
