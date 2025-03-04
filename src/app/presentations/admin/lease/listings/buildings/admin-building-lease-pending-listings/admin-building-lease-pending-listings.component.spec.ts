/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingLeasePendingListingsComponent } from './admin-building-lease-pending-listings.component';

describe('AdminBuildingLeasePendingListingsComponent', () => {
  let component: AdminBuildingLeasePendingListingsComponent;
  let fixture: ComponentFixture<AdminBuildingLeasePendingListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingLeasePendingListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingLeasePendingListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
