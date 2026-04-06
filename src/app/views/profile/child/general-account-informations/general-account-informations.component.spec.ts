import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralAccountInformationsComponent } from './general-account-informations.component';

describe('GeneralAccountInformationsComponent', () => {
  let component: GeneralAccountInformationsComponent;
  let fixture: ComponentFixture<GeneralAccountInformationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralAccountInformationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeneralAccountInformationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
