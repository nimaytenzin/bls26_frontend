import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
  { path: '', component: LandingComponent }, // This is the path for the dashboard component
  { path: 'auth',
    loadChildren: () =>
    import('./auth/auth.module').then(m => m.AuthModule) },  // Lazy load it
  { path: 'parent',
    loadChildren: () =>
    import('./parent/parent.module').then(m => m.ParentModule) },  // Lazy load it
  { path: 'eccd',
    loadChildren: () =>
    import('./eccd/eccd.module').then(m => m.EccdModule) }  // Lazy load it
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule] // VERY IMPORTANT
})
export class AppRoutingModule { }
