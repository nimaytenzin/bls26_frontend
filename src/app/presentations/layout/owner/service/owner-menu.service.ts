import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface OwnerMenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class OwnerMenuService {
    private menuSource = new Subject<OwnerMenuChangeEvent>();
    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();
    resetSource$ = this.resetSource.asObservable();

    onMenuStateChange(event: OwnerMenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.resetSource.next(true);
    }
}
