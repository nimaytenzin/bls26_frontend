import { TestBed } from '@angular/core/testing';

import { FacilityDataService } from './facility-data.service';

describe('FacilityDataService', () => {
  let service: FacilityDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacilityDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
