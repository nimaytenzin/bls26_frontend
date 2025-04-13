import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarParentComponent } from './sidebar-parent.component';

describe('SidebarParentComponent', () => {
  let component: SidebarParentComponent;
  let fixture: ComponentFixture<SidebarParentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarParentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarParentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
