import { LoadComponent } from './../../components/load/load.component';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Company } from '../../domain/interfaces/company';
import { ItemTransfer, Produtos } from '../../domain/interfaces/produtos';
import { StockMovement, TransfMovement } from '../../domain/interfaces/stock';
import { ApiService } from '../../services/api.service';
import { MobileCheckService } from '../../services/mobile-check.service';
import { Component, ElementRef, HostListener, Injectable, Input, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Observer, catchError, of, map, forkJoin, startWith, debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import '@angular/localize/init';
import { LoginService } from '../../services/login.service';
import { MatTabGroup } from '@angular/material/tabs';
import { DatePipe, Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { InternalTransference, InternalTransferenceDTO } from '../../domain/interfaces/internal-transference';
import { Product, ProductDTO } from '../../domain/interfaces/product-model';


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

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Page 1 of 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Page ${page + 1} of ${amountPages}`;
  }
}

@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.scss']
})
export class TransferenciaComponent implements OnInit {
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
  selectedSearch: ProductDTO | null = null;
  observacaoMov: string = '';
  idSelected!: number;
  solicitanteSelected!: string | null;
  destinoSelected!: string | null;
  codeProd!: string | null;
  oldCode!: any | null;
  qtdProduct!: number | null;
  itensTransferenciaSelecionados: InternalTransferenceDTO[] = [];
  produtosEncontrados: Product[] = [];
  produtosEncontradosByName: ProductDTO[] = [];
  movimentacoes: TransfMovement[] = [];
  movimentacoesFiltradas: TransfMovement[] = [];
  solicitantesMov: Company[] = [];
  baseProdutos: ProductDTO[] = [];
  baseProduto: ProductDTO | null = null;
  asyncTabs!: Observable<boolean>;
  lengthTranfs!: number;
  pageAtual: number = 1;
  qtdPage: number = 12;
  searchKeyword: string = '';
  searchKeywordEan: string = '';
  tabIndices: { [label: string]: number } = {};
  selectedIndex: number = -1;
  pageSize: number = 20; // Tamanho da página inicial
  nextPage: number = 2; // Próxima página a ser carregada
  hasNext: boolean = true;
  pageNumber: number = 1; // Número da página inicial
  searchTimer: any; // Variável para armazenar o identificador do temporizador;
  filteredOptions!: Observable<Company[]>;
  filteredOptionsSearch!: Observable<ProductDTO[]>
  filteredOptionsDestino!: Observable<Company[]>;
  origemControl = new FormControl<string | Company>('');
  destinoControl = new FormControl<string | Company>('');
  searchControl = new FormControl<string | Produtos>('');

  idTransferencia: number | undefined;

  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild('searchProduto') searchProduto!: ElementRef;
  @ViewChild('searchQtde') searchQtde!: ElementRef;


  destinosMov: Company[] = this.solicitantesMov

  constructor(
    private toastr: ToastrService,
    private mobileCheckService: MobileCheckService,
    private apiService: ApiService,
    private activetedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private load: LoadComponent,
    private location: Location,
    private renderer: Renderer2,
  ) {
    this.asyncTabs = new Observable((observer: Observer<boolean>) => {
      return this.activetedRoute.params.subscribe((value) => {
        this.idTransferencia = Number(value['id']);
        this.buscarTransferenciaById(Number(value['id']), () => {
          observer.next(true);
        });
      })
    });
  }

  ngOnInit() {
    this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
      this.isMobile = isMobile;
    });
    this.isMobile = this.mobileCheckService.getIsMobile();
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

    this.filteredOptionsSearch = of([]);
    this.getCompaniesFromApi();
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

  @HostListener('window:resize')
  onResize() {
    // Atualiza a variável isMobile ao redimensionar a janela
    this.mobileCheckService.checkMobile();
  }

  onPageChange(event: any) {
    this.pageAtual = event.pageIndex + 1;
    this.qtdPage = event.pageSize;


    // Aqui você pode chamar o método HTTP com os valores atualizados
    //this.buscarTransferencias();
  }

  handleDateChange(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = event.value;
    this.applyFilter();
  }

  applyFilter(): void {
    // Chama a função buscarTransferencias() com os filtros atualizados
    //this.buscarTransferencias();
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
    //this.buscarTransferencias();
  }

  backToModal(idSelected: number, destinoSelected: string | null, solicitanteSelected: string | null, status: string | null) {
    this.modoEdicao = false;
    this.produtosEncontrados = [];
    this.qtdProduct = null;
    setTimeout(() => {
      this.renderer.selectRootElement(this.searchProduto.nativeElement).focus();
    }, 0);
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
        this.itensTransferenciaSelecionados = []; // Limpar a lista de produtos em caso de erro
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
        this.toastr.error('Transferência já enviada para conferência!');
      }

    } else {
      this.idSelected = idSelected;
      this.destinoSelected = destinoSelected;
      this.solicitanteSelected = solicitanteSelected;

      // Inicializar array para armazenar os itens de transferência
      let itensTransferencia: InternalTransferenceDTO[] = [];

      // Inicializar a variável para armazenar a soma dos preços
      let somaPrecos = 0;

      // Buscar a transferência com o ID selecionado
      this.apiService.getTransferComId(idSelected).subscribe(
        (response) => {
          if (response && response.metadata && response.metadata.response) {
            const transferencia = response.metadata.response;
            const itensTransferenciaAPI = transferencia.internalTransferItems;

            // Mapear os itens de transferência para criar os itens de transferência e calcular a soma dos preços
            itensTransferencia = itensTransferenciaAPI.map((item: any) => new InternalTransferenceDTO(item));

            // Atribuir os itens de transferência à variável produtoSelecionado para exibição no HTML
            this.itensTransferenciaSelecionados = itensTransferencia;

            // Verificar se existem produtos na transferência antes de atualizar o valor total
            if (itensTransferencia.length === 0) {
              this.totalTransf = 0;
              this.totalTransfFormat = 'R$ 0,00'; // ou qualquer formato de exibição desejado para quando não houver produtos
            } else {
              // Aqui você tem a soma dos preços considerando a quantidade
              somaPrecos = itensTransferencia.map(i => i.getTotal()).reduce((p, c) => p + c, 0);
              this.totalTransf = somaPrecos;
              this.totalTransfFormat = somaPrecos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
          }
        },
        (error) => {
          console.error('Erro ao buscar a transferência:', error);
          this.itensTransferenciaSelecionados = []; // Limpar a lista de produtos em caso de erro
        }
      );
    }
  }

  openModalDelete() {
    this.deleteMode = true;
    const modal = document.getElementById('card-modal-delete');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  openModalConfirma() {
    const modal = document.getElementById('card-modal-confirma-enviar');
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

  onKeydownMatAutocomplete(event: KeyboardEvent) {
    // Cancela o comportamento padrão para as teclas de seta
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }

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
              const items = response.metadata.response.items as Product[];
              const produtos = items.map((produto) => new ProductDTO(produto));
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
              const items = response.metadata.response.items as Product[];
              const produtos = items.map((produto) => new ProductDTO(produto));
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
    }, 500); // 1000 milissegundos = 1 segundo
  }

  loadMoreProducts(): void {
    this.pageNumber++; // Incrementa o número da página
    this.apiService.getProductByName(this.searchKeyword, this.pageNumber).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const items = response.metadata.response.items as Product[];
          const produtos = items.map((produto) => new ProductDTO(produto));
          this.produtosEncontradosByName.push(...produtos);
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

  onKeyDownQtde(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.gravarMovProd();
      event.preventDefault();
    }
  }

  buscarProdutoPorCodigo(product: Product) {
    this.produtosEncontrados = [product];
    this.readOnly = false;
  }

  optionSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedSolicitante = event.option.value;
  }

  optionSelectedDestino(event: MatAutocompleteSelectedEvent): void {
    this.selectedDestino = event.option.value;
  }

  displayFn(company: ProductDTO): string {
    return company && company.description ? company.description : '';
  }

  optionSearchAutocompleteEanName(event: MatAutocompleteSelectedEvent): void {
    var produtoSelected = (event.option.value as ProductDTO);
    if(this.selectedSearch != null && this.selectedSearch!.id == produtoSelected.id) {
      setTimeout(() => {
        this.renderer.selectRootElement(this.searchQtde.nativeElement).focus();
      }, 0);
      return;
    }
    this.codeProd = produtoSelected.ean;
    this.baseProduto = produtoSelected;
    this.selectedSearch = produtoSelected;
    setTimeout(() => {
      this.renderer.selectRootElement(this.searchQtde.nativeElement).focus();
    }, 0);
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
        const produtoSelecionado: ProductDTO | null = this.baseProduto
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

              const itemTransferData = {
                productId: produtoSelecionado.id, // Corrigido aqui
                internalTransferId: this.idSelected, // ID da transferência selecionada
                requestedQuantity: this.qtdProduct!,
                checkedQuantity: 0,
                quantity: this.qtdProduct!
              };
              this.somarValorTransf(produtoSelecionado.price);


              // Enviar os dados do item de transferência para a API
              this.apiService.postItemTransfer(itemTransferData).subscribe(
                (response) => {
                  setTimeout(() => {
                    this.renderer.selectRootElement(this.searchProduto.nativeElement).focus();
                  }, 0);
                  this.limparDados();
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

  sendTransferenceDialog(){
    try{
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '50%',
            data: {
              title: 'Confirmação',
              message: "Tem certeza que deseja enviar para transferência?\nEssa ação será irreversível.",
            },
          });

          dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                this.load.show("/assets/load.json");
                await this.apiService.putSendTransfer(this.idSelected).toPromise();
                this.toastr.success("Transferência enviada com sucesso.", 'Sucesso')
                this.load.hide();
                await new Promise((re) => setTimeout(()=>{ re("") }, 300));
                this.location.back();
            }
          });
    }catch(e: any){
        this.load.hide()
        this.toastr.error(e.toString(), 'Erro');
    }
  }

  backPage() {
    this.location.back();
  }

  sendTransferencia() {
    if (!this.itensTransferenciaSelecionados || this.itensTransferenciaSelecionados.length == 0) {
      this.toastr.error('Transferências sem itens não podem ser enviadas.', 'Erro');
      return;
    }

    // this.openModalConfirma();
    this.sendTransferenceDialog();
  }

  limparDados() {
    this.baseProduto = null;
    this.codeProd = null;
    this.qtdProduct = null;
    this.searchControl.reset();
    this.searchKeyword = '';
    this.selectedSearch = null;
    this.filteredOptionsSearch = of([]);
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

  //v2
  buscarTransferenciaById(idSelected: number, finalize: () => void) {
    var somaPrecos = 0;
    return this.apiService.getTransferComId(idSelected).subscribe(
      (response) => {
        somaPrecos = 0
        if (response && response.metadata && response.metadata.response) {
          const transferencia = response.metadata.response;
          const companyOrigin$ = this.getFantasyNameById(transferencia.originCompanyId);
          const companyDestiny$ = this.getFantasyNameById(transferencia.destinyCompanyId);
          // Combine os observables em um único observable que emite um objeto contendo os fantasyNames
          var fork = forkJoin({ companyOrigin: companyOrigin$, companyDestiny: companyDestiny$ }).pipe(
            map(({ companyOrigin, companyDestiny }) => ({
              id: transferencia.id,
              userId: transferencia.userId,
              dateMovement: transferencia.dateMovement,
              status: transferencia.status,
              observation: transferencia.observation,
              originCompanyId: transferencia.originCompanyId,
              destinyCompanyId: transferencia.destinyCompanyId,
              createdAt: String(transferencia.createdAt).includes("z") ? transferencia.createdAt : transferencia.createdAt + "z",
              companyOrigin,
              companyDestiny
            }))
          );

          fork.subscribe(
            (movimentacao: any) => {


              this.idSelected = idSelected;
              this.destinoSelected = movimentacao.companyDestiny;
              this.solicitanteSelected = movimentacao.companyOrigin;

              const itensTransferenciaAPI = transferencia.internalTransferItems as InternalTransference[];

              // Mapear os itens de transferência para criar os itens de transferência e calcular a soma dos preços
              var itensTransferencia = itensTransferenciaAPI.map((item: any) => new InternalTransferenceDTO(item));
              this.itensTransferenciaSelecionados = itensTransferencia;

              // Verificar se existem produtos na transferência antes de atualizar o valor total
              if (itensTransferencia.length === 0) {
                this.totalTransf = 0;
                this.totalTransfFormat = 'R$ 0,00'; // ou qualquer formato de exibição desejado para quando não houver produtos
              } else {
                // Aqui você tem a soma dos preços considerando a quantidade
                somaPrecos = itensTransferencia.map(i => i.getTotal()).reduce((p, c) => p + c, 0);
                this.totalTransf = somaPrecos;
                this.totalTransfFormat = somaPrecos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }

            },
            (error: any) => {
              console.error('Erro ao buscar fantasyNames:', error);
            }
          );
        }
        finalize();
      },
      (error) => {
        console.error('Erro ao buscar a transferência:', error);
        this.itensTransferenciaSelecionados = []; // Limpar a lista de produtos em caso de erro
        finalize();
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
          const indexProdutoEditar = this.itensTransferenciaSelecionados.findIndex(item => item.product.ean === this.codeProd?.toString());
          if (indexProdutoEditar !== -1) {
            // Atualizar a quantidade do produto
            this.itensTransferenciaSelecionados[indexProdutoEditar].requestedQuantity = novaQuantidade;

            const codeEan = this.itensTransferenciaSelecionados[indexProdutoEditar];

            // Buscar o item de transferência correspondente na API
            // Preparar os dados para atualização na API
            const dadosAtualizacao = {
              requestedQuantity: novaQuantidade,
              quantity: novaQuantidade,
            };

            // Chamar o método putItemTransferComId para atualizar o item de transferência na API
            this.apiService.putItemTransferComId(codeEan.id, dadosAtualizacao).subscribe(
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
    this.totalTransf = this.itensTransferenciaSelecionados.reduce((total, item) => {
      return total + (item.product.price * item.requestedQuantity);
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
        const indexProdutoRemover = this.itensTransferenciaSelecionados.findIndex(item => item.product.ean === this.codeProd?.toString());
        if (indexProdutoRemover !== -1) {
          const codeEan = this.itensTransferenciaSelecionados[indexProdutoRemover];

          // Buscar o item de transferência correspondente na API
          // Chamar o método deleteItemTransfer para remover o item de transferência na API
          this.apiService.deleteItemTransfer(codeEan.id).subscribe(
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
              //this.buscarTransferencias();
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

  editarProduto(item: InternalTransferenceDTO) {
    // Ajustar o código para ter 13 dígitos
    const codeStr = String(item.product.ean).padStart(13, '0');
    this.oldCode = codeStr

    this.codeProd = item.product.ean;
    this.qtdProduct = item.requestedQuantity;
    this.readOnly = true;
    this.modoEdicao = true;
    this.buscarProdutoPorCodigo(item.product);
  }

}
