import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilitatorComponent } from './facilitator.component';

describe('FacilitatorComponent', () => {
  let component: FacilitatorComponent;
  let fixture: ComponentFixture<FacilitatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilitatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilitatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
