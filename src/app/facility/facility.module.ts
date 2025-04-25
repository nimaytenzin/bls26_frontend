import { NgModule} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { FacilityLayoutComponent } from "../layout/facility-layout/facility-layout.component";
import { FacilitySidebarComponent } from "../layout/facility-layout/facility-sidebar/facility-sidebar.component";
import { FacilityRoutingModule } from "./facility-routing.module";
import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from './attendance/attendance.component';
import { EnrollmentComponent } from './enrollment/enrollment.component';
import { EnrollmentService } from "../core/services/enrollment.service";
import { PackageComponent } from './packages/package.component';
import { FacilityListComponent } from './facility-list/facility-list.component';
import { FacilityModalComponent } from './facility-modal/facility-modal.component';
import { PackageModalComponent } from './package-modal/package-modal.component';
import { FacilitatorComponent } from './facilitator/facilitator.component';
import { FacilitatorModalComponent } from './facilitator-modal/facilitator-modal.component';
import { PostActivityComponent } from './post-activity/post-activity.component';
import { PostActivityModalComponent } from './post-activity-modal/post-activity-modal.component';
import { BillingComponent } from './billing/billing.component';


@NgModule({
    declarations: [
        FacilitySidebarComponent,
        FacilityLayoutComponent,
        FacilityDashboardComponent,
        AttendanceComponent,
        EnrollmentComponent,
				PackageComponent,
				FacilityListComponent,
				FacilityModalComponent,
    		PackageModalComponent,
        FacilitatorComponent,
        FacilitatorModalComponent,
        PostActivityComponent,
        PostActivityModalComponent,
        BillingComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
				HttpClientModule,
        FacilityRoutingModule,
				FormsModule
    ],

		providers: [
      EnrollmentService,
    ]
})
export class FacilityModule {}
