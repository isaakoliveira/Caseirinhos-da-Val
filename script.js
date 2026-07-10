const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
const WHATSAPP_VAL = "5583982168114";
let produtoPixAtual = null;
const carrinho = {};
let contaAtual = null;
let acaoAposLogin = null;
let codigoTelefoneEnviado = false;
const CHAVE_CONTA = "caseirinhosConta";
const CHAVE_TEMA = "caseirinhosTema";

// Mapeamento de imagens dos produtos
const IMAGENS_PRODUTOS = {
  doceLeiteCoco: "doce-de-leite-com-coco-sem-risco-camera.jpeg",
  doceLeiteGoiabada: "doce-de-leite-com-goiabada-sem-risco-camera.jpeg",
  doceLeite: "doce-de-leite-sem-risco-camera-inpaint-wide.jpeg",
  pudim18: "pudim 18,00$.jpeg",
  pudim35: "pudim 35,00$.jpeg",
  boloSimples: "bolo de leite.jpeg",
  boloMilhoPalha: "Bolo de miho na palha.jpg",
  boloChocolate50: "bolo de chocolate 50%25.jpeg",
  boloLeiteCoco: "bolo de leite com coco 2.0.jpeg",
  boloOvos: "bolo de ovos.jpeg",
  boloFormigueiro: "bolo formigueiro.jpeg",
  boloMesclado: "bolo mesclado.jpeg"
};

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

carregarCarrinho();
carregarConta();
carregarTema();
preencherPrecos();
atualizarCarrinho();
inicializarInterface();

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
  atualizarNavegacao(aba);
  rolarParaSecao(secaoSelecionada);
}

function inicializarInterface(){
  atualizarNavegacao("doces");
  inicializarImagensFallback();
  inicializarModalPix();
  inicializarAutenticacao();
  inicializarConfiguracoes();
  atualizarContaNaInterface();
  atualizarOpcoesTema();
}

function inicializarConfiguracoes(){
  const configuracoes = document.getElementById("configuracoes");

  if(configuracoes){
    configuracoes.addEventListener("click", function(evento){
      if(evento.target === configuracoes){
        fecharConfiguracoes();
      }
    });
  }
}

function abrirConfiguracoes(){
  const configuracoes = document.getElementById("configuracoes");

  if(!configuracoes){
    return;
  }

  configuracoes.classList.add("active");
  configuracoes.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
}

function fecharConfiguracoes(){
  const configuracoes = document.getElementById("configuracoes");
  const loginAberto = document.getElementById("authModal").classList.contains("aberto");

  if(configuracoes){
    configuracoes.classList.remove("active");
    configuracoes.setAttribute("aria-hidden", "true");
  }

  if(!loginAberto){
    document.body.classList.remove("modal-aberto");
  }
}

function inicializarAutenticacao(){
  const modal = document.getElementById("authModal");
  const emailForm = document.getElementById("emailLoginForm");
  const phoneForm = document.getElementById("phoneLoginForm");
  const phoneInput = document.getElementById("loginPhone");

  if(modal){
    modal.addEventListener("click", function(evento){
      if(evento.target === modal){
        fecharLogin();
      }
    });
  }

  if(emailForm){
    emailForm.addEventListener("submit", function(evento){
      evento.preventDefault();

      const nome = document.getElementById("loginName").value.trim();
      const email = document.getElementById("loginEmail").value.trim();

      if(!validarEmail(email)){
        mostrarErroAutenticacao("Informe um e-mail válido para continuar.");
        return;
      }

      concluirLogin({
        nome: nome || email.split("@")[0],
        identificador: email,
        metodo: "email"
      });
    });
  }

  if(phoneForm){
    phoneForm.addEventListener("submit", function(evento){
      evento.preventDefault();

      const telefone = phoneInput ? phoneInput.value.trim() : "";
      const campoCodigo = document.getElementById("loginCode");

      if(telefone.replace(/\D/g, "").length < 10){
        mostrarErroAutenticacao("Informe um telefone válido com DDD.");
        return;
      }

      if(!codigoTelefoneEnviado){
        codigoTelefoneEnviado = true;
        document.getElementById("verificationCodeArea").hidden = false;
        document.getElementById("phoneLoginButton").textContent = "Confirmar e entrar";
        document.getElementById("phoneHelp").textContent = "Código enviado. Nesta demonstração, digite qualquer código de 6 dígitos.";
        campoCodigo.focus();
        return;
      }

      if(!campoCodigo || campoCodigo.value.replace(/\D/g, "").length !== 6){
        mostrarErroAutenticacao("Digite o código de 6 dígitos para confirmar.");
        return;
      }

      concluirLogin({
        nome: "Cliente",
        identificador: telefone,
        metodo: "telefone"
      });
    });
  }

  if(phoneInput){
    phoneInput.addEventListener("input", function(){
      const numeros = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      phoneInput.value = formatarTelefone(numeros);
    });
  }
}

