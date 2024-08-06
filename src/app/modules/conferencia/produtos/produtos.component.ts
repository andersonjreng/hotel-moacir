import { ConferenciaService } from '@/src/app/services/conferencia.service';
import { ChangeDetectorRef, Component, HostListener, Injectable, OnInit, ViewChild } from '@angular/core';
import { ProdutoEncontrado, Produtos, ProdutosRequest } from '@/src/app/domain/interfaces/produtos';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MobileCheckService } from '@/src/app/services/mobile-check.service';
import { ApiService } from '@/src/app/services/api.service';
import { ItemTransferencia, Transferencia } from '@/src/app/domain/interfaces/transferencia';
import { map } from 'jquery';
import { Observable, Subject, of, shareReplay } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { Company } from '@/src/app/domain/interfaces/company';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

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
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss']
})
export class ProdutosComponent implements OnInit {
  totalTransf: number = 0;
  totalTransfFormat: string = 'R$0,00';
  statusTransf: boolean = true;
  isLoading: boolean = false;
  isMobile: boolean = false;
  produtoSelecionado!: ProdutoEncontrado;
  idConf!: number;
  qtdProduct!: number;
  qtdProductOld!: number;
  codProduct!: number;
  nomeProduct!: string | undefined;
  codigoFiltro!: number;
  nomeFiltro!: string;
  produtosBase: Produtos[] = [];
  produtosFiltrados: ProdutoEncontrado[] = [];
  produtosEncontrados: Produtos[] = [];
  productsEncontrados: ProdutoEncontrado[] = [];
  allProducts: ProdutoEncontrado[] = [];
  itensTransferenciaEncontrados: ItemTransferencia[] = [];
  pageAtual: number = 1;
  qtdPage: number = 2;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  lengthProducts!: number;
  displayedColumns: string[] = ['id', 'description', 'preco', 'status', 'btnTable'];
  displayedColumnsMobile: string[] = ['description', 'preco', 'status', 'btnTable'];
  cardsView: boolean = true;
  searchControl = new FormControl<string | Produtos>('');
  searchKeyword: string = '';
  searchKeywordEan: string = '';
  searchKeywordName: string = '';
  filteredOptionsSearch!: Observable<Produtos[]>;
  searchTimer: any;
  selectedSearch: Produtos | null = null;
  baseProduto: Produtos | null = null;

  constructor(
    private conferenciaService: ConferenciaService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private mobileCheckService: MobileCheckService,
    private apiService: ApiService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private router: Router,
    ) { }

    ngOnInit() {

      this.mobileCheckService.isMobileChanged.subscribe((isMobile: boolean) => {
        this.isMobile = isMobile;
      });

      // Inicializa a variável isMobile com o valor do serviço
      this.isMobile = this.mobileCheckService.getIsMobile();
      this.searchProductByName();
      this.conferenciaService.elementoSelecionado$.subscribe(elemento => {
        if (elemento) {
          this.idConf = elemento.id;
        }
      });
      this.route.params.subscribe(params => {
        this.idConf = +params['id']; // Converte para número
        this.buscarDadosTransferencia(this.idConf);
      });
      this.checkStatus();
    }

    @HostListener('window:resize')
    onResize() {
      // Atualiza a variável isMobile ao redimensionar a janela
      this.mobileCheckService.checkMobile();
    }

    containsOnlyNumbers(input: string): boolean {
      // Expressão regular para verificar se o input contém apenas números
      const numericRegex = /^[0-9]*$/;
      return numericRegex.test(input);
    }

