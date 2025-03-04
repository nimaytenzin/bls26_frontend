import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditBuildingownershipComponent } from './admin-edit-buildingownership.component';

describe('AdminEditBuildingownershipComponent', () => {
  let component: AdminEditBuildingownershipComponent;
  let fixture: ComponentFixture<AdminEditBuildingownershipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEditBuildingownershipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminEditBuildingownershipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