function abrirLogin(){
  const modal = document.getElementById("authModal");

  if(!modal){
    return;
  }

  mostrarOpcoesLogin();
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
}

function fecharLogin(preservarAcao){
  const modal = document.getElementById("authModal");

  if(modal){
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
  }

  if(!document.getElementById("configuracoes").classList.contains("active")){
    document.body.classList.remove("modal-aberto");
  }

  if(!preservarAcao){
    acaoAposLogin = null;
  }
}

function mostrarOpcoesLogin(){
  const opcoes = document.getElementById("authOptions");
  const emailForm = document.getElementById("emailLoginForm");
  const phoneForm = document.getElementById("phoneLoginForm");

  if(opcoes){
    opcoes.hidden = false;
  }

  if(emailForm){
    emailForm.hidden = true;
  }

  if(phoneForm){
    phoneForm.hidden = true;
  }
}

function mostrarFormularioLogin(tipo){
  const opcoes = document.getElementById("authOptions");
  const emailForm = document.getElementById("emailLoginForm");
  const phoneForm = document.getElementById("phoneLoginForm");

  if(opcoes){
    opcoes.hidden = true;
  }

  if(emailForm){
    emailForm.hidden = tipo !== "email";
  }

  if(phoneForm){
    phoneForm.hidden = tipo !== "phone";
  }

  if(tipo === "email"){
    document.getElementById("loginEmail").focus();
  }else if(tipo === "phone"){
    document.getElementById("loginPhone").focus();
  }
}

function loginComGoogle(){
  concluirLogin({
    nome: "Cliente Google",
    identificador: "Conta conectada com Google",
    metodo: "google"
  });
}

function concluirLogin(conta){
  contaAtual = conta;
  localStorage.setItem(CHAVE_CONTA, JSON.stringify(contaAtual));
  atualizarContaNaInterface();

  const acao = acaoAposLogin;
  acaoAposLogin = null;
  fecharLogin(true);
  mostrarToastSite("Login realizado. Bom pedido, " + obterPrimeiroNome(contaAtual.nome) + "!");

  if(acao){
    setTimeout(acao, 120);
  }
}

function exigirLogin(acao){
  if(contaAtual){
    return true;
  }

  acaoAposLogin = acao;
  abrirLogin();
  mostrarToastSite("Entre para comprar com segurança.");
  return false;
}

function trocarConta(){
  fecharConfiguracoes();
  desconectarConta(true);
  abrirLogin();
}

function desconectarConta(semMensagem){
  contaAtual = null;
  localStorage.removeItem(CHAVE_CONTA);
  atualizarContaNaInterface();

  if(!semMensagem){
    mostrarToastSite("Conta desconectada com segurança.");
  }
}

