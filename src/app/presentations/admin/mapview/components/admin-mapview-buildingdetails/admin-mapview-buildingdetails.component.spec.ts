/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminMapviewBuildingdetailsComponent } from './admin-mapview-buildingdetails.component';

describe('AdminMapviewBuildingdetailsComponent', () => {
  let component: AdminMapviewBuildingdetailsComponent;
  let fixture: ComponentFixture<AdminMapviewBuildingdetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminMapviewBuildingdetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMapviewBuildingdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
