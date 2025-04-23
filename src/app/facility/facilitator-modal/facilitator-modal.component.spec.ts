import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilitatorModalComponent } from './facilitator-modal.component';

describe('FacilitatorModalComponent', () => {
  let component: FacilitatorModalComponent;
  let fixture: ComponentFixture<FacilitatorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilitatorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilitatorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
