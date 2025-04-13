import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { EccdLayoutComponent } from './layout/eccd-layout/eccd-layout.component';

const routes: Routes = [
  { path: 'landing', component: LandingComponent }, // This is the path for the dashboard component

  { path: 'auth',
    loadChildren: () =>
    import('./auth/auth.module').then(m => m.AuthModule) },  // Lazy load it

  { path: 'parent',
    loadChildren: () =>
    import('./parent/parent.module').then(m => m.ParentModule) },  // Lazy load it

  {
    path: 'eccd',
    component: EccdLayoutComponent, // ✅ from layout
    children: [
      {
        path: '',
        loadChildren: () => import('./eccd/eccd.module').then(m => m.EccdModule)
      }
    ]
  }, // Lazy load it

  { path: '**', redirectTo: 'landing' } // Redirect to the landing page for any unknown routes
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule] // VERY IMPORTANT
})
export class AppRoutingModule { }
