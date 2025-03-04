/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminUnitLeaseUpcomingExpirationListingsComponent } from './admin-unit-lease-upcoming-expiration-listings.component';

describe('AdminUnitLeaseUpcomingExpirationListingsComponent', () => {
  let component: AdminUnitLeaseUpcomingExpirationListingsComponent;
  let fixture: ComponentFixture<AdminUnitLeaseUpcomingExpirationListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUnitLeaseUpcomingExpirationListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUnitLeaseUpcomingExpirationListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
