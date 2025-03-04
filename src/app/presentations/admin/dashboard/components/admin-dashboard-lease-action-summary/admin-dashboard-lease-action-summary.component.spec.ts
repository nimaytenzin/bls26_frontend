/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminDashboardLeaseActionSummaryComponent } from './admin-dashboard-lease-action-summary.component';

describe('AdminDashboardLeaseActionSummaryComponent', () => {
  let component: AdminDashboardLeaseActionSummaryComponent;
  let fixture: ComponentFixture<AdminDashboardLeaseActionSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminDashboardLeaseActionSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDashboardLeaseActionSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
