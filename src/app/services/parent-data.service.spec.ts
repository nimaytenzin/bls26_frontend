import { TestBed } from '@angular/core/testing';

import { ParentDataService } from './parent-data.service';

describe('ParentDataService', () => {
  let service: ParentDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParentDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
