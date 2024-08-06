import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MobileCheckService } from '../../services/mobile-check.service';
import { Observable, timer } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { FormControl } from '@angular/forms';

interface Claim {
  claimType: string;
  claimValue: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  options: string[] = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4', 'Opção 5'];
  filteredOptions: string[] = this.options;
  myControl = new FormControl();


  user: any;
  isLoading: boolean = true;
  isMobile: boolean = false;
  ultimaTransf: string = '';
  ultimaConf: string = '';
  confPendentes: number = 0;
  confConcluidas: number = 0;
  produtosNaoConferidos: number = 0;
  usuariosAtivos: number = 0;
  usuariosInativos: number = 0;
  isAdmin!: boolean;
  isCreate!: boolean;
  isUpdate!: boolean;

  constructor(
    private mobileCheckService: MobileCheckService,
    private apiService: ApiService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    timer(1000).subscribe(() => {
      this.isLoading = false;
    });
    this.buscarDadosUser();
    this.isMobile = this.mobileCheckService.getIsMobile();
    this.buscarPrimeiraTransferencia();
    this.buscarTransferenciasPendentes();
    this.buscarProdutosNaoConferidos();
    this.buscarUsuariosAtivos();
    this.buscarUsuariosInativos();
    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });

    // Inicializa a variável isMobile com o valor do serviço
    this.isMobile = this.mobileCheckService.getIsMobile();
  }

  @HostListener('window:resize')
    onResize() {
      // Atualiza a variável isMobile ao redimensionar a janela
      this.mobileCheckService.checkMobile();
    }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filteredOptions = this.options.filter(option =>
      option.toLowerCase().includes(filterValue.toLowerCase())
    );
  }



  buscarDadosUser() {
    const userId = this.loginService.getCurrentUserId();
    if (userId) {
      // Chamar o método para buscar dados do usuário com o ID atual
      this.apiService.getUserMe().subscribe(
        (response) => {
          // Atribuir os dados do usuário à variável user
          this.user = response.metadata.response;
          this.isAdmin = response.metadata.response.admin;
          const claims: Claim[] = response.metadata.response.claims;
          this.isCreate = claims.some(item => item.claimValue === "create");
          this.isUpdate = claims.some(item => item.claimValue === "update");
          console.log('Create: ', this.isCreate)
          console.log('Update: ', this.isUpdate)
        },
        (error) => {
          console.error('Erro ao buscar dados do usuário:', error);
          // Tratar o erro, se necessário
        }
      );
    }
  }

  buscarUsuariosAtivos(): void {
    this.apiService.getUser().subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaUsuarios = response.metadata.response.items;
          this.usuariosAtivos = listaUsuarios.filter((usuario: any) => usuario.active === true).length;
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar usuários ativos:', error);
      }
    );
  }

  buscarUsuariosInativos(): void {
    this.apiService.getUser().subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaUsuarios = response.metadata.response.items;
          this.usuariosInativos = listaUsuarios.filter((usuario: any) => usuario.active === false).length;
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar usuários inativos:', error);
      }
    );
  }

  buscarPrimeiraTransferencia(): void {
    this.apiService.getTransfer().subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaTransferencias = response.metadata.response.items;
          if (listaTransferencias.length > 0) {
            const primeiraTransferencia = listaTransferencias[0]; // Acessa o primeiro elemento da lista
            this.ultimaTransf = new Date(primeiraTransferencia.createdAt).toLocaleDateString();
          }
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar primeira transferência:', error);
      }
    );
  }


  buscarTransferenciasPendentes(): void {
    this.apiService.getTransferByStatus("A").subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaTransferencias = response.metadata.response.count;
          this.confPendentes = listaTransferencias;
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar transferências pendentes:', error);
      }
    );

    this.apiService.getTransferByStatus("F").subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaTransferencias = response.metadata.response.count;
          this.confConcluidas = listaTransferencias;
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar transferências pendentes:', error);
      }
    );
  }

  buscarProdutosNaoConferidos(): void {
    this.apiService.getItemTransferByStatus("A").subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const listaItensTransferencia = response.metadata.response.count;
          this.produtosNaoConferidos = listaItensTransferencia;
        } else {
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar produtos não conferidos:', error);
      }
    );
  }
}
