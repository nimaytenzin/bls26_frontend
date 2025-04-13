import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { EccdRoutingModule } from "./eccd-routing.module";

import { EccdDashboardComponent } from "./eccd-dashboard/eccd-dashboard.component";
import { AttendanceComponent } from './staff/attendance/attendance.component';


@NgModule({
    declarations: [
        EccdDashboardComponent,
        AttendanceComponent,
    ],
    imports: [
        CommonModule, 
        EccdRoutingModule,
    ],
})
export class EccdModule {}