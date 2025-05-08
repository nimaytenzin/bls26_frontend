import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementEventsComponent } from './announcement-events.component';

describe('AnnouncementEventsComponent', () => {
  let component: AnnouncementEventsComponent;
  let fixture: ComponentFixture<AnnouncementEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
