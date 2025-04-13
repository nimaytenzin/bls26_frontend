import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarEccdComponent } from './sidebar-eccd.component';

describe('SidebarEccdComponent', () => {
  let component: SidebarEccdComponent;
  let fixture: ComponentFixture<SidebarEccdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarEccdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarEccdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
