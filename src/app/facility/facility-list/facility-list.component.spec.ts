import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityListComponent } from './facility-list.component';

describe('FacilityComponent', () => {
  let component: FacilityListComponent;
  let fixture: ComponentFixture<FacilityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilityListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
