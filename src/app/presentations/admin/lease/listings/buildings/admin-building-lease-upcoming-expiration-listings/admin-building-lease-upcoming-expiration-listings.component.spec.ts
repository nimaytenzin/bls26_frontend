/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingLeaseUpcomingExpirationListingsComponent } from './admin-building-lease-upcoming-expiration-listings.component';

describe('AdminBuildingLeaseUpcomingExpirationListingsComponent', () => {
  let component: AdminBuildingLeaseUpcomingExpirationListingsComponent;
  let fixture: ComponentFixture<AdminBuildingLeaseUpcomingExpirationListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingLeaseUpcomingExpirationListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingLeaseUpcomingExpirationListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
