/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMasterCurrentHouseholdListingsComponent } from './admin-master-current-household-listings.component';

describe('AdminMasterCurrentHouseholdListingsComponent', () => {
  let component: AdminMasterCurrentHouseholdListingsComponent;
  let fixture: ComponentFixture<AdminMasterCurrentHouseholdListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMasterCurrentHouseholdListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMasterCurrentHouseholdListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
