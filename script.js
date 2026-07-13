const API_BASE = window.location.origin + "/api";
const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
const WHATSAPP_VAL = "5583982168114";
let produtoPixAtual = null;
const carrinho = {};
let contaAtual = null;
let tokenAtual = null;
let acaoAposLogin = null;
let codigoTelefoneEnviado = false;
const CHAVE_TOKEN = "caseirinhosToken";
const CHAVE_CONTA = "caseirinhosConta";
const CHAVE_TEMA = "caseirinhosTema";

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
  doceLeiteCoco: { nome: "Doce de Leite com Coco (pote 350 ml)", preco: 12, elementoPreco: "preco-doce-leite-coco" },
  doceLeiteGoiabada: { nome: "Doce de Leite com Goiabada (pote 350 ml)", preco: 12, elementoPreco: "preco-doce-leite-goiabada" },
  doceLeite: { nome: "Doce de Leite Comum (pote 350 ml)", preco: 12, elementoPreco: "preco-doce-leite" },
  pudim18: { nome: "Pudim Pequeno (500g)", preco: 18, elementoPreco: "preco-pudim-18" },
  pudim35: { nome: "Pudim Grande (1kg)", preco: 35, elementoPreco: "preco-pudim-35" },
  boloSimples: { nome: "Bolo de Leite", preco: 12, elementoPreco: "preco-bolo-simples" },
  boloMilhoPalha: { nome: "Bolo de Milho Verde na Palha", preco: 12, elementoPreco: "preco-bolo-milho-palha" },
  boloLeiteCoco: { nome: "Bolo de Leite com Coco", preco: 12, elementoPreco: "preco-bolo-leite-coco" },
  boloOvos: { nome: "Bolo de Ovos", preco: 12, elementoPreco: "preco-bolo-ovos" },
  boloFormigueiro: { nome: "Bolo Formigueiro", preco: 12, elementoPreco: "preco-bolo-formigueiro" },
  boloChocolate50: { nome: "Bolo de Chocolate 50%", preco: 12, elementoPreco: "preco-bolo-chocolate-50" },
  boloMesclado: { nome: "Bolo Mesclado", preco: 12, elementoPreco: "preco-bolo-mesclado" }
};

carregarCarrinho();
carregarConta();
carregarTema();
preencherPrecos();
atualizarCarrinho();
inicializarInterface();

function api(path, options) {
  const config = options || {};
  const headers = { "Content-Type": "application/json", ...(config.headers || {}) };

  if (tokenAtual) {
    headers["Authorization"] = "Bearer " + tokenAtual;
  }

  const url = API_BASE + path;
  const body = config.body ? JSON.stringify(config.body) : undefined;

  return fetch(url, {
    method: config.method || "GET",
    headers: headers,
    body: body
  }).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) {
        throw new Error(data.error || "Erro na requisicao");
      }
      return data;
    });
  });
}

function mostrarAba(aba) {
  const secoes = document.querySelectorAll("section");
  const secaoSelecionada = document.getElementById(aba);
  if (!secaoSelecionada) return;

  secoes.forEach(function (s) { s.classList.remove("active"); });
  secaoSelecionada.classList.add("active");
  atualizarNavegacao(aba);
  rolarParaSecao(secaoSelecionada);
}

function inicializarInterface() {
  atualizarNavegacao("doces");
  inicializarImagensFallback();
  inicializarModalPix();
  inicializarAutenticacao();
  inicializarConfiguracoes();
  atualizarContaNaInterface();
  atualizarOpcoesTema();
}

function inicializarConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (el) {
    el.addEventListener("click", function (e) {
      if (e.target === el) fecharConfiguracoes();
    });
  }
}

function abrirConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (!el) return;
  el.classList.add("active");
  el.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
}

function fecharConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (el) {
    el.classList.remove("active");
    el.setAttribute("aria-hidden", "true");
  }
  if (!document.getElementById("authModal").classList.contains("aberto")) {
    document.body.classList.remove("modal-aberto");
  }
}