function atualizarContaNaInterface(){
  const tituloHero = document.getElementById("heroAccountTitle");
  const descricaoHero = document.getElementById("heroAccountDescription");
  const botaoHero = document.getElementById("heroAccountButton");
  const nomeConfiguracoes = document.getElementById("settingsAccountName");
  const infoConfiguracoes = document.getElementById("settingsAccountInfo");
  const botaoTrocar = document.getElementById("switchAccountButton");
  const botaoSair = document.getElementById("logoutButton");

  if(contaAtual){
    const primeiroNome = obterPrimeiroNome(contaAtual.nome);
    const metodo = contaAtual.metodo === "google" ? "Google" : contaAtual.metodo === "telefone" ? "telefone" : "e-mail";

    if(tituloHero){ tituloHero.textContent = "Olá, " + primeiroNome + "!"; }
    if(descricaoHero){ descricaoHero.textContent = "Conta conectada por " + metodo + "."; }
    if(botaoHero){ botaoHero.textContent = "Gerenciar conta"; botaoHero.onclick = abrirConfiguracoes; }
    if(nomeConfiguracoes){ nomeConfiguracoes.textContent = "Olá, " + primeiroNome + "!"; }
    if(infoConfiguracoes){ infoConfiguracoes.textContent = contaAtual.identificador + " \u2022 Login por " + metodo + "."; }
    if(botaoTrocar){ botaoTrocar.textContent = "Trocar de conta"; }
    if(botaoSair){ botaoSair.hidden = false; }
  }else{
    if(tituloHero){ tituloHero.textContent = "Entre para fazer seu pedido"; }
    if(descricaoHero){ descricaoHero.textContent = "Use seu e-mail, Google ou telefone."; }
    if(botaoHero){ botaoHero.textContent = "Entrar / criar conta"; botaoHero.onclick = abrirLogin; }
    if(nomeConfiguracoes){ nomeConfiguracoes.textContent = "Você ainda não entrou"; }
    if(infoConfiguracoes){ infoConfiguracoes.textContent = "Entre para comprar e acompanhar seu pedido."; }
    if(botaoTrocar){ botaoTrocar.textContent = "Entrar ou criar conta"; }
    if(botaoSair){ botaoSair.hidden = true; }
  }
}

function carregarConta(){
  const contaSalva = localStorage.getItem(CHAVE_CONTA);

  if(!contaSalva){
    return;
  }

  try{
    const conta = JSON.parse(contaSalva);

    if(conta && conta.nome && conta.identificador && conta.metodo){
      contaAtual = conta;
    }
  }catch(erro){
    localStorage.removeItem(CHAVE_CONTA);
  }
}

function definirTema(tema){
  const temaEscolhido = tema === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = temaEscolhido;
  localStorage.setItem(CHAVE_TEMA, temaEscolhido);
  atualizarOpcoesTema();
}

function carregarTema(){
  const temaSalvo = localStorage.getItem(CHAVE_TEMA) || "light";
  document.documentElement.dataset.theme = temaSalvo === "dark" ? "dark" : "light";
}

function atualizarOpcoesTema(){
  const temaAtual = document.documentElement.dataset.theme || "light";

  document.querySelectorAll("[data-theme-option]").forEach(function(botao){
    const selecionado = botao.dataset.themeOption === temaAtual;
    botao.classList.toggle("selecionado", selecionado);
    botao.setAttribute("aria-pressed", String(selecionado));
  });
}

function validarEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarTelefone(numeros){
  if(numeros.length <= 2){ return numeros; }
  if(numeros.length <= 6){ return "(" + numeros.slice(0, 2) + ") " + numeros.slice(2); }
  if(numeros.length <= 10){ return "(" + numeros.slice(0, 2) + ") " + numeros.slice(2, 6) + "-" + numeros.slice(6); }
  return "(" + numeros.slice(0, 2) + ") " + numeros.slice(2, 7) + "-" + numeros.slice(7); }

function obterPrimeiroNome(nome){
  return String(nome || "cliente").trim().split(/\s+/)[0] || "cliente";
}

function mostrarErroAutenticacao(mensagem){
  const ajudaTelefone = document.getElementById("phoneHelp");

  if(ajudaTelefone && !document.getElementById("phoneLoginForm").hidden){
    ajudaTelefone.textContent = mensagem;
  }else{
    mostrarToastSite(mensagem.replace(/&[^;]+;/g, ""));
  }
}

function atualizarNavegacao(aba){
  const botoes = document.querySelectorAll("[data-aba]");

  botoes.forEach(function(botao){
    botao.classList.toggle("active-nav", botao.dataset.aba === aba);
  });
}

function rolarParaSecao(secaoSelecionada){
  const nav = document.querySelector("nav");
  const navAltura = nav ? nav.offsetHeight : 0;
  const destino = secaoSelecionada.getBoundingClientRect().top + window.pageYOffset - navAltura - 12;

  window.scrollTo({
    top: Math.max(destino, 0),
    behavior: "smooth"
  });
}

