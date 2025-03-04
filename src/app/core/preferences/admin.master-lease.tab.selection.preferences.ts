import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AdminMasterLeaseTabPreferenceService {
    // Subjects for managing tab indices
    private adminUnitLeaseTabSelectionSubject = new BehaviorSubject<number>(0);
    private adminBuildingLeaseTabSelectionSubject = new BehaviorSubject<number>(
        0
    );
    private adminLandLeaseTabSelectionSubject = new BehaviorSubject<number>(0);

    // Observables for components to subscribe to
    public adminUnitLeaseSelectedTabIndex$ =
        this.adminUnitLeaseTabSelectionSubject.asObservable();
    public adminBuildingLeaseSelectedTabIndex$ =
        this.adminBuildingLeaseTabSelectionSubject.asObservable();
    public adminLandLeaseSelectedTabIndex$ =
        this.adminLandLeaseTabSelectionSubject.asObservable();

    constructor() {
        // Retrieve saved tab indices from localStorage
        const savedUnitLeaseTabIndex = localStorage.getItem(
            'adminUnitLeaseTabIndex'
        );
        const savedBuildingLeaseTabIndex = localStorage.getItem(
            'adminBuildingLeaseTabIndex'
        );
        const savedLandLeaseTabIndex = localStorage.getItem(
            'adminLandLeaseTabIndex'
        );

        if (savedUnitLeaseTabIndex !== null) {
            this.adminUnitLeaseTabSelectionSubject.next(
                parseInt(savedUnitLeaseTabIndex, 10)
            );
        }
        if (savedBuildingLeaseTabIndex !== null) {
            this.adminBuildingLeaseTabSelectionSubject.next(
                parseInt(savedBuildingLeaseTabIndex, 10)
            );
        }
        if (savedLandLeaseTabIndex !== null) {
            this.adminLandLeaseTabSelectionSubject.next(
                parseInt(savedLandLeaseTabIndex, 10)
            );
        }
    }

    // Update methods for unit lease
    updateAdminUnitLeaseSelectedTab(tabIndex: number): void {
        this.adminUnitLeaseTabSelectionSubject.next(tabIndex);
        localStorage.setItem('adminUnitLeaseTabIndex', tabIndex.toString());
    }

    // Update methods for building lease
    updateAdminBuildingLeaseSelectedTab(tabIndex: number): void {
        this.adminBuildingLeaseTabSelectionSubject.next(tabIndex);
        localStorage.setItem('adminBuildingLeaseTabIndex', tabIndex.toString());
    }

    // Update methods for land lease
    updateAdminLandLeaseSelectedTab(tabIndex: number): void {
        this.adminLandLeaseTabSelectionSubject.next(tabIndex);
        localStorage.setItem('adminLandLeaseTabIndex', tabIndex.toString());
    }

    // Getters for current values of selected tabs
    getAdminUnitLeaseSelectedTab(): number {
        return this.adminUnitLeaseTabSelectionSubject.value;
    }

    getAdminBuildingLeaseSelectedTab(): number {
        return this.adminBuildingLeaseTabSelectionSubject.value;
    }

    getAdminLandLeaseSelectedTab(): number {
        return this.adminLandLeaseTabSelectionSubject.value;
    }
}
