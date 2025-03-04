/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingUnitPaymentSheetComponent } from './admin-building-unit-payment-sheet.component';

describe('AdminBuildingUnitPaymentSheetComponent', () => {
  let component: AdminBuildingUnitPaymentSheetComponent;
  let fixture: ComponentFixture<AdminBuildingUnitPaymentSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingUnitPaymentSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingUnitPaymentSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
