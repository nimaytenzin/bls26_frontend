import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilitySidebarComponent } from './facility-sidebar.component';

describe('FacilitySidebarComponent', () => {
  let component: FacilitySidebarComponent;
  let fixture: ComponentFixture<FacilitySidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilitySidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilitySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
