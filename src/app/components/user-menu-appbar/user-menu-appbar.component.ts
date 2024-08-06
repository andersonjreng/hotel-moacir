import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, HostListener, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api.service';
import { MobileCheckService } from '../../services/mobile-check.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-menu-appbar',
  templateUrl: './user-menu-appbar.component.html',
  styleUrls: ['./user-menu-appbar.component.scss']
})
export class UserMenuAppbarComponent {
  private breakpointObserver = inject(BreakpointObserver);
  user: any = {
    useName: "Loading",
    email: "Loading...",
  };
  isMobile: boolean = false;
  formState!: FormGroup;
  errorMessage: string | null = null;
  hideSenha: boolean = true;
  hideNovaSenha: boolean = true;
  hideConfirmNovaSenha: boolean = true;

  constructor(
    private loginService: LoginService,
    private route: Router,
    private toastr: ToastrService,
    private apiService: ApiService,
    private mobileCheckService: MobileCheckService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.initForm()
    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });

    // Inicializa a variável isMobile com o valor do serviço
    this.isMobile = this.mobileCheckService.getIsMobile();
    const userId = this.loginService.getCurrentUserId();
    if (userId) {
      // Chamar o método para buscar dados do usuário com o ID atual
      this.apiService.getUserMe().subscribe(
        (response) => {
          // Atribuir os dados do usuário à variável user
          this.user = response.metadata.response;
        },
        (error) => {
          console.error('Erro ao buscar dados do usuário:', error);
          // Tratar o erro, se necessário
        }
      );
    }


  }

  @HostListener('window:resize')
  onResize() {
    // Atualiza a variável isMobile ao redimensionar a janela
    this.mobileCheckService.checkMobile();
  }

  toggleSenhaVisibility(): void {
    this.hideSenha = !this.hideSenha;
  }

  toggleNovaSenhaVisibility(): void {
    this.hideNovaSenha = !this.hideNovaSenha;
  }

  toggleConfirmNovaSenhaVisibility(): void {
    this.hideConfirmNovaSenha = !this.hideConfirmNovaSenha;
  }


  initForm(): void {
    this.formState = this.fb.group({
      senha: ['', Validators.required],
      novaSenha: ['', Validators.required],
      confirmacaoNovaSenha: ['', Validators.required]
    });
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
  .pipe(
    map(result => result.matches),
    shareReplay()
  );

  isMobileTemplate() {

  }

  logoutUser() {
    this.loginService.logout();
    this.route.navigateByUrl('/login');
    this.toastr.success('Usuário deslogado')
  }

  openModalPassword() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  changePassword() {
    const dados =
      {
        password: this.formState.value.senha,
        newPassword: this.formState.value.novaSenha,
        newPasswordConfirmation: this.formState.value.confirmacaoNovaSenha
      }

      this.apiService.changePasswordUserMe(dados).subscribe(
        (response) => {
          this.toastr.success('Senha alterada com sucesso!');
          this.closeModal();
          this.formState.reset();
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

}
