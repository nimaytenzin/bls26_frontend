/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLandLeasePendingListingsComponent } from './admin-land-lease-pending-listings.component';

describe('AdminLandLeasePendingListingsComponent', () => {
  let component: AdminLandLeasePendingListingsComponent;
  let fixture: ComponentFixture<AdminLandLeasePendingListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLandLeasePendingListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLandLeasePendingListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
