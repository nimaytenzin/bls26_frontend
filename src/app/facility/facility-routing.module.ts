import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from "./facilitators/attendance/attendance.component";
import { RegistrationComponent } from "./registration/registration.component";


const routes: Routes = [
  { path: "", component: FacilityDashboardComponent},
  { path: "dashboard", component: FacilityDashboardComponent },
  { path: "facilitators/attendance", component: AttendanceComponent },
  { path: "registration", component: RegistrationComponent },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
    })

export class FacilityRoutingModule { }
