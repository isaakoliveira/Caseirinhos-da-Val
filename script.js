const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
const WHATSAPP_VAL = "5583982168114";
let produtoPixAtual = null;
const carrinho = {};

const PRODUTOS = {
  doceLeiteCoco: {
    nome: "Doce de Leite com Coco (pote 350 ml)",
    preco: 12,
    elementoPreco: "preco-doce-leite-coco"
  },
  doceLeiteGoiabada: {
    nome: "Doce de Leite com Goiabada (pote 350 ml)",
    preco: 12,
    elementoPreco: "preco-doce-leite-goiabada"
  },
  doceLeite: {
    nome: "Doce de Leite Comum (pote 350 ml)",
    preco: 12,
    elementoPreco: "preco-doce-leite"
  },
  pudim18: {
    nome: "Pudim Pequeno (500g)",
    preco: 18,
    elementoPreco: "preco-pudim-18"
  },
  pudim35: {
    nome: "Pudim Grande (1kg)",
    preco: 35,
    elementoPreco: "preco-pudim-35"
  },
  boloSimples: {
    nome: "Bolo de Leite",
    preco: 12,
    elementoPreco: "preco-bolo-simples"
  },
  boloMilhoPalha: {
    nome: "Bolo de Milho Verde na Palha",
    preco: 12,
    elementoPreco: "preco-bolo-milho-palha"
  },
  boloLeiteCoco: {
    nome: "Bolo de Leite com Coco",
    preco: 12,
    elementoPreco: "preco-bolo-leite-coco"
  },
  boloOvos: {
    nome: "Bolo de Ovos",
    preco: 12,
    elementoPreco: "preco-bolo-ovos"
  },
  boloFormigueiro: {
    nome: "Bolo Formigueiro",
    preco: 12,
    elementoPreco: "preco-bolo-formigueiro"
  },
  boloChocolate50: {
    nome: "Bolo de Chocolate 50%",
    preco: 12,
    elementoPreco: "preco-bolo-chocolate-50"
  },
  boloMesclado: {
    nome: "Bolo Mesclado",
    preco: 12,
    elementoPreco: "preco-bolo-mesclado"
  }
};

preencherPrecos();
atualizarCarrinho();

function mostrarAba(aba){
  const secoes = document.querySelectorAll("section");
  const secaoSelecionada = document.getElementById(aba);

  if(!secaoSelecionada){
    return;
  }

  secoes.forEach(function(secao){
    secao.classList.remove("active");
  });

  secaoSelecionada.classList.add("active");
}

function preencherPrecos(){
  Object.keys(PRODUTOS).forEach(function(codigo){
    const produto = PRODUTOS[codigo];
    const elementoPreco = document.getElementById(produto.elementoPreco);

    if(elementoPreco){
      elementoPreco.textContent = formatarMoeda(produto.preco);
    }
  });
}

function abrirPix(codigoProduto){
  const produto = PRODUTOS[codigoProduto];

  if(!produto){
    return;
  }

  const precoFormatado = formatarMoeda(produto.preco);
  const pixCopiaCola = montarPixCopiaECola(produto, codigoProduto);
  produtoPixAtual = {
    produto: produto,
    precoFormatado: precoFormatado
  };

  document.getElementById("pixModal").style.display = "flex";
  document.getElementById("produtoPix").innerHTML =
    "Produto: <b>" + produto.nome + "</b><br>Valor: <b>" + precoFormatado + "</b>";
  document.getElementById("pixCopiaCola").value = pixCopiaCola;
  document.getElementById("pixQrCode").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(pixCopiaCola);
  document.getElementById("pixStatus").textContent = "Escolha o comprovante para enviar pelo WhatsApp.";

  prepararComprovante();
}

