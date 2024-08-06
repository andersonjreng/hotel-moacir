import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StyledPrimeNgModule } from './styled/prime-ng/prime-ng.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { ToastrModule } from 'ngx-toastr';
import { ToastNoAnimationModule } from "ngx-toastr";
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { AsyncPipe, CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationComponent } from './navigation/navigation.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConferenciaComponent } from './modules/conferencia/conferencia.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { UserMenuAppbarComponent } from './components/user-menu-appbar/user-menu-appbar.component';
import { TransferenciaComponent } from './modules/transferencia/transferencia.component';
import { LoginComponent } from './modules/login/login.component';
import { AdminComponent } from './modules/admin/admin.component';
import { MatTableModule } from '@angular/material/table';
import { ProdutosComponent } from './modules/conferencia/produtos/produtos.component';
import { HomeComponent } from './modules/home/home.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { Endpoints } from './endpoints';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsuariosComponent } from './modules/usuarios/usuarios.component';
import { MatTabsModule } from '@angular/material/tabs';
import {
  MatSlideToggleModule,
  _MatSlideToggleRequiredValidatorModule,
} from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MyCustomPaginatorIntl } from './modules/transferencia/transferencia.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { TransferenciasComponent } from './modules/transferencias/transferencias.component';
import { LoadComponent } from './components/load/load.component';
import player from 'lottie-web';
import { LottieModule } from 'ngx-lottie';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { QuartosComponent } from './modules/quartos/quartos/quartos.component';
import { ReservasComponent } from './modules/reservas/reservas/reservas.component';
import { HospedesComponent } from './modules/hospedes/hospedes/hospedes.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';


export function playerFactory() {
  return player;
}

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    ConferenciaComponent,
    UserMenuAppbarComponent,
    TransferenciasComponent,
    TransferenciaComponent,
    LoginComponent,
    AdminComponent,
    ProdutosComponent,
    HomeComponent,
    UsuariosComponent,
    LoadComponent,
    ConfirmationDialogComponent,
    QuartosComponent,
    ReservasComponent,
    HospedesComponent,
  ],
  imports: [
    BrowserModule,
    RouterOutlet,
    CommonModule,
    AppRoutingModule,
    LottieModule.forRoot({ player: playerFactory }),
    StyledPrimeNgModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatRadioModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatButtonModule,
    ToastrModule.forRoot(),
    ToastNoAnimationModule.forRoot(),
    NgxImageZoomModule,
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatTableModule,
    HttpClientModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    _MatSlideToggleRequiredValidatorModule,
    MatTabsModule,
    AsyncPipe,
    MatStepperModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatTableModule,
    MatButtonModule,
    NgxDaterangepickerMd.forRoot(),
    JsonPipe
  ],
  providers: [
    // firebaseProviders,
    LoadComponent,
    Endpoints,
    DatePipe,
    
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: MatPaginatorIntl, useClass: MyCustomPaginatorIntl },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'pt-BR'
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class AppModule {
}
