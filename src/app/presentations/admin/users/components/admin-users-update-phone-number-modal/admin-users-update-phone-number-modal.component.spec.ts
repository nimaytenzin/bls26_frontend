/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminUsersUpdatePhoneNumberModalComponent } from './admin-users-update-phone-number-modal.component';

describe('AdminUsersUpdatePhoneNumberModalComponent', () => {
  let component: AdminUsersUpdatePhoneNumberModalComponent;
  let fixture: ComponentFixture<AdminUsersUpdatePhoneNumberModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUsersUpdatePhoneNumberModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUsersUpdatePhoneNumberModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
