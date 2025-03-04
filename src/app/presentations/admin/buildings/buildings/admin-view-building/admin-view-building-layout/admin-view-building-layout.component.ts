import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AppRoutingModule } from 'src/app/app-routing.module';

@Component({
    selector: 'app-admin-view-building-layout',
    templateUrl: './admin-view-building-layout.component.html',
    styleUrls: ['./admin-view-building-layout.component.css'],
    imports: [RouterModule],
    standalone: true,
})
export class AdminViewBuildingLayoutComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
