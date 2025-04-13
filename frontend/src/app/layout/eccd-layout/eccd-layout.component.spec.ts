import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccdLayoutComponent } from './eccd-layout.component';

describe('EccdLayoutComponent', () => {
  let component: EccdLayoutComponent;
  let fixture: ComponentFixture<EccdLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EccdLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EccdLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
