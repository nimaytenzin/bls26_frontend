/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLeaseCreateEntryDamageItemModalComponent } from './admin-lease-create-entry-damage-item-modal.component';

describe('AdminLeaseCreateEntryDamageItemModalComponent', () => {
  let component: AdminLeaseCreateEntryDamageItemModalComponent;
  let fixture: ComponentFixture<AdminLeaseCreateEntryDamageItemModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLeaseCreateEntryDamageItemModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLeaseCreateEntryDamageItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
