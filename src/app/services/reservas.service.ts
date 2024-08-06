import { Injectable } from '@angular/core';
import { Produtos } from '../domain/interfaces/produtos';
import { Quartos } from '../interfaces/quartos';
import { Reserva } from '../interfaces/reserva';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {

    reservas: Reserva[] = []


  constructor() { }

   // Método para retornar todos os produtos
   getReservas(): Reserva[] {
    return this.reservas;
  }

  // Método para retornar um produto pelo ID
  getReservaById(id: number): Reserva | undefined {
    return this.reservas.find(reserva => reserva.id === id);
  }

  // buscarReservaPorQuarto(quarto: number): Reserva[] {
  //   return this.reservas.filter(reserva => reserva.quarto == quarto);
  // }

  adicionarReserva(reserva: Reserva): void {
    // Verifica se o produto já existe pelo ID
    if (!this.reservas.find(p => p.id === reserva.id)) {
      // Adiciona o novo produto ao array
      this.reservas.push(reserva);
    } else {
      console.error('Erro: Já existe um quarto com o mesmo ID.');
    }
  }

}
