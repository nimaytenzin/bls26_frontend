import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EccdDashboardComponent } from "./eccd-dashboard/eccd-dashboard.component";

const routes: Routes = [
  { path: "dashboard", component: EccdDashboardComponent},
]

@NgModule({                     
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
    })

export class EccdRoutingModule { }