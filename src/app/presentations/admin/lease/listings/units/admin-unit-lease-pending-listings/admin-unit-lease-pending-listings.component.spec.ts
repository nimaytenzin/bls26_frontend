/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminUnitLeasePendingListingsComponent } from './admin-unit-lease-pending-listings.component';

describe('AdminUnitLeasePendingListingsComponent', () => {
  let component: AdminUnitLeasePendingListingsComponent;
  let fixture: ComponentFixture<AdminUnitLeasePendingListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUnitLeasePendingListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUnitLeasePendingListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
