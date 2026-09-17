/* =========================================================
   Caseirinhos da Val — script principal
   ========================================================= */

const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
const WHATSAPP_VAL = "5583982168114";

const SVG_NS = "http://www.w3.org/2000/svg";
const ABAS = ["doces", "bolos", "carrinho", "contato"];

let produtoPixAtual = null;
let abaAtual = "doces";
let ultimoFoco = null;

const carrinho = {};

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

/* ===== Inicialização ===== */
inicializarTema();
carregarCarrinho();
preencherPrecos();
atualizarCarrinho();
inicializarInterface();

function inicializarInterface() {
  atualizarNavegacao(abaAtual);
  inicializarImagensFallback();
  inicializarModais();
  inicializarDeslize();
  inicializarTeclado();
  medirAlturaNav();
  window.addEventListener("resize", medirAlturaNav);
}

function medirAlturaNav() {
  var nav = document.querySelector(".tabs");
  if (nav) document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
}

/* ===== Ícones ===== */
function criarIcone(id, classe) {
  var svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", classe || "ico");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  var use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "#" + id);
  svg.appendChild(use);
  return svg;
}

/* ===== Navegação entre abas ===== */
function mostrarAba(aba, instantaneo) {
  var destino = document.getElementById(aba);
  if (!destino || ABAS.indexOf(aba) === -1) return;

  var indiceAtual = ABAS.indexOf(abaAtual);
  var indiceNovo = ABAS.indexOf(aba);
  var direcao = indiceNovo > indiceAtual ? "dir" : "esq";

  document.querySelectorAll("main .aba").forEach(function (s) {
    s.classList.remove("active", "entrando-dir", "entrando-esq");
  });

  destino.classList.add("active");
  if (aba !== abaAtual) {
    destino.classList.add(direcao === "dir" ? "entrando-dir" : "entrando-esq");
  }

  abaAtual = aba;
  atualizarNavegacao(aba);
  rolarParaSecao(destino, instantaneo === true);
}

function atualizarNavegacao(aba) {
  var trilho = document.getElementById("tabsTrilho");

  document.querySelectorAll(".nav-link[data-aba]").forEach(function (b) {
    var ativo = b.dataset.aba === aba;
    b.classList.toggle("active-nav", ativo);
    b.setAttribute("aria-selected", ativo ? "true" : "false");
    if (ativo) centralizarAbaNoTrilho(trilho, b);
  });
}

function centralizarAbaNoTrilho(trilho, botao) {
  if (!trilho || trilho.scrollWidth <= trilho.clientWidth + 4) return;
  var alvo = botao.offsetLeft - (trilho.clientWidth - botao.offsetWidth) / 2;
  trilho.scrollTo({ left: Math.max(alvo, 0), behavior: "smooth" });
}

function rolarParaSecao(secao, instantaneo) {
  var nav = document.querySelector(".tabs");
  var altura = nav ? nav.offsetHeight : 0;
  var alvo = secao.getBoundingClientRect().top + window.pageYOffset - altura - 14;
  window.scrollTo({ top: Math.max(alvo, 0), behavior: instantaneo ? "auto" : "smooth" });
}

function irParaAbaVizinha(passo) {
  var indice = ABAS.indexOf(abaAtual) + passo;
  if (indice < 0 || indice >= ABAS.length) return false;
  mostrarAba(ABAS[indice], true);
  return true;
}

/* ===== Deslizar o dedo para trocar de aba ===== */
function inicializarDeslize() {
  var palco = document.getElementById("conteudo");
  if (!palco) return;

  var x0 = 0, y0 = 0, t0 = 0, valido = false;

  palco.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1 || haModalAberto()) { valido = false; return; }
    var alvo = e.target;
    if (alvo.closest && alvo.closest("textarea, input, .stepper, .tabs-trilho, [data-sem-deslize]")) {
      valido = false;
      return;
    }
    valido = true;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    t0 = Date.now();
  }, { passive: true });

  palco.addEventListener("touchend", function (e) {
    if (!valido) return;
    valido = false;
    var toque = e.changedTouches[0];
    if (!toque) return;

    var dx = toque.clientX - x0;
    var dy = toque.clientY - y0;
    var tempo = Date.now() - t0;

    if (tempo > 900) return;
    if (Math.abs(dx) < 55) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.6) return;

    if (irParaAbaVizinha(dx < 0 ? 1 : -1)) esconderDicaDeslize(true);
  }, { passive: true });

  mostrarDicaDeslize();
}

