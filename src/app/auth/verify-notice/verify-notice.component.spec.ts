import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyNoticeComponent } from './verify-notice.component';

describe('VerifyNoticeComponent', () => {
  let component: VerifyNoticeComponent;
  let fixture: ComponentFixture<VerifyNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerifyNoticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