function inicializarAutenticacao() {
  var modal = document.getElementById("authModal");
  var emailForm = document.getElementById("emailLoginForm");
  var phoneForm = document.getElementById("phoneLoginForm");
  var phoneInput = document.getElementById("loginPhone");

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharLogin();
    });
  }

  if (emailForm) {
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = document.getElementById("loginName").value.trim();
      var email = document.getElementById("loginEmail").value.trim();
      var senha = document.getElementById("loginPassword").value;

      if (!validarEmail(email)) {
        mostrarToastSite("Informe um e-mail valido.");
        return;
      }
      if (!senha || senha.length < 4) {
        mostrarToastSite("A senha deve ter pelo menos 4 caracteres.");
        return;
      }

      api("/auth/login", { method: "POST", body: { email: email, password: senha } })
        .then(function (data) { concluirLogin(data.user, data.token); })
        .catch(function (err) {
          if (err.message.indexOf("nao encontrada") > -1) {
            api("/auth/register", { method: "POST", body: { name: nome || email.split("@")[0], email: email, password: senha } })
              .then(function (data) { concluirLogin(data.user, data.token); })
              .catch(function (err2) { mostrarToastSite(err2.message); });
          } else {
            mostrarToastSite(err.message);
          }
        });
    });
  }

  if (phoneForm) {
    phoneForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var telefone = phoneInput ? phoneInput.value.trim() : "";
      var codigo = document.getElementById("loginCode");

      if (telefone.replace(/\D/g, "").length < 10) {
        mostrarToastSite("Informe um telefone valido com DDD.");
        return;
      }

      if (!codigoTelefoneEnviado) {
        api("/auth/phone/send-code", { method: "POST", body: { phone: telefone } })
          .then(function () {
            codigoTelefoneEnviado = true;
            document.getElementById("verificationCodeArea").hidden = false;
            document.getElementById("phoneLoginButton").textContent = "Confirmar e entrar";
            document.getElementById("phoneHelp").textContent = "Codigo enviado! Digite o codigo de 6 digitos.";
            if (codigo) codigo.focus();
          })
          .catch(function (err) { mostrarToastSite(err.message); });
        return;
      }

      if (!codigo || codigo.value.replace(/\D/g, "").length !== 6) {
        mostrarToastSite("Digite o codigo de 6 digitos.");
        return;
      }

      api("/auth/login", { method: "POST", body: { phone: telefone, password: "" } })
        .then(function (data) { concluirLogin(data.user, data.token); })
        .catch(function (err) {
          api("/auth/register", { method: "POST", body: { name: "Cliente", phone: telefone, password: "" } })
            .then(function (data) { concluirLogin(data.user, data.token); })
            .catch(function (err2) { mostrarToastSite(err2.message); });
        });
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      var nums = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      phoneInput.value = formatarTelefone(nums);
    });
  }
}

function abrirLogin() {
  var modal = document.getElementById("authModal");
  if (!modal) return;
  codigoTelefoneEnviado = false;
  document.getElementById("verificationCodeArea").hidden = true;
  document.getElementById("phoneLoginButton").textContent = "Enviar codigo";
  document.getElementById("phoneHelp").textContent = "Enviaremos um codigo para confirmar seu numero.";
  mostrarOpcoesLogin();
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
}

function fecharLogin(preservarAcao) {
  var modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
  }
  if (!document.getElementById("configuracoes").classList.contains("active")) {
    document.body.classList.remove("modal-aberto");
  }
  if (!preservarAcao) acaoAposLogin = null;
}

function mostrarOpcoesLogin() {
  document.getElementById("authOptions").hidden = false;
  document.getElementById("emailLoginForm").hidden = true;
  document.getElementById("phoneLoginForm").hidden = true;
}

