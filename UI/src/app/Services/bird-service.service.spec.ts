import { TestBed } from '@angular/core/testing';

import { BirdServiceService } from './bird-service.service';

describe('BirdServiceService', () => {
  let service: BirdServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BirdServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
