/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminSubAdminstrativeZoneDataViewerComponent } from './admin-sub-adminstrative-zone-data-viewer.component';

describe('AdminSubAdminstrativeZoneDataViewerComponent', () => {
  let component: AdminSubAdminstrativeZoneDataViewerComponent;
  let fixture: ComponentFixture<AdminSubAdminstrativeZoneDataViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminSubAdminstrativeZoneDataViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSubAdminstrativeZoneDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
