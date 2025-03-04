/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMasterTransactionsLandSecurityDepositsComponent } from './admin-master-transactions-land-security-deposits.component';

describe('AdminMasterTransactionsLandSecurityDepositsComponent', () => {
  let component: AdminMasterTransactionsLandSecurityDepositsComponent;
  let fixture: ComponentFixture<AdminMasterTransactionsLandSecurityDepositsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMasterTransactionsLandSecurityDepositsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMasterTransactionsLandSecurityDepositsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
