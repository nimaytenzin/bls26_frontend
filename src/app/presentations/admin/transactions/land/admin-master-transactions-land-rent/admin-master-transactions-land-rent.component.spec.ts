/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMasterTransactionsLandRentComponent } from './admin-master-transactions-land-rent.component';

describe('AdminMasterTransactionsLandRentComponent', () => {
  let component: AdminMasterTransactionsLandRentComponent;
  let fixture: ComponentFixture<AdminMasterTransactionsLandRentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMasterTransactionsLandRentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMasterTransactionsLandRentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
