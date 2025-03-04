/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OwnerRentalIncomeBreakdownComponent } from './owner-rental-income-breakdown.component';

describe('OwnerRentalIncomeBreakdownComponent', () => {
  let component: OwnerRentalIncomeBreakdownComponent;
  let fixture: ComponentFixture<OwnerRentalIncomeBreakdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OwnerRentalIncomeBreakdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OwnerRentalIncomeBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
