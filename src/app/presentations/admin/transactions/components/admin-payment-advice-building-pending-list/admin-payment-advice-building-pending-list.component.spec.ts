/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceBuildingPendingListComponent } from './admin-payment-advice-building-pending-list.component';

describe('AdminPaymentAdviceBuildingPendingListComponent', () => {
  let component: AdminPaymentAdviceBuildingPendingListComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceBuildingPendingListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceBuildingPendingListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceBuildingPendingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