function mostrarFormularioLogin(tipo) {
  document.getElementById("authOptions").hidden = true;
  document.getElementById("emailLoginForm").hidden = tipo !== "email";
  document.getElementById("phoneLoginForm").hidden = tipo !== "phone";
  if (tipo === "email") {
    document.getElementById("loginEmail").focus();
  } else if (tipo === "phone") {
    document.getElementById("loginPhone").focus();
  }
}

function loginComGoogle() {
  api("/auth/register", { method: "POST", body: { name: "Cliente Google", email: "google_" + Date.now() + "@conta.google", password: "google_" + Date.now() } })
    .then(function (data) { concluirLogin(data.user, data.token); })
    .catch(function (err) { mostrarToastSite(err.message); });
}

function concluirLogin(user, token) {
  contaAtual = user;
  tokenAtual = token;
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_CONTA, JSON.stringify(user));
  atualizarContaNaInterface();
  var acao = acaoAposLogin;
  acaoAposLogin = null;
  fecharLogin(true);
  mostrarToastSite("Login realizado. Bem-vindo, " + obterPrimeiroNome(user.name) + "!");
  if (acao) setTimeout(acao, 120);
}

function exigirLogin(acao) {
  if (contaAtual) return true;
  acaoAposLogin = acao;
  abrirLogin();
  mostrarToastSite("Entre para comprar com seguranca.");
  return false;
}

function trocarConta() {
  fecharConfiguracoes();
  desconectarConta(true);
  abrirLogin();
}

function desconectarConta(semMensagem) {
  if (tokenAtual) {
    api("/auth/logout", { method: "POST" }).catch(function () { });
  }
  contaAtual = null;
  tokenAtual = null;
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_CONTA);
  atualizarContaNaInterface();
  if (!semMensagem) mostrarToastSite("Conta desconectada com seguranca.");
}

function atualizarContaNaInterface() {
  var titulo = document.getElementById("heroAccountTitle");
  var desc = document.getElementById("heroAccountDescription");
  var botao = document.getElementById("heroAccountButton");
  var nomeConf = document.getElementById("settingsAccountName");
  var infoConf = document.getElementById("settingsAccountInfo");
  var btnTrocar = document.getElementById("switchAccountButton");
  var btnSair = document.getElementById("logoutButton");

  if (contaAtual) {
    var primeiroNome = obterPrimeiroNome(contaAtual.name);
    var metodo = contaAtual.method === "google" ? "Google" : contaAtual.method === "phone" ? "telefone" : "e-mail";

    if (titulo) titulo.textContent = "Ola, " + primeiroNome + "!";
    if (desc) desc.textContent = "Conta conectada por " + metodo + ".";
    if (botao) { botao.textContent = "Gerenciar conta"; botao.onclick = abrirConfiguracoes; }
    if (nomeConf) nomeConf.textContent = "Ola, " + primeiroNome + "!";
    if (infoConf) infoConf.textContent = (contaAtual.email || contaAtual.phone) + " \u2022 Login por " + metodo + ".";
    if (btnTrocar) btnTrocar.textContent = "Trocar de conta";
    if (btnSair) btnSair.hidden = false;
  } else {
    if (titulo) titulo.textContent = "Entre para fazer seu pedido";
    if (desc) desc.textContent = "Use seu e-mail, Google ou telefone.";
    if (botao) { botao.textContent = "Entrar / criar conta"; botao.onclick = abrirLogin; }
    if (nomeConf) nomeConf.textContent = "Voce ainda nao entrou";
    if (infoConf) infoConf.textContent = "Entre para comprar e acompanhar seu pedido.";
    if (btnTrocar) btnTrocar.textContent = "Entrar ou criar conta";
    if (btnSair) btnSair.hidden = true;
  }
}

