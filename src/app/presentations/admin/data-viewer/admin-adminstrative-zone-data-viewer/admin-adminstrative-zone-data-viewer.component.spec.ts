/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminAdminstrativeZoneDataViewerComponent } from './admin-adminstrative-zone-data-viewer.component';

describe('AdminAdminstrativeZoneDataViewerComponent', () => {
  let component: AdminAdminstrativeZoneDataViewerComponent;
  let fixture: ComponentFixture<AdminAdminstrativeZoneDataViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminAdminstrativeZoneDataViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAdminstrativeZoneDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
