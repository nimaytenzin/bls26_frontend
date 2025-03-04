/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminUnitLeaseActiveListingsComponent } from './admin-unit-lease-active-listings.component';

describe('AdminUnitLeaseActiveListingsComponent', () => {
  let component: AdminUnitLeaseActiveListingsComponent;
  let fixture: ComponentFixture<AdminUnitLeaseActiveListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUnitLeaseActiveListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUnitLeaseActiveListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
