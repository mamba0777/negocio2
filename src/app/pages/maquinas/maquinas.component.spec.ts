import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaquinasComponent } from './maquinas.component';

describe('MaquinasComponent', () => {
  let component: MaquinasComponent;
  let fixture: ComponentFixture<MaquinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaquinasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaquinasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
