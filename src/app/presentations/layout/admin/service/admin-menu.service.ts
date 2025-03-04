import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AdminMenuChangeEvent } from '../api/adminmenuchangeevent';

@Injectable({
    providedIn: 'root',
})
export class AdminMenuService {
    private menuSource = new Subject<AdminMenuChangeEvent>();
    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();
    resetSource$ = this.resetSource.asObservable();

    onMenuStateChange(event: AdminMenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.resetSource.next(true);
    }
}
