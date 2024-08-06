import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { onSideNavChange, animateText, animateContenListItem, animateLogo } from '../animations/animations';
import { MobileCheckService } from '../services/mobile-check.service';
import { LoginService } from '../services/login.service';
import { ApiService } from '../services/api.service';

interface Page {
  link: string;
  name: string;
  icon: string;
  subPage?: Page[];
}

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  animations: [
    onSideNavChange,
    animateText,
    animateContenListItem,
    animateLogo,
  ],
})
export class NavigationComponent {
  isConf: boolean = false;
  isTransf: boolean = false;
  user: any;
  isMobile: boolean = false;
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  public pages: Page[] = []

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

    ngOnInit() {
      this.loadPages();
      // this.claimsUser();
      // const userId = this.loginService.getCurrentUserId();
      // if (userId !== null) {
      //   this.loginService.isAdmin(userId).subscribe(isAdmin => {
      //     if (isAdmin === true) {
      //       this.pages = [
      //         { name: 'Home', link: '/app/home', icon: 'home' },
      //         { name: 'Transferência', link: '/app/transferencia', icon: 'sync_alt' },
      //         { name: 'Conferência', link: '/app/conferencia', icon: 'list_alt' },
      //         { name: 'Usuários', link: '/app/users', icon: 'people' },
      //       ];
      //     } else {
      //       if (this.isConf === true && this.isTransf === false) {
      //         this.pages = [
      //           { name: 'Home', link: '/app/home', icon: 'home' },
      //           { name: 'Conferência', link: '/app/conferencia', icon: 'list_alt' },
      //         ];
      //       } else if (this.isConf === false && this.isTransf === true) {
      //         this.pages = [
      //           { name: 'Home', link: '/app/home', icon: 'home' },
      //           { name: 'Transferência', link: '/app/transferencia', icon: 'sync_alt' },
      //         ];
      //       } else if (this.isConf === false && this.isTransf === false) {
      //         this.pages = [
      //           { name: 'Home', link: '/app/home', icon: 'home' },
      //         ];
      //       } else {
      //         this.pages = [
      //           { name: 'Home', link: '/app/home', icon: 'home' },
      //           { name: 'Transferência', link: '/app/transferencia', icon: 'sync_alt' },
      //           { name: 'Conferência', link: '/app/conferencia', icon: 'list_alt' },
      //         ];
      //       }

      //     }
      //   });
      // } else {
      //   // Se o userId for null, o usuário não está autenticado, então pode definir as páginas como desejado
      //   this.pages = [
      //     { name: 'Home', link: '/app/home', icon: 'home' },
      //     { name: 'Transferência', link: '/app/transferencia', icon: 'sync_alt' },
      //     { name: 'Conferência', link: '/app/conferencia', icon: 'list_alt' },
      //   ];
      // }
      // if (userId) {
      //   // Chamar o método para buscar dados do usuário com o ID atual
      //   this.apiService.getUserComId(userId).subscribe(
      //     (response) => {
      //       // Atribuir os dados do usuário à variável user
      //       this.user = response.metadata.response;
      //     },
      //     (error) => {
      //       console.error('Erro ao buscar dados do usuário:', error);
      //       // Tratar o erro, se necessário
      //     }
      //   );
      // }
    }


  constructor(
    private mobileCheckService: MobileCheckService,
    private loginService: LoginService,
    private apiService: ApiService
  ) {

  }

  loadPages() {
    this.pages = [
      { name: 'Home', link: '/app/home', icon: 'home' },
      { name: 'Quartos', link: '/app/quartos', icon: 'hotel' },
      { name: 'Reservas', link: '/app/reservas', icon: 'access_time' },
      { name: 'Hóspedes', link: '/app/hospedes', icon: 'list_alt' }
    ];
  }

  claimsUser() {
    const userId = this.loginService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserMe().subscribe(
        (response: any) => {

          this.user = response.metadata.response;
          if (response && response.metadata && response.metadata.response && response.metadata.response.claims) {
            console.log('Dados do user: ', response.metadata.response)
            const claims = response.metadata.response.claims;
            const isAdmin = response.metadata.response.admin;

            if (isAdmin) {
              this.pages = [
                { name: 'Home', link: '/app/home', icon: 'home' },
                { name: 'Quartos', link: '/app/quartos', icon: 'sync_alt' },
                { name: 'Clientes', link: '/app/conferencia', icon: 'list_alt' },
                { name: 'Usuários', link: '/app/users', icon: 'people' }
              ];
            } else {
              this.pages = [
                { name: 'Home', link: '/app/home', icon: 'home' }
              ];

              claims.forEach((claim: any) => {
                if (claim.claimType === 'permissions') {
                  if (claim.claimValue === 'create') {
                    this.pages.push({ name: 'Quartos', link: '/app/quartos', icon: 'sync_alt' });
                  } else if (claim.claimValue === 'update') {
                    this.pages.push({ name: 'Quartos', link: '/app/conferencia', icon: 'list_alt' });
                  }
                }
              });
            }
          }
        },
        (error: any) => {
          console.error('Erro ao buscar informações do usuário:', error);
        }
      );
    } else {
      // Se o usuário não estiver autenticado, defina as páginas conforme necessário
      this.pages = [
        { name: 'Home', link: '/app/home', icon: 'home' },
        { name: 'Quartos', link: '/app/quartos', icon: 'sync_alt' },
        { name: 'Clientes', link: '/app/conferencia', icon: 'list_alt' }
      ];
    }
  }



  validateRuleForShowModule(pages: Page[]): Page[] {
    return pages;
  }

  isActive(link: string) {
    // Verificar se a URL começa com '/app/produtos'
    if (this.router.url.startsWith('/app/produtos')) {
      // Se começar com '/app/produtos', verificar se o link é para a página de Conferência
      return link === '/app/conferencia';
    } else {
      // Se não começar com '/app/produtos', continuar com a lógica original
      return this.router.url.includes(link);
    }
  }

}
