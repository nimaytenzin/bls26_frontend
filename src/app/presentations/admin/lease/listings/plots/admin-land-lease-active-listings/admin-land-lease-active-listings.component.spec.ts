/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLandLeaseActiveListingsComponent } from './admin-land-lease-active-listings.component';

describe('AdminLandLeaseActiveListingsComponent', () => {
  let component: AdminLandLeaseActiveListingsComponent;
  let fixture: ComponentFixture<AdminLandLeaseActiveListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLandLeaseActiveListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLandLeaseActiveListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
