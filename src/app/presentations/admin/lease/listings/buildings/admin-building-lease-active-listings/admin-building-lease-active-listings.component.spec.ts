/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingLeaseActiveListingsComponent } from './admin-building-lease-active-listings.component';

describe('AdminBuildingLeaseActiveListingsComponent', () => {
  let component: AdminBuildingLeaseActiveListingsComponent;
  let fixture: ComponentFixture<AdminBuildingLeaseActiveListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingLeaseActiveListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingLeaseActiveListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
