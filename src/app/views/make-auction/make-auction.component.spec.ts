import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeAuctionComponent } from './make-auction.component';

describe('MakeAuctionComponent', () => {
  let component: MakeAuctionComponent;
  let fixture: ComponentFixture<MakeAuctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeAuctionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MakeAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
