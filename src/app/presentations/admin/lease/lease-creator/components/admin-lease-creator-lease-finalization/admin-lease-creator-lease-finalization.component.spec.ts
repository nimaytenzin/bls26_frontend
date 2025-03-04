/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLeaseCreatorLeaseFinalizationComponent } from './admin-lease-creator-lease-finalization.component';

describe('AdminLeaseCreatorLeaseFinalizationComponent', () => {
  let component: AdminLeaseCreatorLeaseFinalizationComponent;
  let fixture: ComponentFixture<AdminLeaseCreatorLeaseFinalizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLeaseCreatorLeaseFinalizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLeaseCreatorLeaseFinalizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
