import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUnitDetailsCardComponent } from './admin-unit-details-card.component';

describe('AdminUnitDetailsCardComponent', () => {
  let component: AdminUnitDetailsCardComponent;
  let fixture: ComponentFixture<AdminUnitDetailsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUnitDetailsCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminUnitDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
