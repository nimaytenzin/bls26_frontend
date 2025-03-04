import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAddBuildingownershipComponent } from './admin-add-buildingownership.component';

describe('AdminAddBuildingownershipComponent', () => {
  let component: AdminAddBuildingownershipComponent;
  let fixture: ComponentFixture<AdminAddBuildingownershipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAddBuildingownershipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminAddBuildingownershipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
