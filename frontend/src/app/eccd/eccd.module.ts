import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { EccdRoutingModule } from "./eccd-routing.module";
import { EccdDashboardComponent } from "./eccd-dashboard/eccd-dashboard.component";

@NgModule({
    declarations: [EccdDashboardComponent],
    imports: [CommonModule, EccdRoutingModule],
})
export class EccdModule {}
// This module is responsible for the ECCD (Early Childhood Care and Development) dashboard.
