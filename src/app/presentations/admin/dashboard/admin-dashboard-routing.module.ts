import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminMasterStudentsComponent } from '../students/admin-master-students/admin-master-students.component';
import { AdminEnrollStudentComponent } from '../students/admin-enroll-student/admin-enroll-student.component';
import { AdminClassDetailedViewComponent } from '../class/admin-class-detailed-view/admin-class-detailed-view.component';
import { AdminMasterFacilityComponent } from '../facility/admin-master-facility/admin-master-facility.component';
import { AdminMasterPackageComponent } from '../students/admin-master-package/admin-master-package.component';
import { AdminFacilityPageComponent } from '../facility/admin-facility-page/admin-facility-page.component';
import { AdminStudentReportCardComponent } from '../students/admin-student-report-card/admin-student-report-card.component';
import { AdminIntegratedAccountingToolComponent } from '../payment/admin-integrated-accounting-tool/admin-integrated-accounting-tool.component';
import { AdminMasterClassComponent } from '../class/admin-master-class/admin-master-class.component';

const routes: Routes = [
    {
        path: '',
        component: AdminDashboardComponent,
    },
    {
        path: 'attendance',
        component: AdminMasterStudentsComponent,
    },
    {
        path: 'student/detailed',
        component: AdminStudentReportCardComponent,
    },
    {
        path: 'facility',
        component: AdminFacilityPageComponent,
    },
    {
        path: 'facility/detailed',
        component: AdminFacilityPageComponent,
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
        path: 'accounting',
        component: AdminIntegratedAccountingToolComponent,
    },
    {
        path: 'class',
        component: AdminMasterClassComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminDashboardRoutingModule {}
