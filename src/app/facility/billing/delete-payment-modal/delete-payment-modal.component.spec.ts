import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePaymentModalComponent } from './delete-payment-modal.component';

describe('DeletePaymentModalComponent', () => {
  let component: DeletePaymentModalComponent;
  let fixture: ComponentFixture<DeletePaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePaymentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
