import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PrimeNGConfig } from 'primeng/api';
import { from } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    constructor(private primengConfig: PrimeNGConfig) {}

    ngOnInit() {
        this.primengConfig.ripple = true;
    }
}
