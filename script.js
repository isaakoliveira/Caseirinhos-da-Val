const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
const WHATSAPP_VAL = "5583982168114";

// ===== API / LOGIN =====
const API_BASE = location.protocol === "file:" ? "http://localhost:5000/api" : "/api";
// Preencha com o Client ID do Google Cloud Console:
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = "COLE_AQUI_SEU_CLIENT_ID_GOOGLE";

let produtoPixAtual = null;
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

carregarCarrinho();
preencherPrecos();
atualizarCarrinho();
inicializarInterface();

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
  inicializarConfiguracoes();
  inicializarTema();
  inicializarLoginModal();
  inicializarSessao();
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
    if (e.key === "Escape" && modal.style.display === "flex") fecharPix();
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
  var nome = nomeUsuario || "Cliente";
  var msg = "Ola, Val! Me chamo " + nome + ". Quero fazer um pedido de " + produto.nome + " no valor de " + formatarMoeda(produto.preco) + ".";
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
  mostrarToastSite("Obrigado pela preferencia, " + (nomeUsuario ? nomeUsuario.split(" ")[0] : "cliente") + "!");
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

  var nome = nomeUsuario || "Cliente";
  var msg = "Ola, Val! Me chamo " + nome + ". Quero fazer este pedido:\n\n" + montarResumoCarrinhoTexto() + "\n\nTotal: " + formatarMoeda(calcularTotalCarrinho()) + ".";
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
  Object.keys(carrinho).forEach(function (k) { delete carrinho[k]; });
  salvarCarrinho();
  atualizarCarrinho();
  mostrarStatusCarrinho("Pedido enviado! Carrinho limpo.");
  mostrarToastSite("Obrigado pela preferencia, " + (nomeUsuario ? nomeUsuario.split(" ")[0] : "cliente") + "!");
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
  var nome = nomeUsuario || "Cliente";
  var msg = "Ola, Val! Me chamo " + nome + ". Ja fiz o pagamento do " + produtoPixAtual.produto.nome + " no valor de " + produtoPixAtual.precoFormatado + ". Meu comprovante esta selecionado: " + arquivo.name;
  if (produtoPixAtual.resumo) msg += "\n\nPedido:\n" + produtoPixAtual.resumo;
  msg += "\n\nVou enviar o comprovante por aqui.";
  if (status) status.textContent = "WhatsApp aberto. Anexe o comprovante na conversa antes de enviar.";
  window.open("https://wa.me/" + WHATSAPP_VAL + "?text=" + encodeURIComponent(msg), "_blank");
  mostrarToastSite("Obrigado pela preferencia, " + (nomeUsuario ? nomeUsuario.split(" ")[0] : "cliente") + "!");
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

// ===== CONTA / LOGIN =====
var tokenSessao = localStorage.getItem("tokenSessao") || null;
var usuarioAtual = null;
var nomeUsuario = null;
var acaoAposLogin = null;

try { usuarioAtual = JSON.parse(localStorage.getItem("usuarioSessao") || "null"); } catch (e) { usuarioAtual = null; }
if (usuarioAtual) nomeUsuario = usuarioAtual.username;

function chamarApi(caminho, opcoes) {
  opcoes = opcoes || {};
  var headers = { "Content-Type": "application/json" };
  if (tokenSessao) headers["Authorization"] = "Bearer " + tokenSessao;
  var init = { method: opcoes.method || "GET", headers: headers };
  if (opcoes.body) init.body = JSON.stringify(opcoes.body);
  return fetch(API_BASE + caminho, init).then(function (resp) {
    return resp.json().then(function (dados) {
      return { ok: resp.ok, dados: dados };
    });
  });
}

function inicializarSessao() {
  if (!tokenSessao) { atualizarContaNaInterface(); return; }
  chamarApi("/me").then(function (r) {
    if (r.ok) {
      usuarioAtual = r.dados.user;
      nomeUsuario = usuarioAtual.username;
      localStorage.setItem("usuarioSessao", JSON.stringify(usuarioAtual));
    } else {
      encerrarSessaoLocal();
    }
    atualizarContaNaInterface();
  }).catch(function () {
    atualizarContaNaInterface();
  });
}

