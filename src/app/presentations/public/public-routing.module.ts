import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PublicHomeComponent } from './public-home/public-home.component';
import { PublicLaunchSequenceComponent } from './public-launch-sequence/public-launch-sequence.component';

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
        ]),
    ],
    exports: [RouterModule],
})
export class PublicRoutingModule {}
