import { Hospede } from '@/src/app/interfaces/hospede';
import { ApiService } from '@/src/app/services/api.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hospedes',
  templateUrl: './hospedes.component.html',
  styleUrls: ['./hospedes.component.scss']
})
export class HospedesComponent implements OnInit {

hospedes: Hospede[] = [];
displayedColumns: string[] = ['id', 'name', 'email', 'phone', 'actions'];

constructor(
  private apiService: ApiService
) {

}

ngOnInit(): void {
  this.buscarHospedes()
}

buscarHospedes() {
  this.apiService.getHospedes().subscribe(
    (hospedes: Hospede[]) => {
      this.hospedes = hospedes;
      console.log(this.hospedes);
    },
    (error) => {
      console.error('Erro ao buscar hóspedes', error);
    }
  );
}

editHospedes(hospede: Hospede) {
  alert('Edit Hospede')
}

}