function aplicarSessao(dados) {
  tokenSessao = dados.token;
  usuarioAtual = dados.user;
  nomeUsuario = dados.user.username;
  localStorage.setItem("tokenSessao", tokenSessao);
  localStorage.setItem("usuarioSessao", JSON.stringify(usuarioAtual));
  atualizarContaNaInterface();
  var acao = acaoAposLogin;
  acaoAposLogin = null;
  mostrarToastSite("Bem-vindo, " + nomeUsuario.split(" ")[0] + "!");
  if (acao) setTimeout(acao, 150);
}

function encerrarSessaoLocal() {
  tokenSessao = null;
  usuarioAtual = null;
  nomeUsuario = null;
  localStorage.removeItem("tokenSessao");
  localStorage.removeItem("usuarioSessao");
}

function sairDaConta() {
  chamarApi("/logout", { method: "POST" }).catch(function () {});
  encerrarSessaoLocal();
  atualizarContaNaInterface();
  mostrarToastSite("Voce saiu da conta.");
}

function exigirLogin(acao) {
  if (usuarioAtual) return true;
  acaoAposLogin = acao;
  abrirLogin();
  return false;
}

function atualizarContaNaInterface() {
  var titulo = document.getElementById("heroAccountTitle");
  var desc = document.getElementById("heroAccountDescription");
  var botao = document.getElementById("heroAccountButton");
  var settingsDisplay = document.getElementById("settingsAccountDisplay");

  if (usuarioAtual) {
    var primeiro = nomeUsuario.split(" ")[0];
    if (titulo) titulo.textContent = "Ola, " + primeiro + "!";
    if (desc) desc.textContent = "Voce esta logado. Pronto para fazer seu pedido.";
    if (botao) { botao.textContent = "Sair"; botao.onclick = sairDaConta; }
    if (settingsDisplay) {
      var contatos = [usuarioAtual.email, usuarioAtual.phone].filter(Boolean).join(" | ");
      settingsDisplay.innerHTML = "Logado como: <b>" + nomeUsuario + "</b>" +
        (contatos ? "<br><span class=\"settings-account-contatos\">" + contatos + "</span>" : "");
    }
  } else {
    if (titulo) titulo.textContent = "Entrar para comprar";
    if (desc) desc.textContent = "Faca login com e-mail, telefone ou Google.";
    if (botao) { botao.textContent = "Entrar"; botao.onclick = abrirLogin; }
    if (settingsDisplay) settingsDisplay.textContent = "Voce nao esta logado.";
  }
}

// ===== MODAL DE LOGIN =====
function inicializarLoginModal() {
  var el = document.getElementById("loginModal");
  if (!el) return;
  el.addEventListener("click", function (e) { if (e.target === el) fecharLogin(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fecharLogin();
    if (e.key === "Enter") {
      var visivel = el.classList.contains("active");
      if (!visivel || !e.target || !e.target.classList) return;
      if (!e.target.classList.contains("login-input")) return;
      e.preventDefault();
      var tab = document.querySelector(".login-tab.active");
      var modo = tab ? tab.dataset.loginTab : "email";
      if (modo === "email") loginComEmail();
      else if (modo === "telefone") loginComTelefone();
      else if (modo === "cadastro") cadastrarUsuario();
    }
  });
}

function abrirLogin() {
  var el = document.getElementById("loginModal");
  if (!el) return;
  el.classList.add("active");
  el.setAttribute("aria-hidden", "false");
  mostrarLoginStatus("");
  carregarBotaoGoogle();
  setTimeout(function () {
    var i = document.getElementById("loginEmail");
    if (i) i.focus();
  }, 120);
}

function fecharLogin() {
  var el = document.getElementById("loginModal");
  if (!el) return;
  el.classList.remove("active");
  el.setAttribute("aria-hidden", "true");
}

function mostrarLoginStatus(msg, tipo) {
  var s = document.getElementById("loginStatus");
  if (!s) return;
  s.textContent = msg;
  s.className = "login-status" + (tipo ? " " + tipo : "");
}

function trocarLoginTab(modo) {
  ["email", "telefone", "cadastro"].forEach(function (m) {
    var painel = document.getElementById("loginTab" + m.charAt(0).toUpperCase() + m.slice(1));
    if (painel) painel.style.display = m === modo ? "" : "none";
    var tab = document.querySelector('.login-tab[data-login-tab="' + m + '"]');
    if (tab) tab.classList.toggle("active", m === modo);
  });
  mostrarLoginStatus("");
}

function normalizarTelefone(v) {
  return (v || "").replace(/[^\d+]/g, "");
}

function desabilitarBotoesLogin(desabilitar) {
  ["btnLoginEmail", "btnLoginTelefone", "btnCadastrar"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.disabled = desabilitar;
  });
}

