import { Hospede } from "./hospede";
import { Quartos } from "./quartos";

export interface Reserva {

    id?: number;
    dataInicio: any;
    dataFim: any;
    hospede?: Hospede;
    quarto?: Quartos;
    hospedeId?: any;
    quartoId?: any



  }
  