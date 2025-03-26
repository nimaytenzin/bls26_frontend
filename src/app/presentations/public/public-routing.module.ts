import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PublicHomeComponent } from './public-home/public-home.component';
import { PublicLaunchSequenceComponent } from './public-launch-sequence/public-launch-sequence.component';
import { LoginRoutingModule } from '../auth/login/login-routing.module';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: PublicHomeComponent,
            },
            {
                path: 'launch',
                component: PublicLaunchSequenceComponent,
            },
            {
                path: 'auth',
                loadChildren: () =>
                    import('../auth/auth-routing.module').then((m) => m.AuthRoutingModule),
            }
        ]),
    ],
    exports: [RouterModule],
})
export class PublicRoutingModule {}
