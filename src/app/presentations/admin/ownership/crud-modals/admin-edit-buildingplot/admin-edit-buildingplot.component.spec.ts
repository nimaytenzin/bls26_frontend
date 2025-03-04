import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditBuildingplotComponent } from './admin-edit-buildingplot.component';

describe('AdminEditBuildingplotComponent', () => {
  let component: AdminEditBuildingplotComponent;
  let fixture: ComponentFixture<AdminEditBuildingplotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEditBuildingplotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminEditBuildingplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
