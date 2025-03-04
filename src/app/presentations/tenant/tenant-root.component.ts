import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-tenant-root',
    templateUrl: './tenant-root.component.html',
    styleUrls: ['./tenant-root.component.scss'],
    standalone: true,
    imports: [RouterModule],
})
export class TenantRootComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