function mostrarDicaDeslize() {
  var dica = document.getElementById("swipeHint");
  if (!dica) return;
  var jaViu = localStorage.getItem("dicaDeslizeCSV") === "1";
  var toque = window.matchMedia("(hover: none)").matches;
  if (!jaViu && toque) {
    dica.classList.add("visivel");
    setTimeout(function () { esconderDicaDeslize(false); }, 9000);
  }
}

function esconderDicaDeslize(salvar) {
  var dica = document.getElementById("swipeHint");
  if (dica) dica.classList.remove("visivel");
  if (salvar) localStorage.setItem("dicaDeslizeCSV", "1");
}

function inicializarTeclado() {
  var trilho = document.getElementById("tabsTrilho");
  if (!trilho) return;
  trilho.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    irParaAbaVizinha(e.key === "ArrowRight" ? 1 : -1);
    var ativo = trilho.querySelector(".active-nav");
    if (ativo) ativo.focus();
  });
}

/* ===== Imagens com reserva ===== */
function inicializarImagensFallback() {
  var logo = document.querySelector(".logo-header");
  if (logo) aplicarFallbackLogo(logo);
  document.querySelectorAll(".produto-card img").forEach(function (img) {
    aplicarFallbackProduto(img, img.alt || "Produto");
  });
}

function aplicarFallbackLogo(logo) {
  trocarAoFalhar(logo, function () {
    var fb = document.createElement("div");
    fb.className = "logo-fallback";
    fb.textContent = "CV";
    return fb;
  });
}

function aplicarFallbackProduto(img, texto) {
  trocarAoFalhar(img, function () {
    var ph = document.createElement("div");
    ph.className = "produto-placeholder";
    ph.textContent = texto;
    return ph;
  });
}

function aplicarFallbackCarrinho(img, texto) {
  trocarAoFalhar(img, function () {
    var ph = document.createElement("div");
    ph.className = "item-carrinho-placeholder";
    ph.textContent = obterIniciaisProduto(texto);
    return ph;
  });
}

function trocarAoFalhar(img, criar) {
  var feito = false;
  function trocar() {
    if (feito || !img.parentNode) return;
    feito = true;
    img.replaceWith(criar());
  }
  img.addEventListener("error", trocar, { once: true });
  if (img.complete && img.naturalWidth === 0) trocar();
}

function obterIniciaisProduto(texto) {
  return texto.split(" ")
    .filter(function (p) { return p.length > 2; })
    .slice(0, 2)
    .map(function (p) { return p.charAt(0).toUpperCase(); })
    .join("") || "CV";
}

