import { Component, HostListener, Injectable, OnInit, ViewChild, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { catchError, map } from 'rxjs/operators';
import { ConferenciaService } from '../../services/conferencia.service';
import { Router } from '@angular/router';
import { MobileCheckService } from '../../services/mobile-check.service';
import { ApiService } from '../../services/api.service';
import { TransfMovement } from '../../domain/interfaces/stock';
import { Observable, forkJoin, of, timer } from 'rxjs';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import {MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {Subject} from 'rxjs';
import '@angular/localize/init';
import { DatePipe } from '@angular/common';

export interface PeriodicElement {
  origem: string;
  id: number;
  destino: string;
  dataCriada: Date;
  status: string;
}

@Injectable()
export class MyCustomPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = $localize`First page`;
  itemsPerPageLabel = $localize`Items por página:`;
  lastPageLabel = $localize`Last page`;
  nextPageLabel = 'Next page';
  previousPageLabel = 'Previous page';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Page 1 of 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Page ${page + 1} of ${amountPages}`;
  }
}

@Component({
  selector: 'app-conferencia',
  templateUrl: './conferencia.component.html',
  styleUrls: ['./conferencia.component.scss']
})
export class ConferenciaComponent implements OnInit {
  isLoading: boolean = false;
  isLoadingPage: boolean = true;
  exibirConf: boolean = false;
  ELEMENT_DATA: PeriodicElement[] = [];
  movimentacoes: TransfMovement[] = [];
  isMobile: boolean = false;
  selectedDate!: Date | null;
  selectedDateString: string = '';
  initialOrigemValues: string[] = [];
  selectedOrigem!: string;
  selectedOrigemId!: number;
  selectedDestinoId!: number;
  initialDestinoValues: string[] = [];
  selectedDestino!: string;
  displayedColumns: string[] = ['id', 'origem', 'destino', 'dataCriada', 'btnTable'];
  displayedColumnsMobile: string[] = ['id', 'origem', 'destino', 'dataCriada', 'btnTable'];
  dataSource = this.ELEMENT_DATA;
  styleCard: string = 'background: linear-gradient(to right, rgba(65, 105, 225, 0.8) 2%, white 2%, white)';
  lengthTranfs!: number;
  pageAtual: number = 1;
  qtdPage: number = 10;
  searchId: string = '';
  searchTimeout: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  constructor(
    private conferenciaService: ConferenciaService,
    private route: Router,
    private mobileCheckService: MobileCheckService,
    private apiService: ApiService,
    private breakpointObserver: BreakpointObserver,
    private datePipe: DatePipe,
  ) {}

  ngOnInit() {
    timer(1000).subscribe(() => {
      this.isLoadingPage = false;
    });

    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });

    // Inicializa a variável isMobile com o valor do serviço
    this.isMobile = this.mobileCheckService.getIsMobile();

    this.applyFilter();
  }

  @HostListener('window:resize')
  onResize() {
    // Atualiza a variável isMobile ao redimensionar a janela
    this.mobileCheckService.checkMobile();
  }


  onPageChange(event: any) {
    this.pageAtual = event.pageIndex + 1;
    this.qtdPage = event.pageSize;

    // Aqui você pode chamar o método HTTP com os valores atualizados
    this.applyFilter();
  }

  onSearchIdChange(searchValue: string) {
    // Limpa o timeout existente
    clearTimeout(this.searchTimeout);

    // Define um novo timeout para aguardar 1 segundo após a última entrada do usuário
    this.searchTimeout = setTimeout(() => {
      this.applyFilter();
    }, 1000);
  }

  private getOrigemValuesFromDataSource(): string[] {
    const origemValues = new Set<string>();
    this.dataSource.forEach(item => origemValues.add(item.origem));
    return Array.from(origemValues);
  }

  private getDestinoValuesFromDataSource(): string[] {
    const destinoValues = new Set<string>();
    this.dataSource.forEach(item => destinoValues.add(item.destino));
    return Array.from(destinoValues);
  }


  handleDateChange(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = event.value;
    this.applyFilter();
  }

  buscarTransferencias(filters: any): void {
    this.isLoading = true;
    console.log(filters);
      console.log('não tem id')
        // Se não houver um ID, continua com a lógica anterior para buscar transferências com base nos filtros
    this.apiService.getTransferPageStatus(this.qtdPage, this.pageAtual, filters.status, filters.data, filters.origem, filters.destino)
    .subscribe(
        (response: any) => {
            if (response && response.metadata && response.metadata.response && response.metadata.response.items && response.metadata.response.totalCount !== 0) {
                console.log(response)
                const transferencias = response.metadata.response.items;
                this.lengthTranfs = response.metadata.response.totalCount;

                // Lista de observables que irá buscar os nomes fantasia das empresas
                const observables = transferencias.map((transferencia: any) => {
                    const companyOrigin$ = this.getFantasyNameById(transferencia.originCompanyId);
                    const companyDestiny$ = this.getFantasyNameById(transferencia.destinyCompanyId);

                    // Combine os observables em um único observable que emite um objeto contendo os nomes fantasia das empresas
                    return forkJoin({ companyOrigin: companyOrigin$, companyDestiny: companyDestiny$ }).pipe(
                        map(({ companyOrigin, companyDestiny }) => ({
                            origem: companyOrigin,
                            id: transferencia.id,
                            destino: companyDestiny,
                            dataCriada: String(transferencia.createdAt).includes("z") ? transferencia.createdAt : transferencia.createdAt + "z",
                            status: transferencia.status
                        }))
                    );
                });

                // Aguarde até que todas as chamadas HTTP sejam concluídas
                forkJoin(observables).subscribe(
                    (transferenciasComNomes: any) => {
                        this.dataSource = transferenciasComNomes;
                    },
                    (error: any) => {
                        console.error('Erro ao buscar fantasyNames:', error);
                    }
                );
            } else {
                // Se a resposta não contiver itens, limpe a tabela atribuindo um array vazio a dataSource
                this.dataSource = [];
                console.error('Resposta inválida ou vazia:', response);
            }
            this.isLoading = false;
        },
        (error: any) => {
            console.error('Erro ao buscar transferências:', error);
            this.isLoading = false;
        }
    );

    // }
}

getFantasyNameById(id: number) {
    return this.apiService.getCompanies().pipe(
        map((response: any) => {
            if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
              const company = response.metadata.response.items.find((item: any) => item.id === id);
                console.log(company ? company.fantasyName : null)
                return company ? company.fantasyName : null;
            } else {
                throw new Error('Resposta inválida ao buscar fantasyName');
            }
        }),
        catchError((error: any) => {
            console.error('Erro ao buscar fantasyName:', error);
            return of(null);
        })
    );
}


getCompanyIdByName(companyName: string): Observable<number | null> {
  return this.apiService.getCompanies().pipe(
      map((response: any) => {
          if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
              const company = response.metadata.response.items.find((item: any) => item.fantasyName === companyName);
              return company ? company.id : null;
          } else {
              throw new Error('Resposta inválida ao buscar ID da empresa pelo nome');
          }
      }),
      catchError((error: any) => {
          console.error('Erro ao buscar ID da empresa pelo nome:', error);
          return of(null);
      })
  );
}

// Função para lidar com a seleção de origem pelo usuário
selectOrigem(companyName: string) {
  console.log('Chamei selectOrigem: ', companyName)
  this.selectedOrigem = companyName;
  console.log(this.selectedOrigem)
  this.getCompanyIdByName(companyName).subscribe(
    (companyId: number | null) => {
      if (companyId !== null) {
        console.log(companyId)
        this.selectedOrigemId = companyId; // Armazena o ID da origem
        this.applyFilter()
      } else {
        console.error('Não foi possível encontrar o ID da empresa:', companyName);
      }
    }
  );
}

selectDestino(companyName: string) {
  this.selectedDestino = companyName;
  this.getCompanyIdByName(companyName).subscribe(
    (companyId: number | null) => {
      if (companyId !== null) {
        this.selectedDestinoId = companyId; // Armazena o ID do destino
        this.applyFilter()
      } else {
        console.error('Não foi possível encontrar o ID da empresa:', companyName);
      }
    }
  );
}




applyFilter() {
  const formattedDate = this.selectedDate ? this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') : '';
  // Atualiza os parâmetros de filtro
  const filters = {
      origem: this.selectedOrigemId || '',
      destino: this.selectedDestinoId || '',
      data: formattedDate,
      status: this.exibirConf ? 'F' : 'E',
  };

  // Chama a função buscarTransferencias() com os filtros atualizados
  this.buscarTransferencias(filters);
}


  clearFilters() {
    this.selectedOrigem = '';
    this.selectedDestino = '';
    this.selectedDestinoId = 0;
    this.selectedOrigemId = 0;
    this.selectedDate = null;
    this.searchId = '';
    this.applyFilter();
  }

  getOrigemValues(): string[] {
    this.initialOrigemValues = this.getOrigemValuesFromDataSource();
    return this.initialOrigemValues;
  }

  getDestinoValues(): string[] {
    this.initialDestinoValues = this.getDestinoValuesFromDataSource();
    return this.initialDestinoValues;
  }

  goToCards(element: PeriodicElement) {
    this.conferenciaService.transmitirElementoSelecionado(element);
    this.route.navigateByUrl('app/produtos/' + element.id)
  }

  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Card 1', cols: 1, rows: 1 },
          { title: 'Card 2', cols: 1, rows: 1 },
          { title: 'Card 3', cols: 1, rows: 1 },
          { title: 'Card 4', cols: 1, rows: 1 }
        ];
      }

      return [
        { title: 'Card 1', cols: 2, rows: 1 },
        { title: 'Card 2', cols: 1, rows: 1 },
        { title: 'Card 3', cols: 1, rows: 2 },
        { title: 'Card 4', cols: 1, rows: 1 }
      ];
    })
  );
}