    searchProductByName(): void {
      console.log('Chamando searchProductByName');
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        const pesquisaPorEan = this.containsOnlyNumbers(this.searchKeyword)
        console.log(pesquisaPorEan)
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
                console.log(produtos);
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
            console.log('Chamando getProductByName');
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
              console.log(produtos)
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

    displayFn(company: Company): string {
      return company && company.fantasyName ? company.fantasyName : '';
    }

    optionSelectedSearch(event: MatAutocompleteSelectedEvent): void {
      this.selectedSearch = event.option.value;
      this.searchKeywordName = event.option.value.nome; // Atualiza o valor do input com o nome do produto selecionado
    }

    choseProduct(produto: any) {
      this.baseProduto = produto;
      console.log(this.baseProduto)
    }

    buscarDadosTransferencia(idConf: number) {
      this.isLoading = true;
      this.buscarProduto();
      this.isLoading = false;
    }

    onPageChange(event: any) {
      this.pageAtual = event.pageIndex + 1;
      this.qtdPage = event.pageSize;
      console.log('Página atual:', this.pageAtual);
      console.log('Quantidade por página:', this.qtdPage);
      this.buscarProduto();
    }

    buscarProduto() {
      console.log('Iniciando busca de produtos...');
      if (this.cardsView === false) {
        console.log('Página atual:', this.pageAtual);
        console.log('Quantidade por página:', this.qtdPage);
        this.productsEncontrados = [];
        this.isLoading = true;

        this.apiService.getItemTransferComTransferIdOnlyPage(this.idConf, this.qtdPage, this.pageAtual)
          .toPromise()
          .then((response: any) => {
            console.log('Resposta da API recebida:', response);
            if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
              const itensTransferencia = response.metadata.response.items;


              const productsPromiseArray = itensTransferencia.map((item: any) => {
                const productIdPadded = this.padLeft(item.product.ean, 13, '0');
                const description = item.product.description;
                const price = item.product.price;
                const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                const produtoEncontrado: ProdutoEncontrado = {
                  id: item.id,
                  productId: item.product.id,
                  ean: productIdPadded,
                  internalTransferId: item.internalTransferId,
                  status: item.status,
                  requestedQuantity: item.requestedQuantity,
                  checkedQuantity: item.checkedQuantity,
                  quantity: item.quantity,
                  description: description,
                  price: formattedPrice
                };

                // if (item.status !== "C") {
                //   this.somarValorTransf(item.quantity, price);
                // }

                return produtoEncontrado;
              });

              Promise.all(productsPromiseArray)
                .then((productsEncontrados: ProdutoEncontrado[]) => {
                  this.productsEncontrados = productsEncontrados;
                  this.lengthProducts = response.metadata.response.totalCount;
                  this.isLoading = false;
                  console.log(this.productsEncontrados)
                })
                .catch(error => {
                  console.error('Erro ao processar itens de transferência:', error);
                  this.toastr.error('Erro ao processar itens de transferência.', 'Erro');
                  this.isLoading = false;
                });
                console.log('Dados processados com sucesso. Atualizando produtos encontrados...');
              } else {
                console.log('Nenhum item encontrado na resposta da API.');
              this.toastr.error('Nenhum produto encontrado para esta transferência.', 'Erro');
              this.isLoading = false;
            }
          })
          .catch(error => {
            console.error('Erro ao buscar itens de transferência:', error);
            this.toastr.error('Erro ao buscar itens de transferência.', 'Erro');
            this.isLoading = false;
          });
      } else {

      this.productsEncontrados = [];
      this.isLoading = true;

      this.apiService.getTransferComId(this.idConf).subscribe(
        (response) => {
          if (response && response.metadata && response.metadata.response && response.metadata.response.internalTransferItems) {
            const itensTransferencia = response.metadata.response.internalTransferItems;

            itensTransferencia.forEach((item: any) => {
              const productIdPadded = this.padLeft(item.product.ean, 13, '0');
              const description = item.product.description;
              const price = item.product.price;
              const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

              const produtoEncontrado: ProdutoEncontrado = {
                id: item.id,
                productId: item.product.id,
                ean: productIdPadded,
                internalTransferId: item.internalTransferId,
                status: item.status,
                requestedQuantity: item.requestedQuantity,
                checkedQuantity: item.checkedQuantity,
                quantity: item.quantity,
                description: description,
                price: formattedPrice
              };

              // if (item.status !== "C") {
              //   this.somarValorTransf(item.quantity, price);
              // }

              this.productsEncontrados.push(produtoEncontrado);
            });

            this.isLoading = false;
            this.cdr.detectChanges();
          } else {
            this.toastr.error('Nenhum produto encontrado para esta transferência.', 'Erro');
          }
        },
        (error) => {
          console.error('Erro ao buscar itens de transferência:', error);
          this.toastr.error('Erro ao buscar itens de transferência.', 'Erro');
        }
      );
    }
  }

    // somarValorTransf(quantidade: number, price: number) {
    //   let novoValor = this.totalTransf += (quantidade * price); // Multiplicando o preço pela quantidade
    //   this.totalTransf = novoValor;
    //   this.totalTransfFormat = novoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    // }

    somarValorTransf(): void {
      this.apiService.getTransferComId(this.idConf).subscribe((data: any) => {
        let novoValor: number = 0;
        data.metadata.response.internalTransferItems.forEach((item: any) => {
          if (item.status === 'F') {
            novoValor += item.product.price * item.checkedQuantity;
          }
        });

        this.totalTransf = novoValor;
        this.totalTransfFormat = novoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      });
    }