/* ===== Preços ===== */
function preencherPrecos() {
  Object.keys(PRODUTOS).forEach(function (cod) {
    var p = PRODUTOS[cod];
    var el = document.getElementById(p.elementoPreco);
    if (el) el.textContent = formatarMoeda(p.preco);
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ===== Pedido direto ===== */
function fazerPedidoWhatsApp(codigoProduto) {
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;
  var msg = "Ola, Val! Quero fazer um pedido de " + produto.nome + " no valor de " + formatarMoeda(produto.preco) + ".";
  abrirWhatsApp(msg);
  mostrarToastSite("Pedido aberto no WhatsApp.");
}

function abrirWhatsApp(mensagem) {
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(mensagem), "_blank");
}

/* ===== Carrinho ===== */
function adicionarAoCarrinho(codigoProduto, botao) {
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;
  carrinho[codigoProduto] = (carrinho[codigoProduto] || 0) + 1;
  salvarCarrinho();
  atualizarCarrinho();
  animarProdutoAdicionado(botao);
  mostrarStatusCarrinho(produto.nome + " adicionado ao carrinho.");
  mostrarToastSite(produto.nome + " adicionado ao carrinho.");
}

function animarProdutoAdicionado(botao) {
  var contador = document.getElementById("contadorCarrinho");

  if (botao) {
    var card = botao.closest(".card");
    if (!botao.dataset.htmlOriginal) botao.dataset.htmlOriginal = botao.innerHTML;
    clearTimeout(botao.timerAdicionado);

    botao.innerHTML = "";
    botao.appendChild(criarIcone("i-check"));
    botao.appendChild(document.createTextNode(" Adicionado"));
    botao.classList.add("adicionado");

    if (card) {
      card.classList.remove("produto-adicionado");
      void card.offsetWidth;
      card.classList.add("produto-adicionado");
      animarImagemParaCarrinho(card, contador);
    }

    botao.timerAdicionado = setTimeout(function () {
      botao.innerHTML = botao.dataset.htmlOriginal;
      botao.classList.remove("adicionado");
      if (card) card.classList.remove("produto-adicionado");
    }, 1200);
  }

  if (contador) {
    clearTimeout(contador.timerAnimacao);
    contador.classList.remove("contador-animado");
    void contador.offsetWidth;
    contador.classList.add("contador-animado");
    contador.timerAnimacao = setTimeout(function () {
      contador.classList.remove("contador-animado");
    }, 700);
  }
}

function animarImagemParaCarrinho(card, contador) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var img = card ? card.querySelector("img, .produto-placeholder") : null;
  var dest = contador ? contador.closest("button") || contador : null;
  if (!img || !dest) return;

  var inicio = img.getBoundingClientRect();
  var fim = dest.getBoundingClientRect();
  var clone = img.cloneNode(true);
  var dx = fim.left + fim.width / 2 - inicio.left - inicio.width / 2;
  var dy = fim.top + fim.height / 2 - inicio.top - inicio.height / 2;

  clone.className = img.classList.contains("produto-placeholder")
    ? "imagem-voando-carrinho imagem-voando-placeholder"
    : "imagem-voando-carrinho";
  clone.style.left = inicio.left + "px";
  clone.style.top = inicio.top + "px";
  clone.style.width = inicio.width + "px";
  clone.style.height = inicio.height + "px";
  clone.style.position = "fixed";
  clone.style.transition = "transform .85s cubic-bezier(.3,.8,.4,1), opacity .85s ease";

  document.body.appendChild(clone);
  requestAnimationFrame(function () {
    clone.style.transform = "translate(" + dx + "px, " + dy + "px) scale(.14)";
    clone.style.opacity = "0";
  });
  setTimeout(function () { clone.remove(); }, 900);
}

function alterarQuantidadeCarrinho(cod, qtd) {
  if (!carrinho[cod]) return;
  carrinho[cod] += qtd;
  if (carrinho[cod] <= 0) delete carrinho[cod];
  salvarCarrinho();
  atualizarCarrinho();
}

function removerDoCarrinho(cod) {
  var p = PRODUTOS[cod];
  delete carrinho[cod];
  salvarCarrinho();
  atualizarCarrinho();
  if (p) mostrarStatusCarrinho(p.nome + " removido do carrinho.");
}

function limparCarrinho() {
  if (contarItensCarrinho() === 0) {
    mostrarStatusCarrinho("O carrinho já está vazio.");
    return;
  }
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
  var resumoItens = document.getElementById("resumoItens");
  var resumoQtd = document.getElementById("carrinhoResumoQtd");

  var linhas = montarLinhasCarrinho();
  var itens = contarItensCarrinho();

  if (contador) contador.textContent = itens;
  if (total) total.textContent = formatarMoeda(calcularTotalCarrinho());
  if (resumoItens) resumoItens.textContent = itens;
  if (resumoQtd) resumoQtd.textContent = itens === 1 ? "1 item" : itens + " itens";
  if (!lista || !vazio) return;

  lista.innerHTML = "";
  vazio.style.display = linhas.length === 0 ? "grid" : "none";

  linhas.forEach(function (item) {
    lista.appendChild(criarLinhaCarrinho(item));
  });
}

function criarLinhaCarrinho(item) {
  var div = document.createElement("div");
  div.className = "item-carrinho";

  var img = document.createElement("img");
  img.src = IMAGENS_PRODUTOS[item.codigo] || "";
  img.alt = item.produto.nome;
  img.className = "item-carrinho-imagem";
  img.loading = "lazy";
  aplicarFallbackCarrinho(img, item.produto.nome);

  var info = document.createElement("div");
  info.className = "item-carrinho-info";
  var nome = document.createElement("strong");
  nome.textContent = item.produto.nome;
  var detalhe = document.createElement("span");
  detalhe.innerHTML = item.quantidade + " x " + formatarMoeda(item.produto.preco) +
    " &middot; <b>" + formatarMoeda(item.subtotal) + "</b>";
  info.appendChild(nome);
  info.appendChild(detalhe);

  var ctrl = document.createElement("div");
  ctrl.className = "item-carrinho-controles";

  var stepper = document.createElement("div");
  stepper.className = "stepper";

  var btnMenos = document.createElement("button");
  btnMenos.className = "btn-quantidade";
  btnMenos.type = "button";
  btnMenos.setAttribute("aria-label", "Diminuir quantidade de " + item.produto.nome);
  btnMenos.appendChild(criarIcone("i-minus"));
  btnMenos.onclick = function () { alterarQuantidadeCarrinho(item.codigo, -1); };

  var qtdSpan = document.createElement("span");
  qtdSpan.className = "quantidade-carrinho";
  qtdSpan.textContent = item.quantidade;

  var btnMais = document.createElement("button");
  btnMais.className = "btn-quantidade";
  btnMais.type = "button";
  btnMais.setAttribute("aria-label", "Aumentar quantidade de " + item.produto.nome);
  btnMais.appendChild(criarIcone("i-plus"));
  btnMais.onclick = function () { alterarQuantidadeCarrinho(item.codigo, 1); };

  stepper.appendChild(btnMenos);
  stepper.appendChild(qtdSpan);
  stepper.appendChild(btnMais);

  var btnRem = document.createElement("button");
  btnRem.className = "btn-remover";
  btnRem.type = "button";
  btnRem.setAttribute("aria-label", "Remover " + item.produto.nome);
  btnRem.title = "Remover";
  btnRem.appendChild(criarIcone("i-trash"));
  btnRem.onclick = function () { removerDoCarrinho(item.codigo); };

  ctrl.appendChild(stepper);
  ctrl.appendChild(btnRem);

  div.appendChild(img);
  div.appendChild(info);
  div.appendChild(ctrl);
  return div;
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
  if (contarItensCarrinho() === 0) {
    mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho.");
    return;
  }
  var msg = "Ola, Val! Quero fazer este pedido:\n\n" + montarResumoCarrinhoTexto() +
    "\n\nTotal: " + formatarMoeda(calcularTotalCarrinho()) + ".";
  abrirWhatsApp(msg);
  Object.keys(carrinho).forEach(function (k) { delete carrinho[k]; });
  salvarCarrinho();
  atualizarCarrinho();
  mostrarStatusCarrinho("Pedido enviado! O carrinho foi esvaziado.");
  mostrarToastSite("Pedido aberto no WhatsApp.");
}

function montarResumoCarrinhoTexto() {
  return montarLinhasCarrinho().map(function (i) {
    return "- " + i.quantidade + "x " + i.produto.nome + " = " + formatarMoeda(i.subtotal);
  }).join("\n");
}

function montarResumoCarrinhoHtml() {
  return montarLinhasCarrinho().map(function (i) {
    return i.quantidade + "x " + i.produto.nome + " - <b>" + formatarMoeda(i.subtotal) + "</b>";
  }).join("<br>");
}

function mostrarStatusCarrinho(msg) {
  var el = document.getElementById("carrinhoStatus");
  if (!el) return;
  el.textContent = msg;
  clearTimeout(el.timerStatus);
  el.timerStatus = setTimeout(function () { el.textContent = ""; }, 6000);
}

function salvarCarrinho() {
  try {
    localStorage.setItem("carrinhoCSV", JSON.stringify(carrinho));
  } catch (e) {
    console.error("Erro ao salvar carrinho:", e);
  }
}

function carregarCarrinho() {
  var salvo = localStorage.getItem("carrinhoCSV");
  if (!salvo) return;
  try {
    var dados = JSON.parse(salvo);
    Object.keys(dados).forEach(function (k) {
      if (PRODUTOS[k]) carrinho[k] = dados[k];
    });
  } catch (e) {
    console.error("Erro ao carregar carrinho:", e);
  }
}

/* ===== PIX ===== */
function abrirPix(codigoProduto) {
  var produto = PRODUTOS[codigoProduto];
  if (!produto) return;

  var preco = formatarMoeda(produto.preco);
  var pix = montarPixCopiaECola(produto, codigoProduto);
  produtoPixAtual = { produto: produto, precoFormatado: preco };

  document.getElementById("produtoPix").innerHTML =
    "Produto: <b>" + produto.nome + "</b><br>Valor: <b>" + preco + "</b>";
  document.getElementById("pixCopiaCola").value = pix;
  document.getElementById("pixQrCode").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodeURIComponent(pix);
  document.getElementById("pixStatus").textContent =
    "Pague pelo QR Code ou pelo código copia e cola. Depois, envie o comprovante para a Val.";

  prepararComprovante();
  abrirModal("pixModal");
}

function abrirPixCarrinho() {
  var total = calcularTotalCarrinho();
  if (total === 0) {
    mostrarStatusCarrinho("Adicione pelo menos um produto ao carrinho.");
    return;
  }

  var preco = formatarMoeda(total);
  var prod = { nome: "Pedido Caseirinhos", preco: total };
  var pix = montarPixCopiaECola(prod, "carrinho");

  produtoPixAtual = {
    produto: { nome: "Pedido do carrinho com " + contarItensCarrinho() + " item(ns)", preco: total },
    precoFormatado: preco,
    resumo: montarResumoCarrinhoTexto()
  };

  document.getElementById("produtoPix").innerHTML =
    "Pedido do carrinho:<br>" + montarResumoCarrinhoHtml() + "<br>Total: <b>" + preco + "</b>";
  document.getElementById("pixCopiaCola").value = pix;
  document.getElementById("pixQrCode").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodeURIComponent(pix);
  document.getElementById("pixStatus").textContent =
    "PIX gerado para o total do carrinho. Depois de pagar, envie o comprovante.";

  prepararComprovante();
  abrirModal("pixModal");
}

function montarPixCopiaECola(produto, codigoProduto) {
  var dados = campoPix("00", "br.gov.bcb.pix") + campoPix("01", PIX_CHAVE) + campoPix("02", produto.nome);
  var txid = codigoProduto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 25) || "***";
  var payload = campoPix("00", "01") + campoPix("01", "12") + campoPix("26", dados) +
    campoPix("52", "0000") + campoPix("53", "986") + campoPix("54", produto.preco.toFixed(2)) +
    campoPix("58", "BR") + campoPix("59", PIX_NOME_RECEBEDOR.slice(0, 25)) +
    campoPix("60", PIX_CIDADE.slice(0, 15)) + campoPix("62", campoPix("05", txid)) + "6304";
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
      definirStatusPix("Código PIX copiado. Cole no aplicativo do seu banco.");
      mostrarToastSite("PIX copiado.");
    }).catch(copiarComMetodoAntigo);
  } else {
    copiarComMetodoAntigo();
  }
}