function formatarMoeda(valor){
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function fazerPedidoWhatsApp(codigoProduto){
  const produto = PRODUTOS[codigoProduto];

  if(!produto){
    return;
  }

  const precoFormatado = formatarMoeda(produto.preco);
  const mensagem = "Ola, quero fazer um pedido de " + produto.nome + " no valor de " + precoFormatado + ".";
  const link = "https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(mensagem);

  window.open(link, "_blank");
}

function adicionarAoCarrinho(codigoProduto, botao){
  const produto = PRODUTOS[codigoProduto];

  if(!produto){
    return;
  }

  if(!carrinho[codigoProduto]){
    carrinho[codigoProduto] = 0;
  }

  carrinho[codigoProduto]++;
  atualizarCarrinho();
  animarProdutoAdicionado(botao);
  mostrarStatusCarrinho(produto.nome + " adicionado ao carrinho.");
}

function animarProdutoAdicionado(botao){
  const contadorCarrinho = document.getElementById("contadorCarrinho");

  if(botao){
    const textoOriginal = botao.dataset.textoOriginal || botao.textContent;
    const cardProduto = botao.closest(".card");

    botao.dataset.textoOriginal = textoOriginal;
    clearTimeout(botao.timerAdicionado);
    botao.textContent = "Adicionado!";
    botao.classList.remove("adicionado");
    void botao.offsetWidth;
    botao.classList.add("adicionado");

    if(cardProduto){
      cardProduto.classList.remove("produto-adicionado");
      void cardProduto.offsetWidth;
      cardProduto.classList.add("produto-adicionado");
      animarImagemParaCarrinho(cardProduto, contadorCarrinho);
    }

    botao.timerAdicionado = setTimeout(function(){
      botao.textContent = textoOriginal;
      botao.classList.remove("adicionado");
      delete botao.dataset.textoOriginal;

      if(cardProduto){
        cardProduto.classList.remove("produto-adicionado");
      }
    }, 1200);
  }

  if(contadorCarrinho){
    clearTimeout(contadorCarrinho.timerAnimacao);
    contadorCarrinho.classList.remove("contador-animado");
    void contadorCarrinho.offsetWidth;
    contadorCarrinho.classList.add("contador-animado");

    contadorCarrinho.timerAnimacao = setTimeout(function(){
      contadorCarrinho.classList.remove("contador-animado");
    }, 800);
  }
}

function animarImagemParaCarrinho(cardProduto, contadorCarrinho){
  const imagemProduto = cardProduto ? cardProduto.querySelector("img") : null;
  const destinoCarrinho = contadorCarrinho ? contadorCarrinho.closest("button") || contadorCarrinho : null;

  if(!imagemProduto || !destinoCarrinho){
    return;
  }

  const inicio = imagemProduto.getBoundingClientRect();
  const fim = destinoCarrinho.getBoundingClientRect();
  const imagemVoando = imagemProduto.cloneNode(true);
  const movimentoX = fim.left + fim.width / 2 - inicio.left - inicio.width / 2;
  const movimentoY = fim.top + fim.height / 2 - inicio.top - inicio.height / 2;

  imagemVoando.className = "imagem-voando-carrinho";
  imagemVoando.style.left = inicio.left + "px";
  imagemVoando.style.top = inicio.top + "px";
  imagemVoando.style.width = inicio.width + "px";
  imagemVoando.style.height = inicio.height + "px";

  document.body.appendChild(imagemVoando);

  requestAnimationFrame(function(){
    imagemVoando.style.transform =
      "translate(" + movimentoX + "px, " + movimentoY + "px) scale(0.18)";
    imagemVoando.style.opacity = "0";
  });

  setTimeout(function(){
    imagemVoando.remove();
  }, 900);
}

function alterarQuantidadeCarrinho(codigoProduto, quantidade){
  if(!carrinho[codigoProduto]){
    return;
  }

  carrinho[codigoProduto] += quantidade;

  if(carrinho[codigoProduto] <= 0){
    delete carrinho[codigoProduto];
  }

  atualizarCarrinho();
}

function removerDoCarrinho(codigoProduto){
  delete carrinho[codigoProduto];
  atualizarCarrinho();
}

function limparCarrinho(){
  Object.keys(carrinho).forEach(function(codigoProduto){
    delete carrinho[codigoProduto];
  });

  atualizarCarrinho();
  mostrarStatusCarrinho("Carrinho limpo.");
}

function atualizarCarrinho(){
  const listaCarrinho = document.getElementById("listaCarrinho");
  const carrinhoVazio = document.getElementById("carrinhoVazio");
  const totalCarrinho = document.getElementById("totalCarrinho");
  const contadorCarrinho = document.getElementById("contadorCarrinho");
  const linhasCarrinho = montarLinhasCarrinho();

  if(contadorCarrinho){
    contadorCarrinho.textContent = contarItensCarrinho();
  }

  if(totalCarrinho){
    totalCarrinho.textContent = formatarMoeda(calcularTotalCarrinho());
  }

  if(!listaCarrinho || !carrinhoVazio){
    return;
  }

  listaCarrinho.innerHTML = "";
  carrinhoVazio.style.display = linhasCarrinho.length === 0 ? "block" : "none";

  linhasCarrinho.forEach(function(item){
    const itemCarrinho = document.createElement("div");
    itemCarrinho.className = "item-carrinho";

    const info = document.createElement("div");
    info.className = "item-carrinho-info";

    const nome = document.createElement("strong");
    nome.textContent = item.produto.nome;

    const preco = document.createElement("span");
    preco.textContent = item.quantidade + " x " + formatarMoeda(item.produto.preco) +
      " = " + formatarMoeda(item.subtotal);

    info.appendChild(nome);
    info.appendChild(preco);

    const controles = document.createElement("div");
    controles.className = "item-carrinho-controles";

    const diminuir = document.createElement("button");
    diminuir.className = "btn-quantidade";
    diminuir.type = "button";
    diminuir.textContent = "-";
    diminuir.onclick = function(){
      alterarQuantidadeCarrinho(item.codigo, -1);
    };

    const quantidade = document.createElement("span");
    quantidade.className = "quantidade-carrinho";
    quantidade.textContent = item.quantidade;

    const aumentar = document.createElement("button");
    aumentar.className = "btn-quantidade";
    aumentar.type = "button";
    aumentar.textContent = "+";
    aumentar.onclick = function(){
      alterarQuantidadeCarrinho(item.codigo, 1);
    };

    const remover = document.createElement("button");
    remover.className = "btn-remover";
    remover.type = "button";
    remover.textContent = "Remover";
    remover.onclick = function(){
      removerDoCarrinho(item.codigo);
    };

    controles.appendChild(diminuir);
    controles.appendChild(quantidade);
    controles.appendChild(aumentar);
    controles.appendChild(remover);

    itemCarrinho.appendChild(info);
    itemCarrinho.appendChild(controles);
    listaCarrinho.appendChild(itemCarrinho);
  });
}

function montarLinhasCarrinho(){
  return Object.keys(carrinho).map(function(codigoProduto){
    const produto = PRODUTOS[codigoProduto];
    const quantidade = carrinho[codigoProduto];

    if(!produto || quantidade <= 0){
      return null;
    }

    return {
      codigo: codigoProduto,
      produto: produto,
      quantidade: quantidade,
      subtotal: produto.preco * quantidade
    };
  }).filter(function(item){
    return item !== null;
  });
}

function contarItensCarrinho(){
  return montarLinhasCarrinho().reduce(function(total, item){
    return total + item.quantidade;
  }, 0);
}

function calcularTotalCarrinho(){
  return montarLinhasCarrinho().reduce(function(total, item){
    return total + item.subtotal;
  }, 0);
}

function finalizarCarrinhoWhatsApp(){
  if(contarItensCarrinho() === 0){
    mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho.");
    return;
  }

  const mensagem = "Ola, quero fazer este pedido:\n\n" +
    montarResumoCarrinhoTexto() +
    "\n\nTotal: " + formatarMoeda(calcularTotalCarrinho()) + ".";
  const link = "https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(mensagem);

  window.open(link, "_blank");
}

function abrirPixCarrinho(){
  const total = calcularTotalCarrinho();

  if(total === 0){
    mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho.");
    return;
  }

  const precoFormatado = formatarMoeda(total);
  const produtoCarrinho = {
    nome: "Pedido do carrinho com " + contarItensCarrinho() + " item(ns)",
    preco: total
  };
  const produtoPix = {
    nome: "Pedido Caseirinhos",
    preco: total
  };
  const pixCopiaCola = montarPixCopiaECola(produtoPix, "carrinho");

  produtoPixAtual = {
    produto: produtoCarrinho,
    precoFormatado: precoFormatado,
    resumo: montarResumoCarrinhoTexto()
  };

  document.getElementById("pixModal").style.display = "flex";
  document.getElementById("produtoPix").innerHTML =
    "Pedido do carrinho:<br>" + montarResumoCarrinhoHtml() +
    "<br>Total: <b>" + precoFormatado + "</b>";
  document.getElementById("pixCopiaCola").value = pixCopiaCola;
  document.getElementById("pixQrCode").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(pixCopiaCola);
  document.getElementById("pixStatus").textContent = "PIX gerado para o total do carrinho. Escolha o comprovante para enviar.";

  prepararComprovante();
}

function montarResumoCarrinhoTexto(){
  return montarLinhasCarrinho().map(function(item){
    return "- " + item.quantidade + "x " + item.produto.nome +
      " = " + formatarMoeda(item.subtotal);
  }).join("\n");
}

function montarResumoCarrinhoHtml(){
  return montarLinhasCarrinho().map(function(item){
    return item.quantidade + "x " + item.produto.nome +
      " - <b>" + formatarMoeda(item.subtotal) + "</b>";
  }).join("<br>");
}

function mostrarStatusCarrinho(mensagem){
  const carrinhoStatus = document.getElementById("carrinhoStatus");

  if(carrinhoStatus){
    carrinhoStatus.textContent = mensagem;
  }
}

function prepararComprovante(){
  const campoComprovante = document.getElementById("comprovantePix");
  const nomeComprovante = document.getElementById("nomeComprovante");
  const botaoWhatsapp = document.getElementById("btnWhatsapp");

  if(campoComprovante){
    campoComprovante.value = "";
  }

  if(nomeComprovante){
    nomeComprovante.textContent = "Nenhum comprovante selecionado";
  }

  if(botaoWhatsapp){
    botaoWhatsapp.disabled = true;
  }
}

function atualizarComprovante(){
  const campoComprovante = document.getElementById("comprovantePix");
  const nomeComprovante = document.getElementById("nomeComprovante");
  const botaoWhatsapp = document.getElementById("btnWhatsapp");
  const status = document.getElementById("pixStatus");
  const arquivo = campoComprovante && campoComprovante.files ? campoComprovante.files[0] : null;

  if(!arquivo){
    if(nomeComprovante){
      nomeComprovante.textContent = "Nenhum comprovante selecionado";
    }

    if(botaoWhatsapp){
      botaoWhatsapp.disabled = true;
    }

    return;
  }

  if(nomeComprovante){
    nomeComprovante.textContent = "Selecionado: " + arquivo.name;
  }

  if(botaoWhatsapp){
    botaoWhatsapp.disabled = false;
  }

  if(status){
    status.textContent = "Comprovante pronto para enviar.";
  }
}

function enviarComprovanteWhatsApp(){
  const campoComprovante = document.getElementById("comprovantePix");
  const status = document.getElementById("pixStatus");
  const arquivo = campoComprovante && campoComprovante.files ? campoComprovante.files[0] : null;

  if(!produtoPixAtual){
    if(status){
      status.textContent = "Abra o pagamento de um produto primeiro.";
    }

    return;
  }

  if(!arquivo){
    if(status){
      status.textContent = "Escolha o comprovante antes de enviar.";
    }

    return;
  }

  const mensagem = montarMensagemComprovante(
    produtoPixAtual.produto,
    produtoPixAtual.precoFormatado,
    arquivo,
    produtoPixAtual.resumo
  );
  const link = "https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(mensagem);

  if(status){
    status.textContent = "WhatsApp aberto. Anexe o comprovante na conversa antes de enviar.";
  }

  window.open(link, "_blank");
}

function montarMensagemComprovante(produto, precoFormatado, arquivo, resumo){
  let mensagem = "Ola, Val! Ja fiz o pagamento do " + produto.nome +
    " no valor de " + precoFormatado +
    ". Meu comprovante esta selecionado: " + arquivo.name;

  if(resumo){
    mensagem += "\n\nPedido:\n" + resumo;
  }

  return mensagem +
    "\n\nVou enviar o comprovante por aqui.";
}

function montarPixCopiaECola(produto, codigoProduto){
  const dadosPix = campoPix("00", "br.gov.bcb.pix") +
    campoPix("01", PIX_CHAVE) +
    campoPix("02", produto.nome);
  const txid = codigoProduto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 25) || "***";
  const payloadSemCrc =
    campoPix("00", "01") +
    campoPix("01", "12") +
    campoPix("26", dadosPix) +
    campoPix("52", "0000") +
    campoPix("53", "986") +
    campoPix("54", produto.preco.toFixed(2)) +
    campoPix("58", "BR") +
    campoPix("59", PIX_NOME_RECEBEDOR.slice(0, 25)) +
    campoPix("60", PIX_CIDADE.slice(0, 15)) +
    campoPix("62", campoPix("05", txid)) +
    "6304";

  return payloadSemCrc + calcularCrc16(payloadSemCrc);
}

function campoPix(id, valor){
  const tamanho = String(valor.length).padStart(2, "0");
  return id + tamanho + valor;
}

function calcularCrc16(payload){
  let crc = 0xFFFF;

  for(let i = 0; i < payload.length; i++){
    crc ^= payload.charCodeAt(i) << 8;

    for(let bit = 0; bit < 8; bit++){
      if((crc & 0x8000) !== 0){
        crc = (crc << 1) ^ 0x1021;
      }else{
        crc <<= 1;
      }

      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function copiarPix(){
  const campoPix = document.getElementById("pixCopiaCola");
  campoPix.select();
  campoPix.setSelectionRange(0, 99999);

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(campoPix.value).then(function(){
      document.getElementById("pixStatus").textContent = "PIX copiado";
    }).catch(function(){
      copiarComMetodoAntigo();
    });
  }else{
    copiarComMetodoAntigo();
  }
}

function copiarComMetodoAntigo(){
  const copiou = document.execCommand("copy");

  if(copiou){
    document.getElementById("pixStatus").textContent = "PIX copiado";
  }else{
    document.getElementById("pixStatus").textContent = "nao foi possivel copiar";
  }
}

function fecharPix(){
  document.getElementById("pixModal").style.display = "none";
}
