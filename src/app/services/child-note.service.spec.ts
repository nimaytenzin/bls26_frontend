import { TestBed } from '@angular/core/testing';

import { ChildNoteService } from './child-note.service';

describe('ChildNoteService', () => {
  let service: ChildNoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChildNoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
