/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminCreateUnitBankLinkageComponent } from './admin-create-unit-bank-linkage.component';

describe('AdminCreateUnitBankLinkageComponent', () => {
  let component: AdminCreateUnitBankLinkageComponent;
  let fixture: ComponentFixture<AdminCreateUnitBankLinkageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminCreateUnitBankLinkageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCreateUnitBankLinkageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
