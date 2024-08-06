import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenciaComponent } from './modules/conferencia/conferencia.component';
import { TransferenciaComponent } from './modules/transferencia/transferencia.component';
import { LoginComponent } from './modules/login/login.component';
import { AdminComponent } from './modules/admin/admin.component';
import { ProdutosComponent } from './modules/conferencia/produtos/produtos.component';
import { HomeComponent } from './modules/home/home.component';
import { UsuariosComponent } from './modules/usuarios/usuarios.component';
import { AuthLoginGuard } from './auth/auth.login.guard';
import { AuthGuard } from './auth/auth.guard';
import { TransferenciasComponent } from './modules/transferencias/transferencias.component';
import { QuartosComponent } from './modules/quartos/quartos/quartos.component';
import { ReservasComponent } from './modules/reservas/reservas/reservas.component';
import { HospedesComponent } from './modules/hospedes/hospedes/hospedes.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [AuthLoginGuard],
  },
  {
    path: 'app',
    component: AdminComponent,
    // canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        component: HomeComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'quartos',
        component: QuartosComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'hospedes',
        component: HospedesComponent,
        // canActivate: [AuthGuard],
      },
      {
      path: 'reservas',
      component: ReservasComponent,
      // canActivate: [AuthGuard],
    },
      {
        path: 'conferencia',
        component: ConferenciaComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'produtos/:id',
        component: ProdutosComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'transferencia',
        component: TransferenciasComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'transferencia/:id',
        component: TransferenciaComponent,
        // canActivate: [AuthGuard],
      },
      {
        path: 'users',
        component: UsuariosComponent,
        // canActivate: [AuthGuard],
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'login',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