function inicializarImagensFallback(){
  const logo = document.querySelector(".logo-header");
  const imagensProdutos = document.querySelectorAll(".produto-card > img");

  if(logo){
    aplicarFallbackLogo(logo);
  }

  imagensProdutos.forEach(function(imagem){
    aplicarFallbackProduto(imagem, imagem.alt || "Produto");
  });
}

function aplicarFallbackLogo(logo){
  let aplicado = false;

  function trocarLogo(){
    if(aplicado || !logo.parentNode){
      return;
    }

    aplicado = true;

    const fallback = document.createElement("div");
    fallback.className = "logo-fallback";
    fallback.textContent = "CV";
    logo.replaceWith(fallback);
  }

  logo.addEventListener("error", trocarLogo, { once: true });

  if(logo.complete && logo.naturalWidth === 0){
    trocarLogo();
  }
}

function aplicarFallbackProduto(imagem, texto){
  let aplicado = false;

  function trocarImagem(){
    if(aplicado || !imagem.parentNode){
      return;
    }

    aplicado = true;

    const placeholder = document.createElement("div");
    placeholder.className = "produto-placeholder";
    placeholder.textContent = texto;
    imagem.replaceWith(placeholder);
  }

  imagem.addEventListener("error", trocarImagem, { once: true });

  if(imagem.complete && imagem.naturalWidth === 0){
    trocarImagem();
  }
}

function aplicarFallbackCarrinho(imagem, texto){
  let aplicado = false;

  function trocarImagem(){
    if(aplicado || !imagem.parentNode){
      return;
    }

    aplicado = true;

    const placeholder = document.createElement("div");
    placeholder.className = "item-carrinho-placeholder";
    placeholder.textContent = obterIniciaisProduto(texto);
    imagem.replaceWith(placeholder);
  }

  imagem.addEventListener("error", trocarImagem, { once: true });

  if(imagem.complete && imagem.naturalWidth === 0){
    trocarImagem();
  }
}

function obterIniciaisProduto(texto){
  return texto
    .split(" ")
    .filter(function(parte){
      return parte.length > 2;
    })
    .slice(0, 2)
    .map(function(parte){
      return parte.charAt(0).toUpperCase();
    })
    .join("") || "CV";
}

function inicializarModalPix(){
  const modal = document.getElementById("pixModal");

  if(!modal){
    return;
  }

  modal.addEventListener("click", function(evento){
    if(evento.target === modal){
      fecharPix();
    }
  });

  document.addEventListener("keydown", function(evento){
    if(evento.key === "Escape" && modal.style.display === "flex"){
      fecharPix();
    }

    if(evento.key === "Escape" && document.getElementById("authModal").classList.contains("aberto")){
      fecharLogin();
    }

    if(evento.key === "Escape" && document.getElementById("configuracoes").classList.contains("active")){
      fecharConfiguracoes();
    }
  });
}

function mostrarToastSite(mensagem){
  const toast = document.getElementById("toastSite");

  if(!toast){
    return;
  }

  clearTimeout(toast.timer);
  toast.textContent = mensagem;
  toast.classList.add("mostrar");

  toast.timer = setTimeout(function(){
    toast.classList.remove("mostrar");
  }, 2400);
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
  if(!exigirLogin(function(){ abrirPix(codigoProduto); })){
    return;
  }

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
  if(!exigirLogin(function(){ fazerPedidoWhatsApp(codigoProduto); })){
    return;
  }

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
  if(!exigirLogin(function(){ adicionarAoCarrinho(codigoProduto, botao); })){
    return;
  }

  const produto = PRODUTOS[codigoProduto];

  if(!produto){
    return;
  }

  if(!carrinho[codigoProduto]){
    carrinho[codigoProduto] = 0;
  }

  carrinho[codigoProduto]++;
  salvarCarrinho();
  atualizarCarrinho();
  animarProdutoAdicionado(botao);
  mostrarStatusCarrinho(produto.nome + " adicionado ao carrinho.");
  mostrarToastSite(produto.nome + " adicionado ao carrinho.");
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
  const imagemProduto = cardProduto ? cardProduto.querySelector("img, .produto-placeholder") : null;
  const destinoCarrinho = contadorCarrinho ? contadorCarrinho.closest("button") || contadorCarrinho : null;

  if(!imagemProduto || !destinoCarrinho){
    return;
  }

  const inicio = imagemProduto.getBoundingClientRect();
  const fim = destinoCarrinho.getBoundingClientRect();
  const imagemVoando = imagemProduto.cloneNode(true);
  const movimentoX = fim.left + fim.width / 2 - inicio.left - inicio.width / 2;
  const movimentoY = fim.top + fim.height / 2 - inicio.top - inicio.height / 2;

  imagemVoando.className = imagemProduto.classList.contains("produto-placeholder")
    ? "imagem-voando-carrinho imagem-voando-placeholder"
    : "imagem-voando-carrinho";
  imagemVoando.style.left = inicio.left + "px";
  imagemVoando.style.top = inicio.top + "px";
  imagemVoando.style.width = inicio.width + "px";
  imagemVoando.style.height = inicio.height + "px";
  imagemVoando.style.transition = "all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  document.body.appendChild(imagemVoando);

  requestAnimationFrame(function(){
    imagemVoando.style.transform =
      "translate(" + movimentoX + "px, " + movimentoY + "px) scale(0.18)";
    imagemVoando.style.opacity = "0";
  });

  setTimeout(function(){
    imagemVoando.remove();
  }, 1500);
}

