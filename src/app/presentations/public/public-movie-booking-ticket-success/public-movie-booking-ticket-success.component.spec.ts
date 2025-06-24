/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PublicMovieBookingTicketSuccessComponent } from './public-movie-booking-ticket-success.component';

describe('PublicMovieBookingTicketSuccessComponent', () => {
  let component: PublicMovieBookingTicketSuccessComponent;
  let fixture: ComponentFixture<PublicMovieBookingTicketSuccessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicMovieBookingTicketSuccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicMovieBookingTicketSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
