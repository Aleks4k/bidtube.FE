import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GooglePasswordResetComponent } from './google-password-reset.component';

describe('GooglePasswordResetComponent', () => {
  let component: GooglePasswordResetComponent;
  let fixture: ComponentFixture<GooglePasswordResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GooglePasswordResetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GooglePasswordResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
