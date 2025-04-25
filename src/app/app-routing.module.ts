import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { FacilityLayoutComponent } from './layout/facility-layout/facility-layout.component';

const routes: Routes = [

  {
    path: 'landing', 
    component: LandingComponent 
  },

  { path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },  // Lazy load it

  {
    path: '',
    loadChildren: () => import('./facility/facility.module').then(m => m.FacilityModule)
  },

  //{ path: '**', redirectTo: '' } // Redirect to the landing page for any unknown routes
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule] // VERY IMPORTANT
})
export class AppRoutingModule { }
