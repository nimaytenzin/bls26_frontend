import { BrowserModule } from '@angular/platform-browser'; // Needed for browser apps
import { NgModule } from '@angular/core'; // Required for @NgModule

/*Import other modules as needed*/
import { AppRoutingModule } from './app-routing.module'; // if you're using routing
import { AuthRoutingModule } from './auth/auth-routing.module'; // if you're using routing for authentication

/* Import the components for the different dashboards */
import { AppComponent } from './app.component'; // Adjust path if needed
import { ParentDashboardComponent } from './parent/dashboard/parent-dashboard/parent-dashboard.component';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard/admin-dashboard.component';
import { LandingComponent } from './landing/landing.component';
import { SharedModule } from "./shared/shared.module";
import { EccdModule } from './eccd/eccd.module';


@NgModule({
    declarations: [
        AppComponent,
        ParentDashboardComponent,
        AdminDashboardComponent,
        LandingComponent,

      ],
    imports: [
    BrowserModule,
    AppRoutingModule, // this must export RouterModule
    AuthRoutingModule, // this must export RouterModule
    SharedModule,
    EccdModule
],
    providers: [],
    // If you have any services, you can provide them here
    bootstrap: [AppComponent]
  })
  export class AppModule {}
  