function copiarComMetodoAntigo() {
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  if (ok) {
    definirStatusPix("Código PIX copiado. Cole no aplicativo do seu banco.");
    mostrarToastSite("PIX copiado.");
  } else {
    definirStatusPix("Não foi possível copiar automaticamente. Selecione o código e copie.");
    mostrarToastSite("Não foi possível copiar o PIX.");
  }
}

function definirStatusPix(msg) {
  var el = document.getElementById("pixStatus");
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
  var arquivo = campo && campo.files ? campo.files[0] : null;

  if (!arquivo) {
    if (nome) nome.textContent = "Nenhum comprovante selecionado";
    if (btn) btn.disabled = true;
    return;
  }
  if (nome) nome.textContent = "Selecionado: " + arquivo.name;
  if (btn) btn.disabled = false;
  definirStatusPix("Comprovante pronto. Toque em enviar para abrir a conversa com a Val.");
}

function enviarComprovanteWhatsApp() {
  var campo = document.getElementById("comprovantePix");
  var arquivo = campo && campo.files ? campo.files[0] : null;

  if (!produtoPixAtual) { definirStatusPix("Abra o pagamento de um produto primeiro."); return; }
  if (!arquivo) { definirStatusPix("Escolha o comprovante antes de enviar."); return; }

  var msg = "Ola, Val! Ja fiz o pagamento do " + produtoPixAtual.produto.nome +
    " no valor de " + produtoPixAtual.precoFormatado +
    ". Meu comprovante esta selecionado: " + arquivo.name;
  if (produtoPixAtual.resumo) msg += "\n\nPedido:\n" + produtoPixAtual.resumo;
  msg += "\n\nVou enviar o comprovante por aqui.";

  definirStatusPix("WhatsApp aberto. Anexe o comprovante na conversa antes de enviar.");
  abrirWhatsApp(msg);
  mostrarToastSite("Comprovante aberto no WhatsApp.");
}