function carregarConta() {
  var tokenSalvo = localStorage.getItem(CHAVE_TOKEN);
  var contaSalva = localStorage.getItem(CHAVE_CONTA);

  if (tokenSalvo && contaSalva) {
    try {
      var conta = JSON.parse(contaSalva);
      if (conta && conta.name) {
        tokenAtual = tokenSalvo;
        contaAtual = conta;
        api("/auth/me").then(function (data) {
          contaAtual = data.user;
          localStorage.setItem(CHAVE_CONTA, JSON.stringify(data.user));
          atualizarContaNaInterface();
        }).catch(function () {
          tokenAtual = null;
          contaAtual = null;
          localStorage.removeItem(CHAVE_TOKEN);
          localStorage.removeItem(CHAVE_CONTA);
          atualizarContaNaInterface();
        });
      }
    } catch (e) {
      localStorage.removeItem(CHAVE_TOKEN);
      localStorage.removeItem(CHAVE_CONTA);
    }
  }
}

function definirTema(tema) {
  var escolhido = tema === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = escolhido;
  localStorage.setItem(CHAVE_TEMA, escolhido);
  atualizarOpcoesTema();
}

function carregarTema() {
  var salvo = localStorage.getItem(CHAVE_TEMA) || "light";
  document.documentElement.dataset.theme = salvo === "dark" ? "dark" : "light";
}

function atualizarOpcoesTema() {
  var atual = document.documentElement.dataset.theme || "light";
  document.querySelectorAll("[data-theme-option]").forEach(function (b) {
    var sel = b.dataset.themeOption === atual;
    b.classList.toggle("selecionado", sel);
    b.setAttribute("aria-pressed", String(sel));
  });
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarTelefone(n) {
  if (n.length <= 2) return n;
  if (n.length <= 6) return "(" + n.slice(0, 2) + ") " + n.slice(2);
  if (n.length <= 10) return "(" + n.slice(0, 2) + ") " + n.slice(2, 6) + "-" + n.slice(6);
  return "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
}

function obterPrimeiroNome(nome) {
  return String(nome || "cliente").trim().split(/\s+/)[0] || "cliente";
}

function atualizarNavegacao(aba) {
  document.querySelectorAll("[data-aba]").forEach(function (b) {
    b.classList.toggle("active-nav", b.dataset.aba === aba);
  });
}

function rolarParaSecao(secao) {
  var nav = document.querySelector("nav");
  var altura = nav ? nav.offsetHeight : 0;
  var destino = secao.getBoundingClientRect().top + window.pageYOffset - altura - 12;
  window.scrollTo({ top: Math.max(destino, 0), behavior: "smooth" });
}

function inicializarImagensFallback() {
  var logo = document.querySelector(".logo-header");
  if (logo) aplicarFallbackLogo(logo);
  document.querySelectorAll(".produto-card > img").forEach(function (img) {
    aplicarFallbackProduto(img, img.alt || "Produto");
  });
}

function aplicarFallbackLogo(logo) {
  var feito = false;
  function trocar() {
    if (feito || !logo.parentNode) return;
    feito = true;
    var fb = document.createElement("div");
    fb.className = "logo-fallback";
    fb.textContent = "CV";
    logo.replaceWith(fb);
  }
  logo.addEventListener("error", trocar, { once: true });
  if (logo.complete && logo.naturalWidth === 0) trocar();
}

function aplicarFallbackProduto(img, texto) {
  var feito = false;
  function trocar() {
    if (feito || !img.parentNode) return;
    feito = true;
    var ph = document.createElement("div");
    ph.className = "produto-placeholder";
    ph.textContent = texto;
    img.replaceWith(ph);
  }
  img.addEventListener("error", trocar, { once: true });
  if (img.complete && img.naturalWidth === 0) trocar();
}

function aplicarFallbackCarrinho(img, texto) {
  var feito = false;
  function trocar() {
    if (feito || !img.parentNode) return;
    feito = true;
    var ph = document.createElement("div");
    ph.className = "item-carrinho-placeholder";
    ph.textContent = obterIniciaisProduto(texto);
    img.replaceWith(ph);
  }
  img.addEventListener("error", trocar, { once: true });
  if (img.complete && img.naturalWidth === 0) trocar();
}

function obterIniciaisProduto(texto) {
  return texto.split(" ").filter(function (p) { return p.length > 2; }).slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || "CV";
}

function inicializarModalPix() {
  var modal = document.getElementById("pixModal");
  if (!modal) return;
  modal.addEventListener("click", function (e) { if (e.target === modal) fecharPix(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.style.display === "flex") fecharPix();
      if (document.getElementById("authModal").classList.contains("aberto")) fecharLogin();
      if (document.getElementById("configuracoes").classList.contains("active")) fecharConfiguracoes();
    }
  });
}