    padLeft(value: string | number, length: number, padChar: string): string {
      let paddedValue = String(value);
      while (paddedValue.length < length) {
        paddedValue = padChar + paddedValue;
      }
      return paddedValue;
    }


  filtrarProdutos() {

    if (this.codigoFiltro) {
      // Filtrar por código
      this.produtosFiltrados = this.productsEncontrados.filter(produto => produto.ean === this.codigoFiltro);
    } if (this.nomeFiltro) {
      // Filtrar por nome
      this.produtosFiltrados = this.productsEncontrados.filter(produto => produto.description.toLowerCase().includes(this.nomeFiltro.toLowerCase()));
    } {
      // Filtrar por ID
      this.produtosFiltrados = this.productsEncontrados.filter(produto => produto.id === this.idConf);
    }
  }

  buscarPorNome() {
    if(this.nomeFiltro) {
      // Lógica para filtrar produtos pelo nome
      this.productsEncontrados = this.productsEncontrados.filter(produto =>
        produto.description.toLowerCase().includes(this.nomeFiltro.toLowerCase())
      );
    } else {
      if(this.codigoFiltro) {

      } else {
        this.resetFiltros();
      }
    }
  }

  buscarProdutoPorCodigoAdd() {
    if (this.codProduct) {
      this.apiService.getProduct().subscribe(
        (response) => {
          if (response && response.metadata && response.metadata.response && response.metadata.response.items) {
            const produtos: Produtos[] = response.metadata.response.items.map((produto: any) => {
              return {
                id: produto.id,
                nome: produto.description,
                qtd: produto.stocks.reduce((total: number, stock: any) => total + stock.quantity, 0),
                code: produto.ean,
                price: produto.price
              };
            });
            // Filtrar os produtos pela ID informada
            const produtoEncontrado = produtos.find(produto => produto.code === this.codProduct);
            if (produtoEncontrado) {
              this.produtosEncontrados = [produtoEncontrado];
              this.nomeProduct = produtoEncontrado.nome; // Atualiza o nome do produto encontrado
            } else {
              // Se não encontrar nenhum produto com a ID informada, limpar a items de produtos encontrados
              this.produtosEncontrados = [];
              this.nomeProduct = ''; // Limpa o nome do produto
            }
          } else {
            console.error('Resposta inválida ao buscar produtos:', response);
            this.produtosEncontrados = []; // Limpar a lista de produtos encontrados se a resposta não for válida
            this.nomeProduct = ''; // Limpa o nome do produto
          }
        },
        (error) => {
          console.error('Erro ao buscar produtos:', error);
          this.produtosEncontrados = []; // Limpar a lista de produtos encontrados em caso de erro
          this.nomeProduct = ''; // Limpa o nome do produto
        }
      );
    } else {
      this.produtosEncontrados = []; // Limpar a lista de produtos encontrados se o campo estiver vazio
      this.nomeProduct = ''; // Limpa o nome do produto
    }
  }

  buscarPorCodigo() {
    // Lógica para filtrar produtos pelo código
    if (this.codigoFiltro) {
      this.productsEncontrados = this.productsEncontrados.filter(produto =>
        produto.productId.toString().includes(this.codigoFiltro.toString())
      );
    } else {
      if(this.nomeFiltro) {

      } else {
      // Se o campo de código estiver vazio, redefina os filtros para mostrar todos os produtos
      this.resetFiltros();
      }

    }
  }

  resetFiltros() {
    // Redefine os filtros para mostrar todos os produtos
    this.buscarProduto();
  }

