import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GashetsComponent } from './gashets.component';

describe('GashetsComponent', () => {
  let component: GashetsComponent;
  let fixture: ComponentFixture<GashetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GashetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GashetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
