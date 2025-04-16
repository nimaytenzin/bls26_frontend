import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { EccdDashboardComponent } from "./eccd-dashboard/eccd-dashboard.component";
import { AttendanceComponent } from "./staff/attendance/attendance.component";



const routes: Routes = [
  { path: "", component: EccdDashboardComponent},
  { path: "dashboard", component: EccdDashboardComponent },
  { path: "staff/attendance", component: AttendanceComponent },
]

@NgModule({                     
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
    })

export class EccdRoutingModule { }