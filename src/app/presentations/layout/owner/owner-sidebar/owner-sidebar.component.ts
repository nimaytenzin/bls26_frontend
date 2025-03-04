import { Component, ElementRef, OnInit } from '@angular/core';
import { OwnerLayoutService } from '../service/owner-layout.service';
import { OWNERSIDEBARITEMS } from 'src/app/core/constants/sidebarmenu';

@Component({
    selector: 'app-owner-sidebar',
    templateUrl: './owner-sidebar.component.html',
    styleUrls: ['./owner-sidebar.component.scss'],
})
export class OwnerSidebarComponent implements OnInit {
    model: any[] = [];

    constructor(
        public layoutService: OwnerLayoutService,
        public el: ElementRef
    ) {}

    ngOnInit() {
        this.model = OWNERSIDEBARITEMS;
    }
}
