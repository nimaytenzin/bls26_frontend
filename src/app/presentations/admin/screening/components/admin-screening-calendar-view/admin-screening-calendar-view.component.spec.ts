/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminScreeningCalendarViewComponent } from './admin-screening-calendar-view.component';

describe('AdminScreeningCalendarViewComponent', () => {
  let component: AdminScreeningCalendarViewComponent;
  let fixture: ComponentFixture<AdminScreeningCalendarViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminScreeningCalendarViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminScreeningCalendarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
