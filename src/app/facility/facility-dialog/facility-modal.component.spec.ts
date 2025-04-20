import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityModalComponent } from './facility-modal.component';

describe('FacilityModalComponent', () => {
  let component: FacilityModalComponent;
  let fixture: ComponentFixture<FacilityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilityModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