function loginComEmail() {
  var email = (document.getElementById("loginEmail").value || "").trim().toLowerCase();
  var senha = document.getElementById("loginSenha").value || "";
  if (!email || !senha) { mostrarLoginStatus("Preencha e-mail e senha.", "erro"); return; }
  desabilitarBotoesLogin(true);
  mostrarLoginStatus("Entrando...");
  chamarApi("/login", { method: "POST", body: { email: email, password: senha } }).then(function (r) {
    desabilitarBotoesLogin(false);
    if (r.ok) {
      aplicarSessao(r.dados);
      fecharLogin();
    } else {
      mostrarLoginStatus((r.dados && r.dados.erro) || "Nao foi possivel entrar.", "erro");
    }
  }).catch(function () {
    desabilitarBotoesLogin(false);
    mostrarLoginStatus("Servidor offline. Rode o comando: python app.py", "erro");
  });
}

function loginComTelefone() {
  var phone = normalizarTelefone(document.getElementById("loginTelefone").value);
  var senha = document.getElementById("loginTelefoneSenha").value || "";
  if (!phone || !senha) { mostrarLoginStatus("Preencha telefone e senha.", "erro"); return; }
  desabilitarBotoesLogin(true);
  mostrarLoginStatus("Entrando...");
  chamarApi("/login-phone", { method: "POST", body: { phone: phone, password: senha } }).then(function (r) {
    desabilitarBotoesLogin(false);
    if (r.ok) {
      aplicarSessao(r.dados);
      fecharLogin();
    } else {
      mostrarLoginStatus((r.dados && r.dados.erro) || "Nao foi possivel entrar.", "erro");
    }
  }).catch(function () {
    desabilitarBotoesLogin(false);
    mostrarLoginStatus("Servidor offline. Rode o comando: python app.py", "erro");
  });
}

function cadastrarUsuario() {
  var username = (document.getElementById("cadUsername").value || "").trim();
  var email = (document.getElementById("cadEmail").value || "").trim().toLowerCase();
  var phone = normalizarTelefone(document.getElementById("cadTelefone").value);
  var senha = document.getElementById("cadSenha").value || "";

  if (username.length < 2) { mostrarLoginStatus("Escolha um nome de usuario.", "erro"); return; }
  if (!email && !phone) { mostrarLoginStatus("Informe e-mail ou telefone.", "erro"); return; }
  if (senha.length < 6) { mostrarLoginStatus("A senha precisa de pelo menos 6 caracteres.", "erro"); return; }

  desabilitarBotoesLogin(true);
  mostrarLoginStatus("Criando conta...");
  chamarApi("/register", {
    method: "POST",
    body: { username: username, email: email, phone: phone, password: senha }
  }).then(function (r) {
    desabilitarBotoesLogin(false);
    if (r.ok) {
      aplicarSessao(r.dados);
      fecharLogin();
    } else {
      mostrarLoginStatus((r.dados && r.dados.erro) || "Nao foi possivel criar a conta.", "erro");
    }
  }).catch(function () {
    desabilitarBotoesLogin(false);
    mostrarLoginStatus("Servidor offline. Rode o comando: python app.py", "erro");
  });
}

