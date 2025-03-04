/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMasterTransactionsBuildingSecurityDepositsComponent } from './admin-master-transactions-building-security-deposits.component';

describe('AdminMasterTransactionsBuildingSecurityDepositsComponent', () => {
  let component: AdminMasterTransactionsBuildingSecurityDepositsComponent;
  let fixture: ComponentFixture<AdminMasterTransactionsBuildingSecurityDepositsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMasterTransactionsBuildingSecurityDepositsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMasterTransactionsBuildingSecurityDepositsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
