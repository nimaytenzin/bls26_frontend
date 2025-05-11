import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityLayoutComponent } from '../facility-layout.component';

describe('FacilityLayoutComponent', () => {
  let component: FacilityLayoutComponent;
  let fixture: ComponentFixture<FacilityLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilityLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
