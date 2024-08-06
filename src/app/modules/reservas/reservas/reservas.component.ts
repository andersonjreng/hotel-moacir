import { Reserva } from '@/src/app/interfaces/reserva';
import { ApiService } from '@/src/app/services/api.service';
import { ReservasService } from '@/src/app/services/reservas.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.scss']
})
export class ReservasComponent implements OnInit {
  reservasQuartos!: Reserva[];
  // agendamentoForm: FormGroup;
  readonly agendamentoForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  
  

  constructor(
    private reservasService: ReservasService,
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    // this.agendamentoForm = this.fb.group({
    //   numeroQuarto: [''],
    //   andar: [''],
    //   dataInicio: [''],
    //   dataFim: ['']
    // });
  }

  ngOnInit(): void {
    this.buscarReservas()
  }

  buscarReservas() {
    this.apiService.getReservas().subscribe(
      (hospedes: Reserva[]) => {
        this.reservasQuartos = hospedes;
        console.log(this.reservasQuartos);
      },
      (error) => {
        console.error('Erro ao buscar hospedes', error);
      }
    );
  }

  openReserveModal() {

  }

  openAgendarModal() {

  }

  openLiberarQuarto() {

  }

  isToday(date: Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  }

}
