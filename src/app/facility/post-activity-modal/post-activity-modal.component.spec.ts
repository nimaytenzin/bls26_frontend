import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostActivityModalComponent } from './post-activity-modal.component';

describe('PostActivityModalComponent', () => {
  let component: PostActivityModalComponent;
  let fixture: ComponentFixture<PostActivityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostActivityModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostActivityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
