import { BrowserModule } from '@angular/platform-browser'; // Needed for browser apps
import { NgModule } from '@angular/core'; // Required for @NgModule

import { AppRoutingModule } from './app-routing.module'; // if you're using routing
import { AuthRoutingModule } from './auth/auth-routing.module'; // if you're using routing for authentication
import { EccdLayoutModule } from './layout/eccd-layout/eccd-layout.module';

import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { SharedModule } from "./shared/shared.module";

@NgModule({
    declarations: [
      AppComponent,
      LandingComponent,

    ],
    imports: [
      BrowserModule,
      AppRoutingModule, // this must export RouterModule
      AuthRoutingModule, // this must export RouterModule
      EccdLayoutModule, // this must export RouterModule
      SharedModule,
    ],
    providers: [],
    // If you have any services, you can provide them here
    bootstrap: [AppComponent]
  })
  export class AppModule {}
  