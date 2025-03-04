import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditUnitComponent } from './admin-edit-unit.component';

describe('AdminEditUnitComponent', () => {
  let component: AdminEditUnitComponent;
  let fixture: ComponentFixture<AdminEditUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEditUnitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminEditUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