  checkStatus() {
    this.apiService.getTransferComId(this.idConf).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const transferencia = response.metadata.response;
          const status = transferencia.status;
          if (status === 'F') {
            this.statusTransf = false
              this.toastr.error('Esta transferência está fechada')

          } else {
            this.statusTransf = true
          }
        } else {
          console.error('Resposta inválida ao obter transferência:', response);
        };
        }
        );
  }

  emProducao() {
    alert('Em desenvolvimento')
  }

  toggleView() {
    this.cardsView = !this.cardsView;
    this.buscarDadosTransferencia(this.idConf)
  }

  confirmTransf(): void {
    // Primeiro, vamos obter os dados da transferência usando o ID armazenado em idConf
    this.apiService.getTransferComId(this.idConf).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response) {
          const transferencia = response.metadata.response;
          // Agora vamos criar os dados a serem enviados para a atualização
          const dadosAtualizados = {
            originCompanyId: transferencia.originCompanyId,
            destinyCompanyId: transferencia.destinyCompanyId,
            status: 'F', // Atualizando o status para "F"
            observation: transferencia.observation
          };
          // Agora vamos chamar o método putTransferComId para atualizar os dados da transferência
          this.apiService.putAfterSendTransfer(this.idConf, dadosAtualizados).subscribe(
            (response) => {
              this.toastr.success('Transferência atualizada com sucesso')
              console.log('Transferência atualizada com sucesso:', response);
              this.closeModalCheck();
              this.router.navigateByUrl('/app/conferencia');
              // Aqui você pode adicionar qualquer outra lógica após a atualização, se necessário
            },
            (error) => {
              console.error('Erro ao atualizar transferência:', error);
              const erroMessage = error.error.metadata.response
              this.toastr.error(erroMessage)
              if (erroMessage === 'Transferências sem itens não podem ser finalizadas.') {
                this.openModalCaution();
              }
            }
          );
        } else {
          console.error('Resposta inválida ao obter transferência:', response);
        }
      },
      (error) => {
        console.error('Erro ao obter transferência:', error);
      }
    );
  }

  deleteTransf() {
    this.apiService.deleteTransfer(this.idConf).subscribe(
      (response) => {
        this.toastr.success('Transferência deletada com sucesso')
        console.log('Transferência deletada com sucesso:', response);
        this.closeModalCheck();
        this.router.navigateByUrl('/app/conferencia');
        // Aqui você pode adicionar qualquer outra lógica após a atualização, se necessário
      },
      (error) => {
        console.error('Erro ao deletar transferência:', error);
        const erroMessage = error.error.metadata.response
        this.toastr.error(erroMessage)
      }
    );
  }


  openModal(produto: ProdutoEncontrado, qtdProduct: number, nomeProduct: string | undefined, codeProduct: number) {
    if (this.statusTransf === false) {
      this.toastr.error('Transferência fechada')
    } else {
    this.produtoSelecionado = produto;

    // if (this.produtoSelecionado.status === "C") {
    //   this.toastr.error('Produto cancelado!')
    // } else if (this.produtoSelecionado.status === "F") {
    //   this.toastr.error('Produto já conferido!')
    // } else {
      const modal = document.getElementById('card-modal');
    if (modal) {
      modal.style.display = 'block';
    }

    this.qtdProduct = qtdProduct;
    this.qtdProductOld = qtdProduct;
    this.nomeProduct = nomeProduct;
    this.codProduct = codeProduct;

    }

  }

  openModalAdd() {
    if (this.statusTransf === false) {
      this.toastr.error('Transferência fechada')
    } else {
      this.qtdProduct = 0;
      this.codProduct = 0;
      this.nomeProduct = ''
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }
  }

  openModalCheck() {
    this.somarValorTransf()
    if (this.statusTransf === false) {
      this.toastr.error('Transferência fechada')
    } else {
    const modal = document.getElementById('check-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }
  }

  closeModalAdd() {
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.limparDados();
  }

  openModalCaution() {
    const modal = document.getElementById('caution-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeModalCheck() {
    const modal = document.getElementById('check-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  closeModalCaution() {
    const modal = document.getElementById('caution-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.closeModalCheck();
  }

  closeModal() {
    const modal = document.getElementById('card-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  conferir() {
    // if (this.qtdProduct > this.qtdProductOld) {
    //   this.toastr.error('Quantidade conferida não pode ser maior que a quantidade solicitada!');
    //   return;
    // }

    // Obter o objeto de transferência
    this.apiService.getTransferComId(this.idConf).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.internalTransferItems && response.metadata.response.internalTransferItems.length > 0) {
          const itemTransferencia = response.metadata.response.internalTransferItems.find((item: any) => item.productId === this.codProduct);

          if (itemTransferencia) {
            const itemTransferenciaId = itemTransferencia.id;

            // Modificar os dados para atualização
            const dadosAtualizacao = {
              checkedQuantity: this.qtdProduct,
              quantity: this.qtdProduct,
              status: "F" // Alterar para "F" (conferido)
            };
            console.log(dadosAtualizacao)

            // Chamar o método putItemTransferComId para atualizar o item de transferência na API
            this.apiService.putAfterItemTransferComId(itemTransferenciaId, dadosAtualizacao).subscribe(
              (response) => {
                this.toastr.success('Produto conferido com sucesso!', 'Sucesso');
                this.closeModal();
                this.buscarDadosTransferencia(this.idConf);
              },
              (error) => {
                console.error('Erro ao conferir produto:', error);
                this.toastr.error(error.error.metadata.response);
              }
            );
          } else {
            this.toastr.error('Item de transferência não encontrado para o código de produto especificado.', 'Erro');
          }
        } else {
          this.toastr.error('Itens de transferência não encontrados para esta transferência.', 'Erro');
        }
      },
      (error) => {
        console.error('Erro ao buscar itens de transferência:', error);
        this.toastr.error('Erro ao buscar itens de transferência.', 'Erro');
      }
    );
  }

  cancelar() {
    // Obter o objeto de transferência
    this.apiService.getTransferComId(this.idConf).subscribe(
      (response) => {
        if (response && response.metadata && response.metadata.response && response.metadata.response.internalTransferItems && response.metadata.response.internalTransferItems.length > 0) {
          const itemTransferencia = response.metadata.response.internalTransferItems.find((item: any) => item.productId === this.codProduct);

          if (itemTransferencia) {
            const itemTransferenciaId = itemTransferencia.id;

            // Modificar os dados para atualização
            const dadosAtualizacao = {
              status: "C" // Alterar para "C" (cancelado)
            };

            // Chamar o método putItemTransferComId para atualizar o item de transferência na API
            this.apiService.putAfterItemTransferComId(itemTransferenciaId, dadosAtualizacao).subscribe(
              (response) => {
                this.toastr.success('Item cancelado com sucesso!', 'Sucesso');
                this.produtoSelecionado.cancelado = true;
                this.closeModal();
                this.buscarDadosTransferencia(this.idConf);
              },
              (error) => {
                console.error('Erro ao cancelar item:', error);
                this.toastr.error('Erro ao cancelar item.', 'Erro');
              }
            );
          } else {
            this.toastr.error('Item de transferência não encontrado para o código de produto especificado.', 'Erro');
          }
        } else {
          this.toastr.error('Itens de transferência não encontrados para esta transferência.', 'Erro');
        }
      },
      (error) => {
        console.error('Erro ao buscar itens de transferência:', error);
        this.toastr.error('Erro ao buscar itens de transferência.', 'Erro');
      }
    );
  }

  adicionarItem(ean: number, quantidade: number) {
    // Chamada para obter o produto com o EAN fornecido
    // this.apiService.getProductComEan(ean).subscribe(
    //   (response) => {
        // Verifica se a resposta contém o campo "id"
        // if (response.metadata && response.metadata.response && response.metadata.response.id) {
        //   // Armazena o ID do produto
        //   const productId = response.metadata.response.id;

        //   // Crie um objeto com os dados do item a ser transferido
        //   const itemTransfer = {
        //     productId: productId, // Atribui o ID do produto obtido
        //     internalTransferId: this.idConf,
        //     status: 'F',
        //     requestedQuantity: quantidade,
        //     checkedQuantity: quantidade,
        //     quantity: quantidade
        //   };
        if (this.baseProduto) {
        const productId = this.baseProduto.id
        const itemTransfer = {
              productId: productId, // Atribui o ID do produto obtido
              internalTransferId: this.idConf,
              status: 'F',
              requestedQuantity: quantidade,
              checkedQuantity: quantidade,
              quantity: quantidade
            };

          console.log(itemTransfer);

          // Chame o método postItemTransfer da ApiService para adicionar o item
          this.apiService.postItemTransfer(itemTransfer).subscribe(
            (response) => {
              this.toastr.success('Item adicionado com sucesso!');
              this.closeModalAdd();
              this.buscarDadosTransferencia(this.idConf);

              console.log('Item adicionado com sucesso:', response);
              this.limparDados();
              // Se desejar, adicione lógica adicional aqui após adicionar o item com sucesso
            },
            (error) => {
              console.error('Erro ao adicionar o item:', error);
              this.toastr.error(error.error.metadata.response);
              // Adicione tratamento de erro aqui, se necessário
            }
          );
        } else {
          console.error('Resposta da solicitação de produto não contém o campo "id".');
          // Adicione tratamento de erro aqui se o campo "id" não estiver presente na resposta
        }
      // },
      // (error) => {
      //   console.error('Erro ao obter o produto com EAN:', error);
      //   this.toastr.error('Erro ao obter o produto com EAN');
      //   // Adicione tratamento de erro aqui, se necessário
      // }
    // );
}

limparDados() {
  this.baseProduto = null;
  this.searchControl.reset();
  this.searchKeywordName = '';
  this.searchKeyword = '';
  this.selectedSearch = null;
  this.searchProductByName();
}


}
