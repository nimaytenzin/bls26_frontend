/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminEnumerationAreaDataViewerComponent } from './admin-enumeration-area-data-viewer.component';

describe('AdminEnumerationAreaDataViewerComponent', () => {
  let component: AdminEnumerationAreaDataViewerComponent;
  let fixture: ComponentFixture<AdminEnumerationAreaDataViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminEnumerationAreaDataViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEnumerationAreaDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