// ===== GOOGLE =====
function carregarBotaoGoogle() {
  var area = document.getElementById("loginGoogle");
  if (!area) return;
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf("COLE_AQUI") === 0) {
    area.innerHTML = "<p class=\"google-aviso\">Login com Google precisa de um Client ID. Veja o topo do script.js.</p>";
    return;
  }
  if (typeof google === "undefined") {
    var s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = iniciarBotaoGoogle;
    s.onerror = function () {
      area.innerHTML = "<p class=\"google-aviso\">Nao foi possivel carregar o Google.</p>";
    };
    document.head.appendChild(s);
  } else {
    iniciarBotaoGoogle();
  }
}

function iniciarBotaoGoogle() {
  var area = document.getElementById("loginGoogle");
  if (!area) return;
  area.innerHTML = "";
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: respostaGoogle,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  google.accounts.id.renderButton(area, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: 280
  });
}

function respostaGoogle(resposta) {
  if (!resposta || !resposta.credential) { mostrarLoginStatus("Falha no login com o Google.", "erro"); return; }
  mostrarLoginStatus("Entrando com o Google...");
  chamarApi("/google-login", { method: "POST", body: { credential: resposta.credential } }).then(function (r) {
    if (r.ok) {
      aplicarSessao(r.dados);
      fecharLogin();
    } else {
      mostrarLoginStatus((r.dados && r.dados.erro) || "Nao foi possivel entrar com o Google.", "erro");
    }
  }).catch(function () {
    mostrarLoginStatus("Servidor offline. Rode o comando: python app.py", "erro");
  });
}

// ===== TROCAR NOME DE USUARIO =====
function trocarNomeUsuario() {
  var area = document.getElementById("renomearArea");
  var input = document.getElementById("inputNovoUsuario");
  if (!area || !input) return;
  var aberto = area.style.display !== "none";
  area.style.display = aberto ? "none" : "block";
  if (!aberto) {
    input.value = usuarioAtual ? usuarioAtual.username : "";
    input.focus();
  }
}

function confirmarNovoUsuario() {
  if (!usuarioAtual) { mostrarToastSite("Faca login primeiro."); return; }
  var novo = (document.getElementById("inputNovoUsuario").value || "").trim();
  if (novo.length < 2) { mostrarToastSite("Nome de usuario muito curto."); return; }
  chamarApi("/update-username", { method: "POST", body: { username: novo } }).then(function (r) {
    if (r.ok) {
      usuarioAtual = r.dados.user;
      nomeUsuario = usuarioAtual.username;
      localStorage.setItem("usuarioSessao", JSON.stringify(usuarioAtual));
      atualizarContaNaInterface();
      var area = document.getElementById("renomearArea");
      if (area) area.style.display = "none";
      mostrarToastSite("Nome de usuario atualizado.");
    } else {
      mostrarToastSite((r.dados && r.dados.erro) || "Nao foi possivel atualizar.");
    }
  }).catch(function () {
    mostrarToastSite("Servidor offline. Rode o comando: python app.py");
  });
}

// ===== CONFIGURACOES / TEMA =====
function inicializarConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (el) {
    el.addEventListener("click", function (e) {
      if (e.target === el) fecharConfiguracoes();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (el?.classList.contains("active")) fecharConfiguracoes();
    }
  });
}

function abrirConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (!el) return;
  el.classList.add("active");
  el.setAttribute("aria-hidden", "false");
}

function fecharConfiguracoes() {
  var el = document.getElementById("configuracoes");
  if (el) {
    el.classList.remove("active");
    el.setAttribute("aria-hidden", "true");
  }
}

function inicializarTema() {
  var salvo = localStorage.getItem("temaSite") || "light";
  definirTema(salvo, true);
}

function definirTema(tema, silencioso) {
  document.documentElement.setAttribute("data-tema", tema);
  localStorage.setItem("temaSite", tema);
  document.querySelectorAll(".theme-option").forEach(function (b) {
    b.classList.toggle("ativo", b.dataset.themeOption === tema);
  });
  if (!silencioso) mostrarToastSite("Tema " + (tema === "dark" ? "escuro" : "claro") + " ativado.");
}
