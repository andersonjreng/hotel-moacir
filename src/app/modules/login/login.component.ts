import { Owner } from './../../domain/interfaces/owner';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MobileCheckService } from '../../services/mobile-check.service';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { ToastrService } from 'ngx-toastr';
import { timer } from 'rxjs';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  nomeUser: string = 'DAM Sistemas'
  isMobile: boolean = false;
  isLoading: boolean = false;
  visibility : boolean = false;
  forms! :FormGroup;
  empresasDoUsuario: Owner[] = [
    {
      id: '1',
      document: '15731070776',
      corporateName: 'DAM Sistemas e Tecnologia LTDA',
      fantasyName: 'DAM Sistemas',
      phone: '22999314699',
      inscricaoEstadual: '2837183172389',
      idLocal: 1,
      address: {
        city: 'Itaperuna',
        complement: 'Empresa',
        neighborhood: 'Cidade Nova',
        number: '255',
        postalCode: '28300000',
        state: 'RJ',
        street: 'Av Pres Franklin Roosevelt'
      },
    },
  ];
  selectedEmpresa!: Owner;

  constructor(
    private mobileCheckService: MobileCheckService,
    private route: Router,
    private loginService: LoginService,
    private toastr: ToastrService
  ) {

  }

  ngOnInit() {
    this.isMobile = this.mobileCheckService.getIsMobile();
    this.forms = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
      ], ),
      password: new FormControl('', [
        Validators.required,
      ]),
    });
  }

  visibilityPassword(){
    this.visibility = !this.visibility;
    if(this.visibility) {
      document.getElementById("password")!.setAttribute("type", "text");
    }else{
      document.getElementById("password")!.setAttribute("type", "password");
    }
  }

  get email(){
    return this.forms.get('email')!;
  }
  get password(){
    return this.forms.get('password')!;
  }

  cancelarLogin() {
    const modal = document.getElementById('card-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  confirmarLogin() {
    this.route.navigateByUrl('/app/home')
  }



  login(): void {
    if (this.forms.valid) {
      const email = this.forms.get('email')!.value;
      const password = this.forms.get('password')!.value;
      this.isLoading = true; // Define isLoading como true ao iniciar a solicitação

      this.loginService.postUserLogin({ email, password }).subscribe(
        (response) => {

          timer(2000).subscribe(() => {
            this.toastr.success('Login feito com sucesso!');
            this.route.navigateByUrl('/app/home');
          });

        },
        (error) => {
          timer(1000).subscribe(() => {
            this.isLoading = false;
            this.toastr.error( error?.error?.metadata?.response ?? 'Erro ao efetuar o login');
          });
        },
        () => {
          timer(2000).subscribe(() => {
            this.isLoading = false;
          });
        }
      );
    }
  }
}
