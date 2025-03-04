/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminLeaseResolveDamageItemModalComponent } from './admin-lease-resolve-damage-item-modal.component';

describe('AdminLeaseResolveDamageItemModalComponent', () => {
  let component: AdminLeaseResolveDamageItemModalComponent;
  let fixture: ComponentFixture<AdminLeaseResolveDamageItemModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLeaseResolveDamageItemModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLeaseResolveDamageItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
