/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminDetailedViewLeaseAgreementComponent } from './admin-detailed-view-lease-agreement.component';

describe('AdminDetailedViewLeaseAgreementComponent', () => {
  let component: AdminDetailedViewLeaseAgreementComponent;
  let fixture: ComponentFixture<AdminDetailedViewLeaseAgreementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminDetailedViewLeaseAgreementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDetailedViewLeaseAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
