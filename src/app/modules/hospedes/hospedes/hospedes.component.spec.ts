import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospedesComponent } from './hospedes.component';

describe('HospedesComponent', () => {
  let component: HospedesComponent;
  let fixture: ComponentFixture<HospedesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HospedesComponent]
    });
    fixture = TestBed.createComponent(HospedesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
