import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPaymentModalComponent } from './edit-payment-modal.component';

describe('EditPaymentModalComponent', () => {
  let component: EditPaymentModalComponent;
  let fixture: ComponentFixture<EditPaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPaymentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
