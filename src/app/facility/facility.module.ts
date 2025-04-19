import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { FacilityRoutingModule } from "./facility-routing.module";
import { FacilityDashboardComponent } from "./facility-dashboard/facility-dashboard.component";
import { AttendanceComponent } from './facilitators/attendance/attendance.component';
import { RegistrationComponent } from './registration/registration.component';
import { RegistrationService } from "./registration/registration.service";
import { PackageComponent } from './packages/package.component';


@NgModule({
    declarations: [
        FacilityDashboardComponent,
        AttendanceComponent,
        RegistrationComponent,
				PackageComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
				HttpClientModule,
        FacilityRoutingModule,
				FormsModule
    ],

		providers: [RegistrationService]
})
export class FacilityModule {}
