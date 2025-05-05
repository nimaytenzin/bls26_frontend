import { Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth.guard";
import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from "./attendance/attendance.component";
import { EnrollmentComponent } from "./enrollment/enrollment.component";
import { PackageComponent } from "./packages/package.component";
import { FacilityListComponent } from "./facility-list/facility-list.component";
import { FacilitatorComponent } from "./facilitator/facilitator.component";
import { PostActivityComponent } from "./post-activity/post-activity.component";
import { FacilityLayoutComponent } from "../layout/facility-layout/facility-layout.component";
import { BillingComponent } from "./billing/billing.component";


export const facilityRoutes: Routes = [
  {
    path: '',
    component: FacilityLayoutComponent, // <- Moved layout here
    children: [
      { path: "dashboard", component: FacilityDashboardComponent, canActivate: [AuthGuard] },
      { path: "facilities", component: FacilityListComponent },
      { path: "packages", component: PackageComponent },
      { path: "facilitators", component: FacilitatorComponent },
      { path: "enrollment", component: EnrollmentComponent },
      { path: "attendance", component: AttendanceComponent },
      { path: "post-activity", component: PostActivityComponent },
      { path: "billing", component: BillingComponent },
			{ path: "observations", loadComponent: () => import('./observations/observations.component').then(m => m.ObservationsComponent) },
    ]
  }
];
