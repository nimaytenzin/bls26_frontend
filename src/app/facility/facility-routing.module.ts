import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth.guard";
import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from "./attendance/attendance.component";
import { EnrollmentComponent } from "./enrollment/enrollment.component";
import { PackageComponent } from "./packages/package.component";
import { FacilityListComponent } from "./facility-list/facility-list.component";
import { FacilitatorComponent } from "./facilitator/facilitator.component";


const routes: Routes = [
	{ path: "dashboard", component: FacilityDashboardComponent, canActivate: [AuthGuard] },
  { path: "facilities", component: FacilityListComponent },
  { path: "facilities/facilitators", component: FacilitatorComponent },
  { path: "facilities/attendance", component: AttendanceComponent },
  { path: "facilities/enrollment", component: EnrollmentComponent },
	{ path: "facilities/packages", component: PackageComponent },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
    })

export class FacilityRoutingModule { }
