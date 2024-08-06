import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MobileCheckService } from '../../services/mobile-check.service';
import { Observable, fromEvent, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { MatStepper } from '@angular/material/stepper';

// Interface para representar um usuário
export interface User {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
}
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent {
  isLoading: boolean = true;
  isLoadingModal: boolean = true;
  transferenciaEnabled: boolean = false;
  conferenciaEnabled: boolean = false;
  permissionsLoaded: boolean = false;
  emailNovoUser: string = '';
  idNovoUser: any = '';
  idUser: string = '';
  editMode: boolean = false;
  errorMessage: string | null = null;
  formState!: FormGroup;
  formPassword!: FormGroup;
  dataSource = new MatTableDataSource<User>();
  isMobile: boolean = false;
  displayedColumns: string[] = ['name', 'email', 'phone', 'active', 'editBtn'];
  displayedColumnsMobile: string[] = ['name', 'active', 'editBtn'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('stepper') stepper!: MatStepper;
  registrationSuccess = false;
  infosacUsers$!: Observable<any>;
  filteredOptions!: any[];
  hideSenha: boolean = true;
  hideConfirmSenha: boolean = true;

  constructor(
    private mobileCheckService: MobileCheckService,
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    timer(1000).subscribe(() => {
      this.isLoading = false;
    });

    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });

    // Inicializa a variável isMobile com o valor do serviço
    this.isMobile = this.mobileCheckService.getIsMobile();
    // Simulando dados de usuários (substitua esta lógica com a obtenção real de dados)
    this.initForm();
    this.fetchUsers();

  }

  @HostListener('window:resize')
    onResize() {
      // Atualiza a variável isMobile ao redimensionar a janela
      this.mobileCheckService.checkMobile();
    }

  toggleSenhaVisibility(): void {
    this.hideSenha = !this.hideSenha;
  }

  toggleConfirmSenhaVisibility(): void {
    this.hideConfirmSenha = !this.hideConfirmSenha;
  }

  toggleActive(id: number, status: boolean): void {
    const dados = {};
    let successMessage = '';
    let errorMessage = '';

    if (status !== false) {
      this.apiService.putUserActivate(id, dados).subscribe(
        (response) => {
          // Verifica se a resposta da API foi bem-sucedida
          if (response && response.message === 'Ok') {
            // A resposta da API foi bem-sucedida
            console.log('Usuário ativado com sucesso:', response);
            this.toastr.success('Usuário ativado com sucesso!');
          } else {
            // Se a resposta da API não foi bem-sucedida, você pode lidar com isso aqui
            console.error('Erro ao ativar usuário:', response);
            // Define a mensagem de erro, se necessário
            this.toastr.error('Erro ao ativar usuário. Por favor, tente novamente mais tarde.');
          }
        },
        (error) => {
          console.error('Erro ao ativar usuário:', error);
          // Define a mensagem de erro, se necessário
          this.toastr.error('Erro ao ativar usuário. Por favor, tente novamente mais tarde.');
        }
      );
    } else {
      this.apiService.putUserDeactivate(id, dados).subscribe(
        (response) => {
          // Verifica se a resposta da API foi bem-sucedida
          if (response && response.message === 'Ok') {
            // A resposta da API foi bem-sucedida
            console.log('Usuário desativado com sucesso:', response);
            this.toastr.success('Usuário desativado com sucesso!');
          } else {
            // Se a resposta da API não foi bem-sucedida, você pode lidar com isso aqui
            console.error('Erro ao desativar usuário:', response);
            // Define a mensagem de erro, se necessário
            this.toastr.error('Erro ao desativar usuário. Por favor, tente novamente mais tarde.');
          }
        },
        (error) => {
          console.error('Erro ao desativar usuário:', error);
          // Define a mensagem de erro, se necessário
          this.toastr.error('Erro ao desativar usuário. Por favor, tente novamente mais tarde.');
        }
      );
    }

    // Exibe a mensagem de sucesso ou erro após a conclusão da chamada da API
    if (successMessage) {
      this.toastr.success(successMessage);
    } else if (errorMessage) {
      this.toastr.error(errorMessage);
    }
  }

  carregarPermissoes(): void {
    // Supondo que this.idNovoUser contém o ID do novo usuário
    this.apiService.getUserComId(this.idNovoUser).subscribe(
      response => {
        const claims = response.metadata.response.claims;

        // Resetar os valores das permissões
        this.transferenciaEnabled = false;
        this.conferenciaEnabled = false;

        console.log(claims)

        // Iterar sobre as reivindicações e definir as permissões correspondentes
        claims.forEach((claim: any) => {
          if (claim.claimType === 'permissions') {
            if (claim.claimValue === 'create') {
              this.transferenciaEnabled = true;
            } else if (claim.claimValue === 'update') {
              this.conferenciaEnabled = true;
            }
          }

        });
        this.permissionsLoaded = true;
      },
      error => {
        console.error('Erro ao carregar permissões do usuário:', error);
      }
    );
  }



  salvarPermissoes(): void {
    const dados = [];

    if (this.transferenciaEnabled) {
      dados.push({
        claimType: 'permissions',
        claimValue: 'create'
      });
    }

    if (this.conferenciaEnabled) {
      dados.push({
        claimType: 'permissions',
        claimValue: 'update'
      });
    }

    console.log(dados)

    this.apiService.putUserPermissions(this.idNovoUser, dados).subscribe(
      response => {
        console.log('Permissões salvas com sucesso:', response);
        this.toastr.success('Permissões salvas com sucesso!');
        this.closeEditModal();
        this.closeModal();
        this.idNovoUser = '';
        this.emailNovoUser = '';
      },
      error => {
        this.toastr.error('Erro ao salvar permissões')
        console.error('Erro ao salvar permissões:', error);
      }
    );
  }



  buscarUserIdPorEmail() {
    this.apiService.getUser().subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
        const idUser = response.metadata.response.items.find((user: any) => user.email === this.emailNovoUser);
        this.idNovoUser = idUser.id;
        this.carregarPermissoes()
        } else {
          console.error('Resposta da API não contém a lista de usuários esperada.');
        }
      })


  }

  buscarUserIdPorEmailTeste() {
    this.apiService.getUser().subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
        const idUser = response.metadata.response.items.find((user: any) => user.email === this.emailNovoUser);
        this.idNovoUser = idUser.id;
        this.carregarPermissoes()

        } else {
          console.error('Resposta da API não contém a lista de usuários esperada.');
        }
      })


  }

  fetchUsers(): void {
    this.apiService.getUser().subscribe(
      (response) => {
        // Verifica se a resposta contém a lista de usuários
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          // Atualiza a fonte de dados da tabela com os usuários obtidos da API
          this.dataSource.data = response.metadata.response.items;
        } else {
          console.error('Resposta da API não contém a lista de usuários esperada.');
        }
      },
      (error) => {
        console.error('Erro ao buscar os usuários da API:', error);
        // Define a mensagem de erro, se necessário
        this.errorMessage = 'Erro ao buscar os usuários. Por favor, tente novamente mais tarde.';
      }
    );
  }

  initForm(): void {
    this.formState = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      senha: ['', Validators.required],
      confirmacaoSenha: ['', Validators.required],
      permissao: ['', Validators.required],
      infosacUser: ['', Validators.required],
      novaSenha: ['', Validators.required],
      confirmacaoNovaSenha: ['', Validators.required]
    });
      this.formPassword = this.fb.group({
        novaSenha: ['', Validators.required],
        confirmacaoNovaSenha: ['', Validators.required]
      });
    this.getInfosacUsers();
  }

  applyFilterInfosac(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredOptions = (this.infosacUsers$ as any)?.metadata?.response?.items.filter((user: any) =>
      user.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn(user: any): string {
    return user && user.name ? `${user.id} - ${user.name}` : '';
  }


  getInfosacUsers(): void {
    this.infosacUsers$ = this.apiService.getInfosacUsers(10000);
  }

  // Método para facilitar o acesso aos campos do formulário no HTML
  get f() { return this.formState.controls, this.formPassword.controls; }

  onSubmit(): void {
    if (this.editMode === false) {
      const userData = {
        userName: this.formState.value.nome || '',
        email: this.formState.value.email || '',
        password: this.formState.value.senha || '',
        passwordConfirmation: this.formState.value.confirmacaoSenha || '',
        phoneNumber: this.formState.value.phone || '',
        active: true,
        InfosacUserId: this.formState.value.infosacUser || 0
      };

      console.log(userData)

      this.apiService.postUserRegister(userData).subscribe(
        (response) => {
          this.toastr.success('Usuário cadastrado com sucesso!');

          this.registrationSuccess = true;
          timer(2000).subscribe(() => {
            this.isLoadingModal = false;
          });
          this.emailNovoUser = this.formState.value.email;
          this.buscarUserIdPorEmail();
          this.formState.reset();
          this.fetchUsers();
          this.errorMessage = ''
        },
        (error: any) => {
          let errorMessage = 'Erro desconhecido'; // Mensagem padrão de erro

          // Verifica se error.error.metadata.response está definido
          if (error && error.error && error.error.metadata && error.error.metadata.response) {
            errorMessage = error.error.metadata.response;
          }

          // Exibir a mensagem de erro no HTML
          this.errorMessage = errorMessage;
        }
      );
    } else {
      const userEditData = {
        userName: this.formState.value.nome,
        email: this.formState.value.email,
        phoneNumber: this.formState.value.phone
      };

      this.apiService.putUserById(this.idUser, userEditData).subscribe(
        (response) => {
          console.log('Usuário editado com sucesso:', response);
          this.editMode = false;
          this.formState.reset();
          this.fetchUsers();
          this.toastr.success('Usuário alterado com sucesso');
          this.idUser = '';
          this.closeEditModal(); // Suponho que você tenha um método para fechar o modal
        },
        (error) => {
          let errorMessage = 'Erro desconhecido'; // Mensagem padrão de erro

          // Verifica se error.error.metadata.response está definido
          if (error && error.error && error.error.metadata && error.error.metadata.response) {
            errorMessage = error.error.metadata.response;
          }

          console.error('Erro ao editar usuário:', error);
          this.toastr.error(errorMessage);
        }
      );
    }
  }

  onSubmitPassword(): void {
      const userData = {
        newPassword: this.formPassword.value.novaSenha,
        newPasswordConfirmation: this.formPassword.value.confirmacaoNovaSenha
      };

      console.log(userData)

      this.apiService.changePasswordUser(this.idNovoUser, userData).subscribe(
        (response) => {
          this.toastr.success('Senha alterada com sucesso!');
          this.closeEditModal();
          this.formPassword.reset();
          this.fetchUsers();
          this.errorMessage = ''
        },
        (error: any) => {
          let errorMessage = 'Erro desconhecido'; // Mensagem padrão de erro

          // Verifica se error.error.metadata.response está definido
          if (error && error.error && error.error.metadata && error.error.metadata.response) {
            errorMessage = error.error.metadata.response;
          }

          // Exibir a mensagem de erro no HTML
          this.errorMessage = errorMessage;
        }
      );

  }

  // onSubmit() {
  //   alert('OnSubmit')
  //   this.toastr.success('Usuário cadastrado com sucesso!');
  //   this.registrationSuccess = true;
  //   this.stepper.next();

  // }


  // Função para editar um usuário
  editUser(user: User) {
    this.editMode = true;
    this.openEditModal(user.email);
    this.formState = this.fb.group({
      nome: [user.userName, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phoneNumber, Validators.required],
    });
    this.idUser = user.id


  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openModal() {
    this.formState.reset();
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  openEditModal(email: string) {
    const modal = document.getElementById('edit-modal');
    if (modal) {
      modal.style.display = 'block';
    }
      this.emailNovoUser = email;
      this.buscarUserIdPorEmail();
  }

  closeModal() {
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.editMode = false;
    this.formState.reset();
    this.errorMessage = '';
    this.hideSenha = true;
    this.hideConfirmSenha = true;
  }

  closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.editMode = false;
    this.errorMessage = '';
    this.hideSenha = true;
    this.hideConfirmSenha = true;
  }
}
