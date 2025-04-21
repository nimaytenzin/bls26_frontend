import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth.guard";
import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from "./facilitators/attendance/attendance.component";
import { RegistrationComponent } from "./registration/registration.component";
import { PackageComponent } from "./packages/package.component";
import { FacilityListComponent } from "./facility-list/facility-list.component";


const routes: Routes = [

	{ path: "dashboard", component: FacilityDashboardComponent, canActivate: [AuthGuard] },
  { path: "facilities", component: FacilityListComponent },
  { path: "facilitators/attendance", component: AttendanceComponent },
  { path: "facilities/registration", component: RegistrationComponent },
	{ path: "facilities/packages", component: PackageComponent },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
    })

export class FacilityRoutingModule { }