function mostrarToastSite(msg) {
  var t = document.getElementById("toastSite");
  if (!t) return;
  clearTimeout(t.timer);
  t.textContent = msg;
  t.classList.add("mostrar");
  t.timer = setTimeout(function () { t.classList.remove("mostrar"); }, 2400);
}

function preencherPrecos() {
  Object.keys(PRODUTOS).forEach(function (cod) {
    var p = PRODUTOS[cod];
    var el = document.getElementById(p.elementoPreco);
    if (el) el.textContent = formatarMoeda(p.preco);
  });
}

function abrirPix(codigoProduto) {
  if (!exigirLogin(function () { abrirPix(codigoProduto); })) return;
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;
  var preco = formatarMoeda(produto.preco);
  var pix = montarPixCopiaECola(produto, codigoProduto);
  produtoPixAtual = { produto: produto, precoFormatado: preco };
  document.getElementById("pixModal").style.display = "flex";
  document.getElementById("produtoPix").innerHTML = "Produto: <b>" + produto.nome + "</b><br>Valor: <b>" + preco + "</b>";
  document.getElementById("pixCopiaCola").value = pix;
  document.getElementById("pixQrCode").src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(pix);
  document.getElementById("pixStatus").textContent = "Escolha o comprovante para enviar pelo WhatsApp.";
  prepararComprovante();
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fazerPedidoWhatsApp(codigoProduto) {
  if (!exigirLogin(function () { fazerPedidoWhatsApp(codigoProduto); })) return;
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;
  var msg = "Ola, quero fazer um pedido de " + produto.nome + " no valor de " + formatarMoeda(produto.preco) + ".";
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
}

function adicionarAoCarrinho(codigoProduto, botao) {
  if (!exigirLogin(function () { adicionarAoCarrinho(codigoProduto, botao); })) return;
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;
  if (!carrinho[codigoProduto]) carrinho[codigoProduto] = 0;
  carrinho[codigoProduto]++;
  salvarCarrinho();
  atualizarCarrinho();
  animarProdutoAdicionado(botao);
  mostrarStatusCarrinho(produto.nome + " adicionado ao carrinho.");
  mostrarToastSite(produto.nome + " adicionado ao carrinho.");
}

function animarProdutoAdicionado(botao) {
  var contador = document.getElementById("contadorCarrinho");
  if (botao) {
    var original = botao.dataset.textoOriginal || botao.textContent;
    var card = botao.closest(".card");
    botao.dataset.textoOriginal = original;
    clearTimeout(botao.timerAdicionado);
    botao.textContent = "Adicionado!";
    botao.classList.remove("adicionado");
    void botao.offsetWidth;
    botao.classList.add("adicionado");
    if (card) {
      card.classList.remove("produto-adicionado");
      void card.offsetWidth;
      card.classList.add("produto-adicionado");
      animarImagemParaCarrinho(card, contador);
    }
    botao.timerAdicionado = setTimeout(function () {
      botao.textContent = original;
      botao.classList.remove("adicionado");
      delete botao.dataset.textoOriginal;
      if (card) card.classList.remove("produto-adicionado");
    }, 1200);
  }
  if (contador) {
    clearTimeout(contador.timerAnimacao);
    contador.classList.remove("contador-animado");
    void contador.offsetWidth;
    contador.classList.add("contador-animado");
    contador.timerAnimacao = setTimeout(function () { contador.classList.remove("contador-animado"); }, 800);
  }
}

function animarImagemParaCarrinho(card, contador) {
  var img = card ? card.querySelector("img, .produto-placeholder") : null;
  var dest = contador ? contador.closest("button") || contador : null;
  if (!img || !dest) return;
  var inicio = img.getBoundingClientRect();
  var fim = dest.getBoundingClientRect();
  var clone = img.cloneNode(true);
  var dx = fim.left + fim.width / 2 - inicio.left - inicio.width / 2;
  var dy = fim.top + fim.height / 2 - inicio.top - inicio.height / 2;
  clone.className = img.classList.contains("produto-placeholder") ? "imagem-voando-carrinho imagem-voando-placeholder" : "imagem-voando-carrinho";
  clone.style.left = inicio.left + "px";
  clone.style.top = inicio.top + "px";
  clone.style.width = inicio.width + "px";
  clone.style.height = inicio.height + "px";
  clone.style.transition = "all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  document.body.appendChild(clone);
  requestAnimationFrame(function () {
    clone.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.18)";
    clone.style.opacity = "0";
  });
  setTimeout(function () { clone.remove(); }, 1500);
}

