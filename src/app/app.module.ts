import { BrowserModule } from '@angular/platform-browser'; // Needed for browser apps
import { NgModule } from '@angular/core'; // Required for @NgModule


import { AppRoutingModule } from './app-routing.module'; // if you're using routing
import { AuthRoutingModule } from './auth/auth-routing.module'; // if you're using routing for authentication
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { SharedModule } from "./shared/shared.module";
import { FacilityLayoutModule } from './layout/facility-layout/facility-layout.module';


@NgModule({
    declarations: [
      AppComponent,
      LandingComponent,
    ],
    imports: [
      BrowserModule,
			HttpClientModule,
      AppRoutingModule, // this must export RouterModule
      AuthRoutingModule, // this must export RouterModule
      FacilityLayoutModule, // this must export RouterModule
      SharedModule,
    ],
    providers: [],
    // If you have any services, you can provide them here
    bootstrap: [AppComponent]
  })
  export class AppModule {}
