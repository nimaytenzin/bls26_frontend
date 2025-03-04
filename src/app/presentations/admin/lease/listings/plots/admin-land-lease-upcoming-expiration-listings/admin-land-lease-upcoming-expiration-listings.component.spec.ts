/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLandLeaseUpcomingExpirationListingsComponent } from './admin-land-lease-upcoming-expiration-listings.component';

describe('AdminLandLeaseUpcomingExpirationListingsComponent', () => {
  let component: AdminLandLeaseUpcomingExpirationListingsComponent;
  let fixture: ComponentFixture<AdminLandLeaseUpcomingExpirationListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLandLeaseUpcomingExpirationListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLandLeaseUpcomingExpirationListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
