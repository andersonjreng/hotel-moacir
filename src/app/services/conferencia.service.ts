import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PeriodicElement } from '../modules/conferencia/conferencia.component';

@Injectable({
  providedIn: 'root'
})
export class ConferenciaService {
  private elementoSelecionadoSubject = new BehaviorSubject<PeriodicElement | null>(null);
  elementoSelecionado$ = this.elementoSelecionadoSubject.asObservable();

  constructor() { }

  transmitirElementoSelecionado(elemento: PeriodicElement) {
    this.elementoSelecionadoSubject.next(elemento);
  }
}
