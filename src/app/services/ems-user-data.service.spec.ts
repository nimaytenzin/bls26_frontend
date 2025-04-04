import { TestBed } from '@angular/core/testing';

import { EMSUserDataService} from './ems-user-data.service';

describe('ParentDataService', () => {
  let service: EMSUserDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EMSUserDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