function alterarQuantidadeCarrinho(cod, qtd) {
  if (!carrinho[cod]) return;
  carrinho[cod] += qtd;
  if (carrinho[cod] <= 0) delete carrinho[cod];
  salvarCarrinho();
  atualizarCarrinho();
}

function removerDoCarrinho(cod) { delete carrinho[cod]; salvarCarrinho(); atualizarCarrinho(); }

function limparCarrinho() {
  Object.keys(carrinho).forEach(function (k) { delete carrinho[k]; });
  salvarCarrinho();
  atualizarCarrinho();
  mostrarStatusCarrinho("Carrinho limpo.");
  mostrarToastSite("Carrinho limpo.");
}

function atualizarCarrinho() {
  var lista = document.getElementById("listaCarrinho");
  var vazio = document.getElementById("carrinhoVazio");
  var total = document.getElementById("totalCarrinho");
  var contador = document.getElementById("contadorCarrinho");
  var linhas = montarLinhasCarrinho();
  if (contador) contador.textContent = contarItensCarrinho();
  if (total) total.textContent = formatarMoeda(calcularTotalCarrinho());
  if (!lista || !vazio) return;
  lista.innerHTML = "";
  vazio.style.display = linhas.length === 0 ? "block" : "none";
  linhas.forEach(function (item) {
    var div = document.createElement("div");
    div.className = "item-carrinho";
    var img = document.createElement("img");
    img.src = IMAGENS_PRODUTOS[item.codigo] || "";
    img.alt = item.produto.nome;
    img.className = "item-carrinho-imagem";
    aplicarFallbackCarrinho(img, item.produto.nome);
    var info = document.createElement("div");
    info.className = "item-carrinho-info";
    var nome = document.createElement("strong");
    nome.textContent = item.produto.nome;
    var preco = document.createElement("span");
    preco.textContent = item.quantidade + " x " + formatarMoeda(item.produto.preco) + " = " + formatarMoeda(item.subtotal);
    info.appendChild(nome);
    info.appendChild(preco);
    var ctrl = document.createElement("div");
    ctrl.className = "item-carrinho-controles";
    var btnMenos = document.createElement("button");
    btnMenos.className = "btn-quantidade"; btnMenos.type = "button"; btnMenos.textContent = "-";
    btnMenos.onclick = function () { alterarQuantidadeCarrinho(item.codigo, -1); };
    var qtdSpan = document.createElement("span");
    qtdSpan.className = "quantidade-carrinho"; qtdSpan.textContent = item.quantidade;
    var btnMais = document.createElement("button");
    btnMais.className = "btn-quantidade"; btnMais.type = "button"; btnMais.textContent = "+";
    btnMais.onclick = function () { alterarQuantidadeCarrinho(item.codigo, 1); };
    var btnRem = document.createElement("button");
    btnRem.className = "btn-remover"; btnRem.type = "button"; btnRem.textContent = "Remover";
    btnRem.onclick = function () { removerDoCarrinho(item.codigo); };
    ctrl.appendChild(btnMenos); ctrl.appendChild(qtdSpan); ctrl.appendChild(btnMais); ctrl.appendChild(btnRem);
    div.appendChild(img); div.appendChild(info); div.appendChild(ctrl);
    lista.appendChild(div);
  });
}

