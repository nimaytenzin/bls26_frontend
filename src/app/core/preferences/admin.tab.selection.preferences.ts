import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AdminTabPreferenceService {
    private adminViewBuildingTabIndexSubject = new BehaviorSubject<number>(0);

    private adminLeaseTabIndexSubject = new BehaviorSubject<number>(0);

    public adminViewBuildingSelectedTabIndex$ =
        this.adminViewBuildingTabIndexSubject.asObservable();

    public adminViewLeaseDetailedSelectedTabIndex$ =
        this.adminLeaseTabIndexSubject.asObservable();

    constructor() {
        const savedTabIndex = localStorage.getItem('adminViewBuildingTabIndex');
        const savedDetailedLeaseViewIndex = localStorage.getItem(
            'adminDetailedLeaseViewTabIndex'
        );
        if (savedTabIndex) {
            this.adminViewBuildingTabIndexSubject.next(parseInt(savedTabIndex));
        }
        if (savedDetailedLeaseViewIndex) {
            this.adminLeaseTabIndexSubject.next(
                parseInt(savedDetailedLeaseViewIndex)
            );
        }
    }

    updateAdminViewBuildingSelectedTab(tabIndex: number): void {
        this.adminViewBuildingTabIndexSubject.next(tabIndex);
        localStorage.setItem('adminViewBuildingTabIndex', tabIndex.toString());
    }

    updateAdminDetailedLeaseSelectedTab(tabIndex: number): void {
        this.adminLeaseTabIndexSubject.next(tabIndex);
        localStorage.setItem(
            'adminDetailedLeaseViewTabIndex',
            tabIndex.toString()
        );
    }

    getAdminViewBuildingSelectedTab(): number {
        return this.adminViewBuildingTabIndexSubject.value;
    }
    getAdminViewDetaiedleaseSelectedTab(): number {
        return this.adminLeaseTabIndexSubject.value;
    }
}
