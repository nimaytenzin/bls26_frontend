/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLeaseCreatorDetailedTermsComponent } from './admin-lease-creator-detailed-terms.component';

describe('AdminLeaseCreatorDetailedTermsComponent', () => {
  let component: AdminLeaseCreatorDetailedTermsComponent;
  let fixture: ComponentFixture<AdminLeaseCreatorDetailedTermsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLeaseCreatorDetailedTermsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLeaseCreatorDetailedTermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
