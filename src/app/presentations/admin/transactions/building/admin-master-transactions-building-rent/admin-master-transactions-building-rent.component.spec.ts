/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMasterTransactionsBuildingRentComponent } from './admin-master-transactions-building-rent.component';

describe('AdminMasterTransactionsBuildingRentComponent', () => {
  let component: AdminMasterTransactionsBuildingRentComponent;
  let fixture: ComponentFixture<AdminMasterTransactionsBuildingRentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMasterTransactionsBuildingRentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMasterTransactionsBuildingRentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
