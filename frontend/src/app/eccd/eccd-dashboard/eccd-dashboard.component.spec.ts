import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccdDashboardComponent } from './eccd-dashboard.component';

describe('EccdDashboardComponent', () => {
  let component: EccdDashboardComponent;
  let fixture: ComponentFixture<EccdDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EccdDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EccdDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
