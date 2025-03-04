/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminDashboardBroadcastSmsComponent } from './admin-dashboard-broadcast-sms.component';

describe('AdminDashboardBroadcastSmsComponent', () => {
  let component: AdminDashboardBroadcastSmsComponent;
  let fixture: ComponentFixture<AdminDashboardBroadcastSmsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminDashboardBroadcastSmsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDashboardBroadcastSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
