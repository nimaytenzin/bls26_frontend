/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminEditOrganiztionModalComponent } from './admin-edit-organization-modal.component';

describe('AdminEditOrganiztionModalComponent', () => {
    let component: AdminEditOrganiztionModalComponent;
    let fixture: ComponentFixture<AdminEditOrganiztionModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdminEditOrganiztionModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminEditOrganiztionModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