function montarLinhasCarrinho() {
  return Object.keys(carrinho).map(function (cod) {
    var p = PRODUTOS[cod];
    var q = carrinho[cod];
    if (!p || q <= 0) return null;
    return { codigo: cod, produto: p, quantidade: q, subtotal: p.preco * q };
  }).filter(function (i) { return i !== null; });
}

function contarItensCarrinho() {
  return montarLinhasCarrinho().reduce(function (t, i) { return t + i.quantidade; }, 0);
}

function calcularTotalCarrinho() {
  return montarLinhasCarrinho().reduce(function (t, i) { return t + i.subtotal; }, 0);
}

function finalizarCarrinhoWhatsApp() {
  if (contarItensCarrinho() === 0) { mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho."); return; }
  if (!exigirLogin(finalizarCarrinhoWhatsApp)) return;

  var items = montarLinhasCarrinho().map(function (i) { return { code: i.codigo, quantity: i.quantidade }; });
  api("/orders", { method: "POST", body: { items: items } }).then(function () {
    var msg = "Ola, quero fazer este pedido:\n\n" + montarResumoCarrinhoTexto() + "\n\nTotal: " + formatarMoeda(calcularTotalCarrinho()) + ".";
    window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
    Object.keys(carrinho).forEach(function (k) { delete carrinho[k]; });
    salvarCarrinho();
    atualizarCarrinho();
    mostrarStatusCarrinho("Pedido registrado e enviado! Carrinho limpo.");
    mostrarToastSite("Pedido registrado e enviado!");
  }).catch(function (err) { mostrarToastSite(err.message); });
}

function abrirPixCarrinho() {
  var total = calcularTotalCarrinho();
  if (total === 0) { mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho."); return; }
  if (!exigirLogin(abrirPixCarrinho)) return;
  var preco = formatarMoeda(total);
  var prod = { nome: "Pedido Caseirinhos", preco: total };
  var pix = montarPixCopiaECola(prod, "carrinho");
  produtoPixAtual = { produto: { nome: "Pedido do carrinho com " + contarItensCarrinho() + " item(ns)", preco: total }, precoFormatado: preco, resumo: montarResumoCarrinhoTexto() };
  document.getElementById("pixModal").style.display = "flex";
  document.getElementById("produtoPix").innerHTML = "Pedido do carrinho:<br>" + montarResumoCarrinhoHtml() + "<br>Total: <b>" + preco + "</b>";
  document.getElementById("pixCopiaCola").value = pix;
  document.getElementById("pixQrCode").src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(pix);
  document.getElementById("pixStatus").textContent = "PIX gerado para o total do carrinho. Escolha o comprovante para enviar.";
  prepararComprovante();
}

function montarResumoCarrinhoTexto() {
  return montarLinhasCarrinho().map(function (i) { return "- " + i.quantidade + "x " + i.produto.nome + " = " + formatarMoeda(i.subtotal); }).join("\n");
}

function montarResumoCarrinhoHtml() {
  return montarLinhasCarrinho().map(function (i) { return i.quantidade + "x " + i.produto.nome + " - <b>" + formatarMoeda(i.subtotal) + "</b>"; }).join("<br>");
}

function mostrarStatusCarrinho(msg) {
  var el = document.getElementById("carrinhoStatus");
  if (el) el.textContent = msg;
}

function prepararComprovante() {
  var campo = document.getElementById("comprovantePix");
  var nome = document.getElementById("nomeComprovante");
  var btn = document.getElementById("btnWhatsapp");
  if (campo) campo.value = "";
  if (nome) nome.textContent = "Nenhum comprovante selecionado";
  if (btn) btn.disabled = true;
}

function atualizarComprovante() {
  var campo = document.getElementById("comprovantePix");
  var nome = document.getElementById("nomeComprovante");
  var btn = document.getElementById("btnWhatsapp");
  var status = document.getElementById("pixStatus");
  var arquivo = campo && campo.files ? campo.files[0] : null;
  if (!arquivo) { if (nome) nome.textContent = "Nenhum comprovante selecionado"; if (btn) btn.disabled = true; return; }
  if (nome) nome.textContent = "Selecionado: " + arquivo.name;
  if (btn) btn.disabled = false;
  if (status) status.textContent = "Comprovante pronto para enviar.";
}

function enviarComprovanteWhatsApp() {
  var campo = document.getElementById("comprovantePix");
  var status = document.getElementById("pixStatus");
  var arquivo = campo && campo.files ? campo.files[0] : null;
  if (!produtoPixAtual) { if (status) status.textContent = "Abra o pagamento de um produto primeiro."; return; }
  if (!arquivo) { if (status) status.textContent = "Escolha o comprovante antes de enviar."; return; }
  var msg = "Ola, Val! Ja fiz o pagamento do " + produtoPixAtual.produto.nome + " no valor de " + produtoPixAtual.precoFormatado + ". Meu comprovante esta selecionado: " + arquivo.name;
  if (produtoPixAtual.resumo) msg += "\n\nPedido:\n" + produtoPixAtual.resumo;
  msg += "\n\nVou enviar o comprovante por aqui.";
  if (status) status.textContent = "WhatsApp aberto. Anexe o comprovante na conversa antes de enviar.";
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
}

function montarPixCopiaECola(produto, codigoProduto) {
  var dados = campoPix("00", "br.gov.bcb.pix") + campoPix("01", PIX_CHAVE) + campoPix("02", produto.nome);
  var txid = codigoProduto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 25) || "***";
  var payload = campoPix("00", "01") + campoPix("01", "12") + campoPix("26", dados) + campoPix("52", "0000") + campoPix("53", "986") + campoPix("54", produto.preco.toFixed(2)) + campoPix("58", "BR") + campoPix("59", PIX_NOME_RECEBEDOR.slice(0, 25)) + campoPix("60", PIX_CIDADE.slice(0, 15)) + campoPix("62", campoPix("05", txid)) + "6304";
  return payload + calcularCrc16(payload);
}

function campoPix(id, valor) {
  return id + String(valor.length).padStart(2, "0") + valor;
}

function calcularCrc16(payload) {
  var crc = 0xFFFF;
  for (var i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (var bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) { crc = (crc << 1) ^ 0x1021; } else { crc <<= 1; }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function copiarPix() {
  var campo = document.getElementById("pixCopiaCola");
  campo.select();
  campo.setSelectionRange(0, 99999);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(campo.value).then(function () {
      document.getElementById("pixStatus").textContent = "PIX copiado";
      mostrarToastSite("PIX copiado.");
    }).catch(function () { copiarComMetodoAntigo(); });
  } else { copiarComMetodoAntigo(); }
}

function copiarComMetodoAntigo() {
  if (document.execCommand("copy")) {
    document.getElementById("pixStatus").textContent = "PIX copiado";
    mostrarToastSite("PIX copiado.");
  } else {
    document.getElementById("pixStatus").textContent = "nao foi possivel copiar";
    mostrarToastSite("Nao foi possivel copiar o PIX.");
  }
}

function fecharPix() { document.getElementById("pixModal").style.display = "none"; }

function salvarCarrinho() { localStorage.setItem("carrinhoCSV", JSON.stringify(carrinho)); }

function carregarCarrinho() {
  var salvo = localStorage.getItem("carrinhoCSV");
  if (salvo) {
    try {
      var dados = JSON.parse(salvo);
      Object.keys(dados).forEach(function (k) { carrinho[k] = dados[k]; });
    } catch (e) { console.error("Erro ao carregar carrinho:", e); }
  }
}
