import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMasterPackageComponent } from './admin-master-package.component';

describe('AdminMasterPackageComponent', () => {
  let component: AdminMasterPackageComponent;
  let fixture: ComponentFixture<AdminMasterPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMasterPackageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminMasterPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
