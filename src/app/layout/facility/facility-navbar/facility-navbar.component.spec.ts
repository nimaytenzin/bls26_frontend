import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityNavbarComponent } from './facility-navbar.component';

describe('FacilityNavbarComponent', () => {
  let component: FacilityNavbarComponent;
  let fixture: ComponentFixture<FacilityNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilityNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
