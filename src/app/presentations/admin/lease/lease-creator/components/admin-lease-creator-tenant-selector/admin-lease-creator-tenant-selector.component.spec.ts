/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLeaseCreatorTenantSelectorComponent } from './admin-lease-creator-tenant-selector.component';

describe('AdminLeaseCreatorTenantSelectorComponent', () => {
  let component: AdminLeaseCreatorTenantSelectorComponent;
  let fixture: ComponentFixture<AdminLeaseCreatorTenantSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLeaseCreatorTenantSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLeaseCreatorTenantSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
