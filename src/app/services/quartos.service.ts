import { Injectable } from '@angular/core';
import { Produtos } from '../domain/interfaces/produtos';
import { Quartos } from '../interfaces/quartos';

@Injectable({
  providedIn: 'root'
})
export class QuartosService {

  quartos: Quartos[] = [
    // Primeiro andar
  {
    id: 101,
    status: 'Ocupado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 102,
    status: 'Usado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 103,
    status: 'Liberado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 104,
    status: 'Ocupado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 105,
    status: 'Liberado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 106,
    status: 'Usado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 107,
    status: 'Liberado',
    andar: 1,
    capacidade: 4,
    refrigerado: true
  },
  {
    id: 108,
    status: 'Liberado',
    andar: 1,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 109,
    status: 'Ocupado',
    andar: 1,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 110,
    status: 'Liberado',
    andar: 1,
    capacidade: 4,
    refrigerado: false
  },
  // Segundo andar
  {
    id: 202,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 203,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 204,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 205,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 206,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 207,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 208,
    status: 'Usado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 209,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 210,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 211,
    status: 'Ocupado',
    andar: 2,
    capacidade: 4,
    refrigerado: false
  },
  {
    id: 212,
    status: 'Liberado',
    andar: 2,
    capacidade: 4,
    refrigerado: true
  }

  ]


  constructor() { }

   // Método para retornar todos os produtos
   getQuartos(): Quartos[] {
    return this.quartos;
  }

  // Método para retornar um produto pelo ID
  getQuartosById(id: number): Quartos | undefined {
    return this.quartos.find(quarto => quarto.id === id);
  }

  buscarQuartoPorAndar(andar: number): Quartos[] {
    return this.quartos.filter(quarto => quarto.andar == andar);
  }

  adicionarQuarto(quarto: Quartos): void {
    // Verifica se o produto já existe pelo ID
    if (!this.quartos.find(p => p.id === quarto.id)) {
      // Adiciona o novo produto ao array
      this.quartos.push(quarto);
    } else {
      console.error('Erro: Já existe um quarto com o mesmo ID.');
    }
  }

}
