import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationModalComponent } from '../observation-modal/observation-modal.component';

describe('ObservationFormComponent', () => {
  let component: ObservationModalComponent;
  let fixture: ComponentFixture<ObservationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
