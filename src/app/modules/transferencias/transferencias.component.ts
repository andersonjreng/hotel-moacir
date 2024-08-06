import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Company } from '../../domain/interfaces/company';
import { ItemTransfer, Produtos } from '../../domain/interfaces/produtos';
import { StockMovement, TransfMovement } from '../../domain/interfaces/stock';
import { ApiService } from '../../services/api.service';
import { MobileCheckService } from '../../services/mobile-check.service';
import { Component, ElementRef, HostListener, Injectable, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Observer, catchError, of, map, forkJoin, startWith, debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import '@angular/localize/init';
import { LoginService } from '../../services/login.service';
import { MatTabGroup } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { twMerge } from "tailwind-merge"


export interface ExampleTab {
  label: string;
}

@Injectable()
export class MyCustomPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  // For internationalization, the `$localize` function from
  // the `@angular/localize` package can be used.
  firstPageLabel = $localize`First page`;
  itemsPerPageLabel = $localize`Items por página:`;
  lastPageLabel = $localize`Last page`;

  // You can set labels to an arbitrary string too, or dynamically compute
  // it through other third-party internationalization libraries.
  nextPageLabel = 'Next page';
  previousPageLabel = 'Previous page';

  twM(...classLists: any[]) {
    return twMerge(classLists);
  }

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Page 1 of 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Page ${page + 1} of ${amountPages}`;
  }
}

@Component({
  selector: 'app-transferencias',
  templateUrl: './transferencias.component.html',
  styleUrls: ['./transferencias.component.scss']
})
export class TransferenciasComponent implements OnInit {
[x: string]: any;
  selectedTab: number = 0;
  isSelectedTabIniti: boolean = false;

  origemValues: { nome: string; ids: number[]; }[] = [];
  destinoValues: { nome: string; ids: number[]; }[] = [];
  selectedOrigem: string | null = null;
  selectedDestinoString: string | null = null;
  // selectedDestino: string | null = null;
  selectedDate: Date | null = null;
  exibirTransferenciasFechadas: boolean = false;
  idDelete!: number;
  deleteMode: boolean = false;
  totalTransf: number = 0;
  totalTransfFormat: string = '';
  isMobile: boolean = false;
  readOnly: boolean = false;
  modoEdicao: boolean = false;
  selectedSolicitanteId: number | null = null;
  selectedDestinoId: number | null = null;
  selectedOrigemId: number | null = null;
  selectedSolicitante: Company | null = null;
  selectedDestino: Company | null = null;
  selectedSearch: Produtos | null = null;
  observacaoMov: string = '';
  idSelected!: number;
  solicitanteSelected!: string | null;
  destinoSelected!: string | null;
  codeProd!: number | null;
  oldCode!: any | null;
  qtdProduct!: number | null;
  produtoSelecionado: ItemTransfer[] = [];
  produtosEncontrados: Produtos[] = [];
  produtosEncontradosByName: Produtos[] = [];
  movimentacoes: TransfMovement[] = [];
  movimentacoesFiltradas: TransfMovement[] = [];
  solicitantesMov: Company[] = [];
  baseProdutos: Produtos[] = [];
  baseProduto: Produtos | null = null;
  asyncTabs!: Observable<ExampleTab[]>;
  lengthTranfs!: number;
  pageAtual: number = 1;
  qtdPage: number = 12;
  searchKeyword: string = '';
  searchKeywordEan: string = '';
  searchKeywordName: string = '';
  tabIndices: { [label: string]: number } = {};
  selectedIndex: number = -1;
  pageSize: number = 20; // Tamanho da página inicial
  nextPage: number = 2; // Próxima página a ser carregada
  hasNext: boolean = true;
  pageNumber: number = 1; // Número da página inicial
  searchTimer: any; // Variável para armazenar o identificador do temporizador;
  filteredOptions!: Observable<Company[]>;
  filteredOptionsSearch!: Observable<Produtos[]>
  filteredOptionsDestino!: Observable<Company[]>;
  origemControl = new FormControl<string | Company>('');
  destinoControl = new FormControl<string | Company>('');
  searchControl = new FormControl<string | Produtos>('');

  @ViewChild('contentTemplateFirst') contentTemplateFirst!: TemplateRef<any>;
  @ViewChild('contentTemplateSecond') contentTemplateSecond!: TemplateRef<any>;
  @ViewChild('contentTemplateThird') contentTemplateThird!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild('firstListItem') firstListItem!: ElementRef;


  destinosMov: Company[] = this.solicitantesMov

  constructor(
    private toastr: ToastrService,
    private mobileCheckService: MobileCheckService,
    private apiService: ApiService,
    private loginService: LoginService,
    private datePipe: DatePipe,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.asyncTabs = new Observable((observer: Observer<ExampleTab[]>) => {
      setTimeout(() => {
        const tabs = [
          { label: 'Fazer transferência' },
          { label: 'Ver transferências' }
        ];

        // Popula o objeto de mapeamento
        tabs.forEach((tab, index) => {
          this.tabIndices[tab.label] = index;
        });

        observer.next(tabs);
      }, 1000);
    });
  }

  getContentTemplate(tab: ExampleTab): TemplateRef<any> {
    switch (tab.label) {
      case 'Fazer transferência':
        return this.contentTemplateFirst;
      case 'Ver transferências':
        return this.contentTemplateSecond;
      default:
        return this.contentTemplateFirst;
    }
  }

  ngOnInit() {
    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });

    // Inicializa a variável isMobile com o valor do serviço
    this.isMobile = this.mobileCheckService.getIsMobile();

    this.filteredOptionsSearch = of([]);

    this.filteredOptions = this.origemControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const baseDeDados = this.solicitantesMov
        const name = typeof value === 'string' ? value : value?.fantasyName;
        return name ? this._filter(name as string) : baseDeDados.slice();
      }),
    );

    this.filteredOptionsDestino = this.destinoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const baseDeDados = this.solicitantesMov
        const name = typeof value === 'string' ? value : value?.fantasyName;
        return name ? this._filterDestino(name as string) : baseDeDados.slice();
      }),
    );

    this.filteredOptionsSearch = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.nome;
        if (name && name.length >= 3) { // Verifica se o valor tem pelo menos 3 caracteres
          return [];
        } else {
          return this.baseProdutos.slice();
        }
      })
    );

    this.getCompaniesFromApi();
    this.buscarTransferencias();

    this.activatedRoute.queryParams.forEach(value => {
      if(this.isSelectedTabIniti == false && value) {
        this.selectedTab = Number(value['tab'] ?? "0");
        this.isSelectedTabIniti = true;
      }
    })
  }

  setTabState(tabId: number): void {
    this.selectedTab = tabId;
    this.router.navigate(
      [],
      {
        relativeTo: this.activatedRoute,
        queryParams: {tab: tabId},
        queryParamsHandling: "merge",
      });
  }

  displayFn(company: Company): string {
    return company && company.fantasyName ? company.fantasyName : '';
  }

  trackByFn(option: any): any {
    return option.fantasyName; // Substitua 'id' pelo identificador único de suas opções
  }


  private _filter(name: string): Company[] {
    const filterValue = name.toLowerCase();
    const baseDeDados = this.solicitantesMov
    return baseDeDados.filter(solicitantesMov => solicitantesMov.fantasyName!.toLowerCase().includes(filterValue));
  }

  private _filterDestino(name: string): Company[] {
    const filterValue = name.toLowerCase();
    const baseDeDados = this.solicitantesMov
    return baseDeDados.filter(solicitantesMov => solicitantesMov.fantasyName!.toLowerCase().includes(filterValue));
  }

  private _filterSearch(name: string): Produtos[] {
    const filterValue = name.toLowerCase();
    const baseDeDados = this.baseProdutos
    const returnFilter = baseDeDados.filter(solicitantesMov => solicitantesMov.nome!.toLowerCase().includes(filterValue));
    return returnFilter
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
    this.buscarTransferencias();
  }

  handleDateChange(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = event.value;
    this.applyFilter();
  }

  applyFilter(): void {
    // Chama a função buscarTransferencias() com os filtros atualizados
    this.buscarTransferencias();
  }

  getOrigemValues(): string[] {
    const origemMap = this.movimentacoes.reduce((map, movs) => {
      if (!map.has(movs.companyOrigin)) {
        map.set(movs.companyOrigin, [movs.originCompanyId]);
      } else {
        const ids = map.get(movs.companyOrigin);
        if (ids) {
          ids.push(movs.originCompanyId);
        }
      }
      return map;
    }, new Map<string, number[]>());

    // Retorna apenas as chaves do mapa (nomes de origem)
    return Array.from(origemMap.keys());
  }

  getDestinoValues(): string[] {
    const destinoMap = this.movimentacoes.reduce((map, movs) => {
      if (!map.has(movs.companyDestiny)) {
        map.set(movs.companyDestiny, [movs.destinyCompanyId]);
      } else {
        const ids = map.get(movs.companyDestiny);
        if (ids) {
          ids.push(movs.destinyCompanyId);
        }
      }
      return map;
    }, new Map<string, number[]>());

    // Retorna apenas as chaves do mapa (nomes de destino)
    return Array.from(destinoMap.keys());
  }



  clearFilters(): void {
    // Limpa os filtros e atualiza a lista de movimentações
    this.selectedOrigem = null;
    this.selectedDestinoString = null;
    this.selectedDate = null;
    this.selectedDestinoId = null;
    this.selectedOrigemId = null;
    this.buscarTransferencias();
  }







  backToModal(idSelected: number, destinoSelected: string | null, solicitanteSelected: string | null, status: string | null) {
    this.modoEdicao = false;
    this.openModal(idSelected, destinoSelected, solicitanteSelected, status);
  }

  openModalLastTransfer() {
    this.apiService.getLastTransfer().subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const transferencia = response.metadata.response.items[0];
          this.apiService.getCompaniesComId(transferencia.destinyCompanyId).subscribe(
            (response) => {
              if (response && response.metadata && response.metadata.response) {
                const empresa = response.metadata.response
                this.destinoSelected = empresa.fantasyName;
              }
            }, (error) => {
              console.error('Erro ao buscar empresas:', error);
            }
          );
          this.apiService.getCompaniesComId(transferencia.originCompanyId).subscribe(
            (response) => {
              if (response && response.metadata && response.metadata.response) {
                const empresa = response.metadata.response
                this.solicitanteSelected = empresa.fantasyName;
              }
            }, (error) => {
              console.error('Erro ao buscar empresas:', error);
            }
          );
          this.openModal(transferencia.id, this.destinoSelected, this.solicitanteSelected, transferencia.status)
        }
      },
      (error) => {
        console.error('Erro ao buscar a transferência:', error);
        this.produtoSelecionado = []; // Limpar a lista de produtos em caso de erro
      }
    );
  }

  openModal(idSelected: number, destinoSelected: string | null, solicitanteSelected: string | null, status: string | null) {
    if (status === "F" || status === "E" || this.deleteMode === true) {
      if (this.deleteMode) {
        // Aqui você pode adicionar a lógica específica para o modo de exclusão, se necessário
      } else if (status === "F") {
        this.toastr.error('Transferência já finalizada!');
      } else if (status === "E") {
        this.toastr.info('Transferência já enviada para conferência!');
      }

    } else {

      this.router.navigate(["app/transferencia/"+idSelected]);

      return;
      // const modal = document.getElementById('card-modal');
      // if (modal) {
      //   modal.style.display = 'block';
      // }

      // this.idSelected = idSelected;
      // this.destinoSelected = destinoSelected;
      // this.solicitanteSelected = solicitanteSelected;

      // // Inicializar array para armazenar os itens de transferência
      // let itensTransferencia: ItemTransfer[] = [];

      // // Inicializar a variável para armazenar a soma dos preços
      // let somaPrecos = 0;

      // // Buscar a transferência com o ID selecionado
      // this.apiService.getTransferComId(idSelected).subscribe(
      //   (response) => {
      //     if (response && response.metadata && response.metadata.response) {
      //       const transferencia = response.metadata.response;
      //       const itensTransferenciaAPI = transferencia.internalTransferItems;

      //       // Mapear os itens de transferência para criar os itens de transferência e calcular a soma dos preços
      //       itensTransferencia = itensTransferenciaAPI.map((item: any) => {
      //         // Calcular o valor total considerando a quantidade do produto
      //         const valorTotal = item.product.price * item.requestedQuantity;
      //         // Incrementar a soma dos preços
      //         somaPrecos += valorTotal;

      //         return {
      //           nome: item.product.description,
      //           qtd: item.requestedQuantity,
      //           code: item.product.ean,
      //           price: item.product.price,
      //           valorTotal: valorTotal, // Incluir o valor total no objeto do item de transferência
      //         };
      //       });

      //       // Atribuir os itens de transferência à variável produtoSelecionado para exibição no HTML
      //       this.produtoSelecionado = itensTransferencia;

      //       // Verificar se existem produtos na transferência antes de atualizar o valor total
      //       if (itensTransferencia.length === 0) {
      //         this.totalTransf = 0;
      //         this.totalTransfFormat = 'R$ 0,00'; // ou qualquer formato de exibição desejado para quando não houver produtos
      //       } else {
      //         // Aqui você tem a soma dos preços considerando a quantidade
      //         this.totalTransf = somaPrecos;
      //         this.totalTransfFormat = somaPrecos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      //       }
      //     }
      //   },
      //   (error) => {
      //     console.error('Erro ao buscar a transferência:', error);
      //     this.produtoSelecionado = []; // Limpar a lista de produtos em caso de erro
      //   }
      // );
    }
  }

  openModalDelete() {
    this.deleteMode = true;
    const modal = document.getElementById('card-modal-delete');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  openNameSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.produtosEncontradosByName = [];
    this.searchKeyword = ''
  }


  closeModalDelete() {
    this.deleteMode = false;
    const modal = document.getElementById('card-modal-delete');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  closeModal() {
    if (this.modoEdicao === true) {
      this.modoEdicao = false
      this.readOnly = false;
      this.totalTransfFormat = 'R$0,00';
      this.limparDados();
    }
    this.limparDados();
    this.produtosEncontrados = []
    const modal = document.getElementById('card-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  choseProduct(produto: any) {
    this.codeProd = produto.ean;
    this.baseProduto = produto;
    // this.closeSearchModal();
    // this.produtosEncontradosByName = [];
    // this.buscarProdutoPorCodigo();
  }

  //   searchProductByName(): void {
  //     clearTimeout(this.searchTimer); // Limpa o temporizador existente, se houver
  //     this.searchTimer = setTimeout(() => {
  //     this.apiService.getProductByName(this.searchKeyword, 1).subscribe(
  //       (response) => {
  //         if (response && response.metadata && response.metadata.response) {
  //           const items = response.metadata.response.items;
  //           this.baseProdutos = items.map((produto: any) => ({
  //             id: produto.id,
  //             nome: produto.description,
  //             qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
  //             code: produto.ean,
  //             ean: produto.ean,
  //             price: produto.price
  //           }));
  //           this.hasNext = response.metadata.response.hasNext; // Atualiza a flag hasNext
  //         } else {
  //           console.error('Resposta inválida ao buscar produto pelo nome:', response);
  //           this.baseProdutos = []; // Limpar a lista de produtos encontrados se a resposta não for válida
  //         }
  //       },
  //       (error) => {
  //         console.error('Erro ao buscar produto pelo nome:', error);
  //         this.baseProdutos = []; // Limpar a lista de produtos encontrados em caso de erro
  //       }
  //     );
  //   }, 1000); // 1000 milissegundos = 1 segundo
  // }

  containsOnlyLetters(input: string): boolean {
    // Expressão regular para verificar se o input contém apenas letras
    const alphabeticRegex = /^[a-zA-Z]*$/;
    return alphabeticRegex.test(input);
  }

  containsOnlyNumbers(input: string): boolean {
    // Expressão regular para verificar se o input contém apenas números
    const numericRegex = /^[0-9]*$/;
    return numericRegex.test(input);
  }

  containsBothLettersAndNumbers(input: string): boolean {
    // Expressão regular para verificar se o input contém tanto letras quanto números
    const alphanumericRegex = /[a-zA-Z]/.test(input) && /[0-9]/.test(input);
    return alphanumericRegex;
  }


  searchProductByName(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const pesquisaPorEan = this.containsOnlyNumbers(this.searchKeyword)
      if (pesquisaPorEan) {
        if (this.searchKeyword.length < 13) {
          const numberOfZerosToAdd = 13 - this.searchKeyword.length;
          const zeros = '0'.repeat(numberOfZerosToAdd)
          this.searchKeywordEan = zeros + this.searchKeyword
        }
        this.apiService.getProductComEan(this.searchKeywordEan).subscribe(
          (response) => {
            if (response && response.metadata && response.metadata.response) {
              const produto = response.metadata.response; // Acesso direto aos dados do produto
              const produtos = [{  // Criar uma lista com um único produto
                id: produto.id,
                nome: produto.description,
                qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
                code: produto.ean,
                ean: produto.ean,
                price: produto.price
              }];
              this.filteredOptionsSearch = of(produtos); // Atualiza a lista de opções com o produto obtido da API
            } else {
              console.error('Resposta inválida ao buscar produto pelo nome:', response);
              this.filteredOptionsSearch = of([]); // Limpar a lista de produtos encontrados se a resposta não for válida
            }
          },
          (error) => {
            console.error('Erro ao buscar produto pelo ean:', error);
            this.filteredOptionsSearch = of([]); // Limpar a lista de produtos encontrados em caso de erro
          }
        );

      } else {
        this.apiService.getProductByName(this.searchKeyword, 1).subscribe(
          (response) => {
            if (response && response.metadata && response.metadata.response) {
              const items = response.metadata.response.items;
              const produtos = items.map((produto: any) => ({
                id: produto.id,
                nome: produto.description,
                qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
                code: produto.ean,
                ean: produto.ean,
                price: produto.price
              }));
              this.filteredOptionsSearch = of(produtos); // Atualiza a lista de opções com os produtos obtidos da API
            } else {
              console.error('Resposta inválida ao buscar produto pelo nome:', response);
              this.filteredOptionsSearch = of([]); // Limpar a lista de produtos encontrados se a resposta não for válida
            }
          },
          (error) => {
            console.error('Erro ao buscar produto pelo nome:', error);
            this.filteredOptionsSearch = of([]); // Limpar a lista de produtos encontrados em caso de erro
          }
        );
      }
    }, 1000); // 1000 milissegundos = 1 segundo
  }


  loadMoreProducts(): void {
    this.pageNumber++; // Incrementa o número da página
    this.apiService.getProductByName(this.searchKeyword, this.pageNumber).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const items = response.metadata.response.items;
          this.produtosEncontradosByName.push(...items.map((produto: any) => ({
            id: produto.id,
            nome: produto.description,
            qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
            code: produto.ean,
            ean: produto.ean,
            price: produto.price
          })));
          this.hasNext = response.metadata.response.hasNext; // Atualiza a flag hasNext
        } else {
          console.error('Resposta inválida ao buscar mais produtos:', response);
        }
      },
      (error) => {
        console.error('Erro ao buscar mais produtos:', error);
      }
    );
  }



  hasMoreProducts(): boolean {
    return this.hasNext; // Retorna o valor da flag hasNext
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      event.preventDefault(); // Evita que a página role para cima quando a seta para cima é pressionada
    } else if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(this.produtosEncontradosByName.length - 1, this.selectedIndex + 1);
      event.preventDefault(); // Evita que a página role para baixo quando a seta para baixo é pressionada
    }
  }


  buscarTodosOsProdutos() {

    this.apiService.getProduct().subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const produto = response.metadata.response.items;
          const produtoEncontrado: Produtos = {
            id: produto.id,
            nome: produto.description,
            qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
            code: produto.id, // Corrigido aqui para usar o ID como código do produto
            ean: produto.ean,
            price: produto.price
          };
          this.produtosEncontrados = [produtoEncontrado];
        } else {
          console.error('Resposta inválida ao buscar produto pelo EAN:', response);
          this.produtosEncontrados = []; // Limpar a lista de produtos encontrados se a resposta não for válida
        }
      },
      (error) => {
        console.error('Erro ao buscar produto pelo EAN:', error);
        this.produtosEncontrados = []; // Limpar a lista de produtos encontrados em caso de erro
      }
    );
  }

  buscarProdutoPorCodigo() {
    if (this.codeProd) {
      this.apiService.getProductComEan(this.codeProd).subscribe(
        (response) => {
          if (response && response.metadata && response.metadata.response) {
            const produto = response.metadata.response;
            const produtoEncontrado: Produtos = {
              id: produto.id,
              nome: produto.description,
              qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
              code: produto.id, // Corrigido aqui para usar o ID como código do produto
              ean: produto.ean,
              price: produto.price
            };
            this.produtosEncontrados = [produtoEncontrado];
          } else {
            console.error('Resposta inválida ao buscar produto pelo EAN:', response);
            this.produtosEncontrados = []; // Limpar a lista de produtos encontrados se a resposta não for válida
          }
        },
        (error) => {
          console.error('Erro ao buscar produto pelo EAN:', error);
          this.produtosEncontrados = []; // Limpar a lista de produtos encontrados em caso de erro
        }
      );
    } else {
      this.produtosEncontrados = []; // Limpar a lista de produtos encontrados se o campo estiver vazio
    }
    this.readOnly = false;
  }


  gravarMov() {
    if (this.selectedSolicitante && this.selectedDestino) {
      const novaMovimentacao: StockMovement = {
        originCompanyId: this.selectedSolicitante.id,
        destinyCompanyId: this.selectedDestino.id,
        status: 'A',
        observation: this.observacaoMov
      };

      try {
        this.apiService.postTransfer(novaMovimentacao).subscribe(
          (response) => {
            this.toastr.success('Transferência gravada com sucesso!', 'Sucesso');
            this.buscarTransferencias();
            this.exibirTransferencias(this.selectedDestino, this.selectedSolicitante);
            this.openModalLastTransfer();
          },
          (error) => {
            console.error('Erro ao gravar transferência:', error);
            this.toastr.error(error.error.metadata.response);
          }
        );
      } catch (error) {
        console.error('Erro ao gravar transferência:', error);
        this.toastr.error('Ocorreu um erro ao gravar a transferência.', 'Erro');
      }

      // Limpeza dos campos após a gravação
      this.selectedSolicitante = null;
      this.selectedDestino = null;
      this.observacaoMov = '';
    } else {
      this.toastr.error('Por favor, selecione um solicitante e um destino.', 'Erro');
    }
  }

  optionSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedSolicitante = event.option.value;
  }

  optionSelectedDestino(event: MatAutocompleteSelectedEvent): void {
    this.selectedDestino = event.option.value;
  }

  optionSelectedSearch(event: MatAutocompleteSelectedEvent): void {
    this.selectedSearch = event.option.value;
    this.searchKeywordName = event.option.value.nome; // Atualiza o valor do input com o nome do produto selecionado
  }



  exibirTransferencias(idDestino: any, idSolicitante: any) {
    // Verifica se o MatTabGroup foi inicializado
    if (this.tabGroup) {
      // Obtém o índice da aba "Ver transferências" do objeto de mapeamento
      const index = this.tabIndices['Ver transferências'];

      // Define o índice da aba selecionada como "Ver transferências"
      if (index !== undefined) {
        this.tabGroup.selectedIndex = index;
      }
    } else {
    }

  }

  gravarMovProd() {
    if (this.codeProd && this.qtdProduct) {
      if (this.modoEdicao == true) {
        this.modoEdicao = false;
      } else {
        const produtoSelecionado: Produtos | null = this.baseProduto
        if (produtoSelecionado) {
          // Verificar se o produto já foi adicionado à transferência
          this.apiService.getTransferComId(this.idSelected).subscribe(
            (response) => {
              const itensTransferencia = response.metadata.response.internalTransferItems;
              const produtoJaAdicionado = itensTransferencia.some((item: any) => item.product.ean === produtoSelecionado.ean);
              if (produtoJaAdicionado) {
                this.toastr.error('Este produto já foi adicionado à transferência.', 'Erro');
                return;
              }

              produtoSelecionado.qtd = this.qtdProduct!;

              const itemTransferData = {
                productId: produtoSelecionado.code, // Corrigido aqui
                internalTransferId: this.idSelected, // ID da transferência selecionada
                status: "A",
                requestedQuantity: produtoSelecionado.qtd,
                checkedQuantity: 0,
                quantity: produtoSelecionado.qtd
              };
              this.somarValorTransf(produtoSelecionado.price);
              // Enviar os dados do item de transferência para a API
              this.apiService.postItemTransfer(itemTransferData).subscribe(
                (response) => {
                  this.limparDados();
                  this.searchProductByName();
                  this.toastr.success('Produto gravado com sucesso!', 'Sucesso');
                  const status = "A";
                  this.openModal(this.idSelected, this.destinoSelected, this.solicitanteSelected, status);
                },
                (error) => {
                  console.error('Erro ao adicionar produto à transferência:', error);
                  this.toastr.error('Erro ao gravar o produto.', 'Erro');
                }
              );
            },
            (error) => {
              console.error('Erro ao obter os itens da transferência:', error);
              this.toastr.error('Erro ao verificar os itens da transferência.', 'Erro');
            }
          );

        } else {
          this.toastr.error('Produto não encontrado.', 'Erro');
        }
      }
    } else {
      this.toastr.error('Por favor, preencha o código e a quantidade do produto.', 'Erro');
    }
  }

  sendTransferencia() {
    if (!this.produtoSelecionado || this.produtoSelecionado.length == 0) {
      this.toastr.error('Transferências sem itens não podem ser enviadas.', 'Erro');
      return;
    }

    this.apiService.putSendTransfer(this.idSelected).subscribe(
      () => {
        this.toastr.success("Transferência enviada com sucesso.", 'Sucesso')
        const index = this.movimentacoes.findIndex(m => m.id === this.idSelected)
        if (index !== -1) {
          this.movimentacoes[index].status = 'E'
        }

        this.closeModal()
      },
      (error) => {
        this.toastr.error(error.toString(), 'Erro');
      }
    )
  }

  limparDados() {
    this.baseProduto = null;
    this.codeProd = null;
    this.qtdProduct = null;
    this.searchControl.reset();
    this.searchKeywordName = '';
    this.searchKeyword = '';
    this.selectedSearch = null;
    this.searchProductByName();
  }


  somarValorTransf(price: number | undefined) {
    if (price) {
      let novoValor = price += this.totalTransf;
      this.totalTransf = novoValor;
      this.totalTransfFormat = this.totalTransf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  }

  getCompaniesFromApi(): void {
    this.apiService.getCompanies().subscribe(
      (response) => {
        // Verifique se a resposta contém uma lista de empresas
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          // Mapeie os dados da resposta para o array solicitantesMov
          this.solicitantesMov = response.metadata.response.items.map((empresa: any) => {
            return {
              id: empresa.id.toString(),
              document: empresa.document,
              corporateName: empresa.corporateName,
              fantasyName: empresa.fantasyName,
              phone: '', // Preencha com os dados necessários, se disponíveis
              idLocal: 0 // Preencha com os dados necessários, se disponíveis
            };
          });
          this.destinosMov = this.solicitantesMov
        } else {
          console.error('Resposta inválida da API');
        }
      },
      (error) => {
        console.error('Erro ao obter empresas da API:', error);
      }
    );
  }

  buscarTransferencias(): void {
    let status = 'A&status=E';
    if (this.exibirTransferenciasFechadas) {
      status = 'F';
    }

    const formattedDate = this.selectedDate ? this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') : '';
    // Atualiza os parâmetros de filtro
    const filters: any = {
      origem: this.selectedOrigemId || '',
      destino: this.selectedDestinoId || '',
      data: formattedDate || '',
    };

    // Chama a API com os filtros
    this.apiService.getTransferPageStatus(this.qtdPage, this.pageAtual, status, filters.data, filters.origem, filters.destino).subscribe(
      (response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items && response.metadata.response.totalCount !== 0) {
          // Lista de observables que irá buscar os fantasyNames
          const observables = response.metadata.response.items.map((item: any) => {
            const companyOrigin$ = this.getFantasyNameById(item.originCompanyId);
            const companyDestiny$ = this.getFantasyNameById(item.destinyCompanyId);
            // Combine os observables em um único observable que emite um objeto contendo os fantasyNames
            return forkJoin({ companyOrigin: companyOrigin$, companyDestiny: companyDestiny$ }).pipe(
              map(({ companyOrigin, companyDestiny }) => ({
                id: item.id,
                userId: item.userId,
                dateMovement: item.dateMovement,
                status: item.status,
                observation: item.observation,
                originCompanyId: item.originCompanyId,
                destinyCompanyId: item.destinyCompanyId,
                createdAt: String(item.createdAt).includes("z") ? item.createdAt : item.createdAt + "z",
                companyOrigin,
                companyDestiny
              }))
            );
          });

          // Aguarde até que todas as chamadas HTTP sejam concluídas
          forkJoin(observables).subscribe(
            (movimentacoes: any) => {
              this.movimentacoes = movimentacoes;
              this.lengthTranfs = response.metadata.response.totalCount;
            },
            (error: any) => {
              console.error('Erro ao buscar fantasyNames:', error);
            }
          );
        } else {
          this.movimentacoes = [];
          console.error('Resposta inválida:', response);
        }
      },
      (error: any) => {
        console.error('Erro ao buscar transferências:', error);
      }
    );
  }

  getFantasyNameById(id: number) {
    return this.apiService.getCompanies().pipe(
      map((response: any) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
          const company = response.metadata.response.items.find((item: any) => item.id === id);
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
    this.selectedOrigem = companyName;
    this.getCompanyIdByName(companyName).subscribe(
      (companyId: number | null) => {
        if (companyId !== null) {
          this.selectedOrigemId = companyId; // Armazena o ID da origem
          this.applyFilter()
        } else {
          console.error('Não foi possível encontrar o ID da empresa:', companyName);
        }
      }
    );
  }

  selectDestino(companyName: string) {
    this.selectedDestinoString = companyName;
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


  atualizarMovProd() {
    if (this.codeProd && this.qtdProduct) {
      const novaQuantidade = this.qtdProduct;

      if (this.modoEdicao) {
        if (novaQuantidade > 0) {
          const indexProdutoEditar = this.produtoSelecionado.findIndex(produto => produto.code === this.codeProd);
          if (indexProdutoEditar !== -1) {
            // Atualizar a quantidade do produto
            this.produtoSelecionado[indexProdutoEditar].qtd = novaQuantidade;

            const codeEan = this.produtoSelecionado[indexProdutoEditar].code;

            // Buscar o item de transferência correspondente na API
            this.apiService.getTransferComId(this.idSelected).subscribe(
              (response) => {
                if (response && response.metadata && response.metadata.response && response.metadata.response.internalTransferItems) {
                  const itensTransferencia = response.metadata.response.internalTransferItems;
                  const itemTransferencia = itensTransferencia.find((item: any) => item.product.ean === codeEan);
                  if (itemTransferencia) {
                    const itemTransferenciaId = itemTransferencia.id;

                    // Preparar os dados para atualização na API
                    const dadosAtualizacao = {
                      requestedQuantity: novaQuantidade,
                      quantity: novaQuantidade,
                    };

                    // Chamar o método putItemTransferComId para atualizar o item de transferência na API
                    this.apiService.putItemTransferComId(itemTransferenciaId, dadosAtualizacao).subscribe(
                      (response) => {
                        // Exibir mensagem de sucesso
                        this.toastr.success('Produto atualizado com sucesso!', 'Sucesso');
                        this.atualizarTotalTransf(); // Atualiza o valor total da transferência
                      },
                      (error) => {
                        console.error('Erro ao atualizar produto na transferência:', error);
                        // Exibir mensagem de erro
                        this.toastr.error('Erro ao atualizar produto na transferência.', 'Erro');
                      }
                    );
                  } else {
                    // Exibir mensagem de erro se o item de transferência não for encontrado
                    this.toastr.error('Item de transferência não encontrado.', 'Erro');
                  }
                } else {
                  // Exibir mensagem de erro se os itens de transferência não forem encontrados
                  this.toastr.error('Itens de transferência não encontrados.', 'Erro');
                }
              },
              (error) => {
                console.error('Erro ao buscar itens de transferência:', error);
                // Exibir mensagem de erro
                this.toastr.error('Erro ao buscar itens de transferência.', 'Erro');
              }
            );

          } else {
            // Exibir mensagem de erro se o produto não for encontrado
            this.toastr.error('Produto não encontrado para edição.', 'Erro');
          }

          // Reinicialize o modo de edição

        } else {
          this.toastr.error('Não é possível atualizar a quantidade igual ou menor que zero')
        }
      }
      else {
        // Exibir mensagem de erro
        this.toastr.error('Não é possível atualizar produto. Modo de edição não ativado.', 'Erro');
      }
      this.modoEdicao = false;
      // Limpar os campos de código e quantidade
      this.codeProd = null;
      this.qtdProduct = null;
      if (novaQuantidade < 1)
        this.backToModal(this.idSelected, this.destinoSelected, this.solicitanteSelected, "A");
    } else {
      // Exibir mensagem de erro
      this.toastr.error('Por favor, preencha o código e a quantidade do produto.', 'Erro');
    }
  }


  atualizarTotalTransf() {
    this.totalTransf = this.produtoSelecionado.reduce((total, produto) => {
      return total + (produto.price * produto.qtd);
    }, 0);
    this.totalTransfFormat = this.totalTransf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  deleteTransfer(id: number) {
    this.openModalDelete();
    this.idDelete = id;

  }

  deleteMovProd() {
    if (this.codeProd && this.qtdProduct) {
      if (this.modoEdicao) {
        const indexProdutoRemover = this.produtoSelecionado.findIndex(produto => produto.code === this.codeProd);
        if (indexProdutoRemover !== -1) {
          const codeEan = this.produtoSelecionado[indexProdutoRemover].code;

          // Buscar o item de transferência correspondente na API
          this.apiService.getItemTransferComTransferId(this.idSelected, codeEan).subscribe(
            (response) => {
              if (response && response.metadata && response.metadata.response && response.metadata.response.items && response.metadata.response.items.length > 0) {
                const itemTransferencia = response.metadata.response.items[0];

                // Obter o id do item de transferência
                const itemTransferenciaId = itemTransferencia.id;

                // Chamar o método deleteItemTransfer para remover o item de transferência na API
                this.apiService.deleteItemTransfer(itemTransferenciaId).subscribe(
                  (response) => {
                    // Exibir mensagem de sucesso
                    this.toastr.success('Produto removido com sucesso!', 'Sucesso');
                    this.openModal(this.idSelected, this.destinoSelected, this.solicitanteSelected, "A");
                    this.atualizarTotalTransf(); // Atualiza o valor total da transferência após a remoção
                  },
                  (error) => {
                    console.error('Erro ao remover produto da transferência:', error);
                    // Exibir mensagem de erro
                    this.toastr.error('Erro ao remover produto da transferência.', 'Erro');
                  }
                );
              } else {
                // Exibir mensagem de erro se o item de transferência não for encontrado
                this.toastr.error('Item de transferência não encontrado.', 'Erro');
              }
            },
            (error) => {
              console.error('Erro ao buscar item de transferência:', error);
              // Exibir mensagem de erro
              this.toastr.error('Erro ao buscar item de transferência.', 'Erro');
            }
          );

        } else {
          // Exibir mensagem de erro se o produto não for encontrado
          this.toastr.error('Produto não encontrado para remoção.', 'Erro');
        }

        // Reinicialize o modo de edição
        this.modoEdicao = false;
      } else {
        // Exibir mensagem de erro
        this.toastr.error('Não é possível remover produto. Modo de edição não ativado.', 'Erro');
      }

      // Limpar os campos de código e quantidade
      this.codeProd = null;
      this.qtdProduct = null;
    } else {
      // Exibir mensagem de erro
      this.toastr.error('Por favor, preencha o código e a quantidade do produto.', 'Erro');
    }
  }


  deleteMov(): void {
    // Verifica o status da transferência antes de deletar
    this.apiService.getTransferComId(this.idDelete).subscribe(
      (response) => {
        const status = response.metadata.response.status;

        if (status !== 'F') {
          // Status não é "F", então podemos deletar
          this.apiService.deleteTransfer(this.idDelete).subscribe(
            () => {
              this.toastr.success('Transferência deletada com sucesso.');
              this.closeModalDelete();
              this.buscarTransferencias();
            },
            (error) => {
              console.error('Erro ao deletar transferência:', error);
              this.toastr.error('Erro ao deletar transferência.')
            }
          );
        } else {
          this.toastr.error('A transferência já está fechada.');
          this.closeModalDelete();
        }
      },
      (error) => {
        console.error('Erro ao obter status da transferência:', error);
      }
    );
  }


  //   excluirProduto() {
  //     // Encontra o índice do produto no array produtoSelecionado que possui o campo code igual a this.codeProd
  //     const index = this.produtoSelecionado.findIndex(produto => produto.code === this.codeProd);

  //     // Verifica se o produto foi encontrado no array
  //     if (index !== -1) {
  //         // Remove o produto do array produtoSelecionado
  //         this.produtoSelecionado.splice(index, 1);
  //     }

  //     this.modoEdicao = false;
  //     this.readOnly = false;
  //     this.codeProd = null;
  //     this.qtdProduct = null;
  // }


  editarProduto(code: number, qtd: number) {
    // Ajustar o código para ter 13 dígitos
    const codeStr = String(code).padStart(13, '0');
    this.oldCode = codeStr

    // Chame o serviço de API para obter a transferência com o ID selecionado
    this.apiService.getTransferComId(this.idSelected).subscribe(
      (response) => {
        // Verifique se algum dos itens corresponde ao código fornecido
        const matchingItem = response.metadata.response.internalTransferItems.find((item: any) => {
          // Ajuste o código do produto para ter 13 dígitos antes de comparar
          const itemCodeStr = String(item.product.ean).padStart(13, '0');
          return itemCodeStr === codeStr;
        });

        if (matchingItem) {
          if (matchingItem.status === "C") {
            this.toastr.error('Produto cancelado!');
          } else if (matchingItem.status === "F") {
            this.toastr.error('Produto já conferido');
          } else {
            this.codeProd = code;
            this.qtdProduct = qtd;
            this.readOnly = true;
            this.modoEdicao = true;
            this.buscarProdutoPorCodigo();
          }
        } else {
          this.toastr.error('Produto não encontrado');
        }
      },
      (error) => {
        console.error('Erro ao buscar a transferência:', error);
      }
    );
  }

}