function alterarQuantidadeCarrinho(codigoProduto, quantidade){
  if(!carrinho[codigoProduto]){
    return;
  }

  carrinho[codigoProduto] += quantidade;

  if(carrinho[codigoProduto] <= 0){
    delete carrinho[codigoProduto];
  }

  salvarCarrinho();
  atualizarCarrinho();
}

function removerDoCarrinho(codigoProduto){
  delete carrinho[codigoProduto];
  salvarCarrinho();
  atualizarCarrinho();
}

function limparCarrinho(){
  Object.keys(carrinho).forEach(function(codigoProduto){
    delete carrinho[codigoProduto];
  });

  salvarCarrinho();
  atualizarCarrinho();
  mostrarStatusCarrinho("Carrinho limpo.");
  mostrarToastSite("Carrinho limpo.");
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

    const imagemProduto = document.createElement("img");
    imagemProduto.src = IMAGENS_PRODUTOS[item.codigo] || "";
    imagemProduto.alt = item.produto.nome;
    imagemProduto.className = "item-carrinho-imagem";
    aplicarFallbackCarrinho(imagemProduto, item.produto.nome);

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

    itemCarrinho.appendChild(imagemProduto);
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

  if(!exigirLogin(finalizarCarrinhoWhatsApp)){
    return;
  }

  const mensagem = "Ola, quero fazer este pedido:\n\n" +
  montarResumoCarrinhoTexto() +
  "\n\nTotal: " + formatarMoeda(calcularTotalCarrinho()) + ".";

const link = "https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(mensagem);

window.open(link, "_blank");

Object.keys(carrinho).forEach(function(codigoProduto){
  delete carrinho[codigoProduto];
});

salvarCarrinho();
atualizarCarrinho();
mostrarStatusCarrinho("Pedido enviado! Carrinho limpo.");
mostrarToastSite("Pedido enviado! Carrinho limpo.");
}

function abrirPixCarrinho(){
  const total = calcularTotalCarrinho();

  if(total === 0){
    mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho.");
    return;
  }

  if(!exigirLogin(abrirPixCarrinho)){
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
      mostrarToastSite("PIX copiado.");
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
    mostrarToastSite("PIX copiado.");
  }else{
    document.getElementById("pixStatus").textContent = "nao foi possivel copiar";
    mostrarToastSite("Nao foi possivel copiar o PIX.");
  }
}

function fecharPix(){
  document.getElementById("pixModal").style.display = "none";
}

function salvarCarrinho(){
  localStorage.setItem("carrinhoCSV", JSON.stringify(carrinho));
}

function carregarCarrinho(){
  const carrinhoSalvo = localStorage.getItem("carrinhoCSV");

  if(carrinhoSalvo){
    try{
      const carrinhoCarregado = JSON.parse(carrinhoSalvo);

      Object.keys(carrinhoCarregado).forEach(function(codigoProduto){
        carrinho[codigoProduto] = carrinhoCarregado[codigoProduto];
      });
    }catch(erro){
      console.error("Erro ao carregar carrinho:", erro);
    }
  }
}
