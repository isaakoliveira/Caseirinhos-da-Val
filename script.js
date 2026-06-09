const PIX_CHAVE = "10432316418";
const PIX_NOME_RECEBEDOR = "CASEIRINHOS DA VAL";
const PIX_CIDADE = "PICUI";
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
    preco: 10,
    elementoPreco: "preco-doce-leite"
  },
  pudim18: {
    nome: "Pudim Pequeno (600g)",
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
  const precoFormatado = formatarMoeda(produto.preco);
  const pixCopiaCola = montarPixCopiaECola(produto, codigoProduto);
  const mensagem = "Ola, ja fiz o pagamento do " + produto.nome + " no valor de " + precoFormatado + ".";

  document.getElementById("pixModal").style.display = "flex";
  document.getElementById("produtoPix").innerHTML =
    "Produto: <b>" + produto.nome + "</b><br>Valor: <b>" + precoFormatado + "</b>";
  document.getElementById("pixCopiaCola").value = pixCopiaCola;
  document.getElementById("pixQrCode").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(pixCopiaCola);
  document.getElementById("pixStatus").textContent = "";

  document.getElementById("btnWhatsapp").href =
    "https://wa.me/5583982168114?text=" + encodeURIComponent(mensagem);
}

function formatarMoeda(valor){
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function fazerPedidoWhatsApp(codigoProduto){
  const produto = PRODUTOS[codigoProduto];
  const precoFormatado = formatarMoeda(produto.preco);
  const mensagem = "Ola, quero fazer um pedido de " + produto.nome + " no valor de " + precoFormatado + ".";
  const link = "https://wa.me/5583982168114?text=" + encodeURIComponent(mensagem);

  window.open(link, "_blank");
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
