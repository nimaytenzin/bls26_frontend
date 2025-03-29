import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateFacilityComponent } from './admin-create-facility.component';

describe('AdminCreateFacilityComponent', () => {
  let component: AdminCreateFacilityComponent;
  let fixture: ComponentFixture<AdminCreateFacilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateFacilityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminCreateFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
