import { Hospede } from '@/src/app/interfaces/hospede';
import { Quartos } from '@/src/app/interfaces/quartos';
import { Reserva } from '@/src/app/interfaces/reserva';
import { ApiService } from '@/src/app/services/api.service';
import { QuartosService } from '@/src/app/services/quartos.service';
import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-quartos',
  templateUrl: './quartos.component.html',
  styleUrls: ['./quartos.component.scss']
})
export class QuartosComponent implements OnInit {

  quartoId!: any;
  statusQuarto: string = '';
  quartosDisponiveis!: Quartos[];
  numeroQuarto!: number;
  capacidadeQuarto!: number;
  andarQuarto!: number;
  refrigerado!: boolean;
  hospedesCadastros: Hospede[] = [];
  inicioReserva!: Date;
  fimReserva!: Date;
  hospedeId: any;
  numeroQuartoExclusao!: number;
  idQuartoExclusao!: number;


  constructor(
    private quartoService: QuartosService,
    private apiService: ApiService,
    private toastr: ToastrService
  ) {

  }

  ngOnInit() {
    this.buscarQuartos();
    this.buscarHospedes();
    const quartos = this.apiService.getQuartos()
    console.log(quartos)
  }

  criarQuarto() {
    const formData: Quartos = {
      numero: this.numeroQuarto,
      andar: this.andarQuarto,
      capacidade: this.capacidadeQuarto,
      refrigerado: this.refrigerado,
      status: "LIBERADO"
    };

    this.apiService.postQuartos(formData).subscribe(
      (quartos: Quartos[]) => {
        alert('Deu certo!');
        this.buscarQuartos();
        this.closeQuartoModal();
      },
      (error) => {
        console.error('Erro ao criar quarto', error);
      }
    );
  }
  
  buscarQuartos() {
    this.apiService.getQuartos().subscribe(
      (quartos: Quartos[]) => {
        this.quartosDisponiveis = quartos;
        console.log(this.quartosDisponiveis);
      },
      (error) => {
        console.error('Erro ao buscar quartos', error);
      }
    );
  }

  buscarHospedes() {
    this.apiService.getHospedes().subscribe(
      (hospedes: Hospede[]) => {
        this.hospedesCadastros = hospedes;
        console.log(this.hospedesCadastros);
      },
      (error) => {
        console.error('Erro ao buscar hospedes', error);
      }
    );
  }

  deleteQuarto() {
    this.apiService.deleteQuartoPorId(this.idQuartoExclusao).subscribe(
      (response) => {
        alert('Quarto deletado com sucesso!');
        this.buscarQuartos();
        this.closeReserveModal('confirmModal')
      },
      (error) => {
        console.error('Erro ao deletar quarto', error);
      }
    );
  }

  liberarQuarto(quarto: Quartos) {
    console.log(quarto)

    const dadosQuarto = {
      status: "USADO"
    };

    if (quarto.id) {
      this.apiService.putQuartos(dadosQuarto, quarto.id).subscribe(
        (quartos: Quartos[]) => {
          alert('Deu certo!');
          this.buscarQuartos();
        },
        (error) => {
          console.error('Erro ao editar quarto', error);
        }
      );
    }

    

  }

  limparQuarto(quarto: Quartos) {
    console.log(quarto)

    const dadosQuarto = {
      status: "LIBERADO"
    };

    if (quarto.id) {
      this.apiService.putQuartos(dadosQuarto, quarto.id).subscribe(
        (quartos: Quartos[]) => {
          alert('Deu certo!');
          this.buscarQuartos();
        },
        (error) => {
          console.error('Erro ao editar quarto', error);
        }
      );
    }
  }

  criarReserva() {
    console.log('Chamei criar reserva');
    
    // Formatar as datas no formato desejado (dd/mm/yyyy)
    const formattedInicio = format(this.inicioReserva, 'dd/MM/yyyy');
    const formattedFim = format(this.fimReserva, 'dd/MM/yyyy');
  
    const formData: any = {
      inicio: formattedInicio,
      fim: formattedFim,
      hospedeId: this.hospedeId,
      quartoId: this.quartoId
    };
  
    console.log(formData);
  
    this.apiService.postReserva(formData).subscribe(
      (reserva: Reserva[]) => {
        alert('Deu certo!');
        this.buscarQuartos();
        this.closeQuartoModal();
      },
      (error) => {
        console.error('Erro ao criar quarto', error.message);
        this.toastr.error(error.message)
      }
    );

    // const formData: any = {
    //   status: "OCUPADO"
    // }
    // this.apiService.putQuartos(formData, this.quartoId ).subscribe(
    //   (quarto: Quartos[]) => {
    //     this.buscarQuartos();
    //     this.closeReserveModal("reservaModal");
    //   }
    // )
  }

  openReserveModal(quartoId: any) {
    this.quartoId = quartoId;
    alert(this.quartoId)
    const modal = document.getElementById('reservaModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  openConfirmModal(quartoId: any, quartoNumero: any) {
    this.numeroQuartoExclusao = quartoNumero;
    this.idQuartoExclusao = quartoId;
    const modal = document.getElementById('confirmModal');
    if (modal) {
      modal.style.display = 'block';
    }

  }

  openQuartoModal() {
    
    const modal = document.getElementById('quartoModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeQuartoModal() {
    const modal = document.getElementById('quartoModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  closeReserveModal(modalName: any) {
    const modal = document.getElementById(modalName);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  openAgendarModal() {
    alert('Agendar reserva')
  }

  openLiberarQuarto() {
    alert('Desocupar quarto')
  }

}