function fecharPix() { fecharModal("pixModal"); }

/* ===== Modais ===== */
function inicializarModais() {
  ["pixModal", "configuracoes"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function (e) {
      if (e.target === el) fecharModal(id);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var aberto = document.querySelector(".modal.active");
    if (aberto) fecharModal(aberto.id);
  });
}

function haModalAberto() {
  return !!document.querySelector(".modal.active");
}

function abrirModal(id) {
  var el = document.getElementById(id);
  if (!el) return;
  ultimoFoco = document.activeElement;
  el.classList.add("active");
  el.setAttribute("aria-hidden", "false");
  document.body.classList.add("sem-rolagem");
  var fechar = el.querySelector(".modal-close");
  if (fechar) setTimeout(function () { fechar.focus(); }, 40);
}

function fecharModal(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("active");
  el.setAttribute("aria-hidden", "true");
  if (!haModalAberto()) document.body.classList.remove("sem-rolagem");
  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  ultimoFoco = null;
}

function abrirConfiguracoes() { abrirModal("configuracoes"); }
function fecharConfiguracoes() { fecharModal("configuracoes"); }

/* ===== Tema ===== */
function inicializarTema() {
  var salvo = localStorage.getItem("temaSite");
  if (!salvo) {
    salvo = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  definirTema(salvo, true);
}

function definirTema(tema, silencioso) {
  document.documentElement.setAttribute("data-tema", tema);
  try { localStorage.setItem("temaSite", tema); } catch (e) { /* ignora */ }

  document.querySelectorAll(".theme-option").forEach(function (b) {
    var ativo = b.dataset.themeOption === tema;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo ? "true" : "false");
  });

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", tema === "dark" ? "#1d1216" : "#ffe0ec");

  if (!silencioso) mostrarToastSite("Tema " + (tema === "dark" ? "escuro" : "claro") + " ativado.");
}

/* ===== Toast ===== */
function mostrarToastSite(msg) {
  var t = document.getElementById("toastSite");
  if (!t) return;
  clearTimeout(t.timer);
  t.textContent = msg;
  t.classList.add("mostrar");
  t.timer = setTimeout(function () { t.classList.remove("mostrar"); }, 2600);
}
