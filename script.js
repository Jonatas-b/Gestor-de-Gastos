// Gestor mensal - versão simplificada

// Chaves de storage
const KEY_DADOS_MES = "dadosMes"; // objeto do mês atual
const KEY_HISTORICO_MENSAL = "historicoMensal"; // array de snapshots mensais

function mesId(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}-${y}`; // MM-YYYY
}

function formatarMoedaFromDigits(digits) {
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function carregarDadosMes() {
  const raw = localStorage.getItem(KEY_DADOS_MES);
  if (raw) return JSON.parse(raw);
  const obj = { mes: mesId(), salario: "", acrescimo: "", historico: [] };
  localStorage.setItem(KEY_DADOS_MES, JSON.stringify(obj));
  return obj;
}

function salvarDadosMes(obj) {
  localStorage.setItem(KEY_DADOS_MES, JSON.stringify(obj));
}

function snapshotMesAnteriorSeNecessario() {
  const dados = carregarDadosMes();
  const atual = mesId();
  if (dados.mes !== atual) {
    // calcula total de gastos do mês anterior (em centavos)
    const itens = dados.historico || [];
    let totalGastosCents = 0;
    itens.forEach((it) => {
      const valorDigits = (it.valor || "").replace(/\D/g, "");
      const qtd = Number(it.quantidade) || 1;
      totalGastosCents += (Number(valorDigits) || 0) * qtd;
    });

    const salarioCents = Number((dados.salario || "").replace(/\D/g, "")) || 0;
    const acrescCents = Number((dados.acrescimo || "").replace(/\D/g, "")) || 0;
    const saldoFinalCents = salarioCents + acrescCents - totalGastosCents;

    const hist = JSON.parse(localStorage.getItem(KEY_HISTORICO_MENSAL) || "[]");
    hist.push({
      mes: dados.mes,
      dados: {
        salario: dados.salario,
        acrescimo: dados.acrescimo,
        historico: dados.historico,
      },
      saldoFinalCents: saldoFinalCents,
      saldoFinal: formatarMoedaFromDigits(saldoFinalCents),
    });
    localStorage.setItem(KEY_HISTORICO_MENSAL, JSON.stringify(hist));

    // novo mês: soma o saldo final (positivo ou negativo) ao salário do mês seguinte
    const novoSalarioCents = salarioCents + saldoFinalCents;
    const novo = {
      mes: atual,
      salario: formatarMoedaFromDigits(novoSalarioCents),
      acrescimo: "",
      historico: [],
    };
    salvarDadosMes(novo);
    return novo;
  }
  return dados;
}

function mostrarMesAtualNoTopo() {
  const el = document.getElementById("mesAtual");
  if (!el) return;
  el.textContent = `Mês: ${mesId().replace("-", " / ")}`; // ex: 02/2026
}

function carregarInterfaceDoMes() {
  const dados = carregarDadosMes();
  document.getElementById("salario").value = dados.salario || "";
  document.getElementById("acrescimo").value = dados.acrescimo || "";

  const tbody = document
    .getElementById("tabelaProdutos")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  (dados.historico || []).forEach((item, idx) => {
    const tr = tbody.insertRow();
    tr.insertCell(0).textContent = item.produto;
    tr.insertCell(1).textContent = item.quantidade;
    tr.insertCell(2).textContent = item.valor;
    tr.insertCell(3).textContent = item.data;
    const cAcoes = tr.insertCell(4);
    const btnE = document.createElement("button");
    btnE.classList.add("btnTabela");
    btnE.textContent = "Editar";
    btnE.onclick = () => editarItem(idx);
    btnE.style.marginRight = "8px";
    const btnX = document.createElement("button");
    btnX.classList.add("btnTabela");
    btnX.textContent = "Excluir";
    btnX.onclick = () => excluirItem(idx);
    cAcoes.appendChild(btnE);
    cAcoes.appendChild(btnX);
  });
  calcularSaldo();
}

function adicionarProduto() {
  const produto = document.getElementById("produto").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  let valor = document.getElementById("valor").value.trim();
  if (!produto || !quantidade || !valor) return;
  valor = valor.replace(/\D/g, "");
  if (!valor) return;
  const valorFormatado = formatarMoedaFromDigits(valor);
  const data = new Date().toLocaleDateString("pt-BR");

  const dados = carregarDadosMes();
  dados.historico = dados.historico || [];
  dados.historico.push({ produto, quantidade, valor: valorFormatado, data });
  salvarDadosMes(dados);

  document.getElementById("produto").value = "";
  document.getElementById("quantidade").value = "1";
  document.getElementById("valor").value = "";

  carregarInterfaceDoMes();
}

function editarItem(index) {
  const dados = carregarDadosMes();
  const item = dados.historico && dados.historico[index];
  if (!item) return;
  const hoje = new Date().toLocaleDateString("pt-BR");
  if (item.data !== hoje) {
    mostrarDialogo("Só é possível editar itens adicionados hoje.");
    return;
  }

  // diálogo simples
  const dlg = document.createElement("div");
  dlg.className = "dialogo-custom";
  // dlg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#cbd5e1;padding:16px;border-radius:8px;z-index:2000;min-width:280px;`;
  dlg.innerHTML = `
    <div style="margin-bottom:8px;font-weight:600">Editar item</div>
    <input id="_edit_prod" style="width:92%;margin-bottom:8px" value="${item.produto}" />
    <input id="_edit_qtd" type="number" style="width:92%;margin-bottom:8px" value="${item.quantidade}" />
    <input id="_edit_val" style="width:92%;margin-bottom:12px" value="${item.valor}" />
    <div style="text-align:right"><button id="_edit_cancel">Cancelar</button> <button id="_edit_save">Salvar</button></div>
  `;
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1999`;
  document.body.appendChild(overlay);
  document.body.appendChild(dlg);

  document.getElementById("_edit_cancel").onclick = () => {
    overlay.remove();
    dlg.remove();
  };
  document.getElementById("_edit_save").onclick = () => {
    const p = document.getElementById("_edit_prod").value.trim();
    const q = document.getElementById("_edit_qtd").value.trim();
    const v = document.getElementById("_edit_val").value.trim();
    if (!p || !q || !v) {
      mostrarDialogo("Preencha todos os campos.");
      return;
    }
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      mostrarDialogo("Valor inválido.");
      return;
    }
    const vf = formatarMoedaFromDigits(digits);
    dados.historico[index] = {
      produto: p,
      quantidade: q,
      valor: vf,
      data: dados.historico[index].data,
    };
    salvarDadosMes(dados);
    overlay.remove();
    dlg.remove();
    carregarInterfaceDoMes();
    mostrarDialogo("Item atualizado.");
  };
}

function excluirItem(index) {
  const dados = carregarDadosMes();
  const item = dados.historico && dados.historico[index];
  if (!item) return;
  mostrarDialogo(`Deseja excluir "${item.produto}"?`, "confirm", (ok) => {
    if (!ok) return;
    dados.historico.splice(index, 1);
    salvarDadosMes(dados);
    carregarInterfaceDoMes();
    mostrarDialogo("Item excluído.");
  });
}

function calcularSaldo() {
  const salarioRaw = document
    .getElementById("salario")
    .value.replace(/\D/g, "");
  const acresRaw = document
    .getElementById("acrescimo")
    .value.replace(/\D/g, "");
  const salario = salarioRaw ? Number(salarioRaw) / 100 : 0;
  const acres = acresRaw ? Number(acresRaw) / 100 : 0;

  let total = 0;
  document.querySelectorAll("#tabelaProdutos tbody tr").forEach((tr) => {
    const qtd = Number(tr.cells[1].textContent) || 1;
    const vtxt = tr.cells[2].textContent.replace(/\D/g, "");
    const v = vtxt ? Number(vtxt) / 100 : 0;
    total += qtd * v;
  });

  const saldo = salario + acres - total;
  document.getElementById("resultado").textContent =
    `Saldo restante: ${saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  document.getElementById("totalGastoDia").textContent =
    `Total gasto no mês: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;

  // Armazenar saldo para usar no modal
  window.saldoAtual = saldo;
  window.salarioTotal = salario + acres;
}

// listeners para campos que salvam direto no mês atual
function instalarFormatadores() {
  document.getElementById("salario").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (!v) {
      e.target.value = "";
      calcularSaldo();
      return;
    }
    e.target.value = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const dados = carregarDadosMes();
    dados.salario = e.target.value;
    salvarDadosMes(dados);
    calcularSaldo();
  });

  document.getElementById("acrescimo").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (!v) {
      e.target.value = "";
      calcularSaldo();
      return;
    }
    e.target.value = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const dados = carregarDadosMes();
    dados.acrescimo = e.target.value;
    salvarDadosMes(dados);
    calcularSaldo();
  });

  document.getElementById("valor").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (!v) {
      e.target.value = "";
      return;
    }
    e.target.value = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  });
}

// Histórico: ao selecionar data, mostramos o snapshot do mês correspondente (mesmo se não houve alteração naquele dia)
function filtrarPorData() {
  const v = document.getElementById("filtroData").value; // aaaa-mm (month input format)
  const tbody = document
    .getElementById("tabelaHistorico")
    .getElementsByTagName("tbody")[0];
  const info = document.getElementById("infoSaldoHistorico");
  tbody.innerHTML = "";
  info.innerHTML = "";
  if (!v) return;

  const partes = v.split("-");
  const mesFiltro = `${partes[1]}-${partes[0]}`; // MM-YYYY

  const histMensal = JSON.parse(
    localStorage.getItem(KEY_HISTORICO_MENSAL) || "[]",
  );
  const snap = histMensal.find((s) => s.mes === mesFiltro);
  if (snap) {
    const itens = snap.dados.historico || [];
    let total = 0;
    itens.forEach((it) => {
      total +=
        (Number(it.quantidade) || 1) *
        (Number(it.valor.replace(/\D/g, "")) / 100);
    });
    const salario = (snap.dados.salario || "").replace(/\D/g, "");
    const acres = (snap.dados.acrescimo || "").replace(/\D/g, "");
    const saldoInicial = (Number(salario) + Number(acres)) / 100;
    const saldoRest = saldoInicial - total;
    const infoDiv = document.createElement("div");
    infoDiv.className = "historico-bloco";
    infoDiv.style.marginBottom = "16px";
    infoDiv.innerHTML = `<div style="font-weight:700">Mês: ${snap.mes} | Saldo inicial: ${saldoInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Total gasto: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Saldo restante: ${saldoRest.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>`;
    const table = document.createElement("table");
    table.className = "historico-tabela";
    table.style.width = "100%";
    table.style.marginTop = "8px";
    table.innerHTML = `<thead><tr><th>Produto</th><th>Quantidade</th><th>Valor (R$)</th><th>Data</th></tr></thead><tbody>${itens.map((it) => `<tr><td>${it.produto}</td><td>${it.quantidade}</td><td>${it.valor}</td><td>${it.data}</td></tr>`).join("")}</tbody>`;
    info.appendChild(infoDiv);
    info.appendChild(table);
    return;
  }

  // Se não há snapshot, checar mês atual
  const dados = carregarDadosMes();
  if (dados.mes === mesFiltro) {
    const itens = dados.historico || [];
    if (itens.length === 0) return;
    let total = 0;
    itens.forEach(
      (it) =>
        (total +=
          (Number(it.quantidade) || 1) *
          (Number(it.valor.replace(/\D/g, "")) / 100)),
    );
    const salario = (dados.salario || "").replace(/\D/g, "");
    const acresc = (dados.acrescimo || "").replace(/\D/g, "");
    const saldoInicial = (Number(salario) + Number(acresc)) / 100;
    const saldoRest = saldoInicial - total;
    const infoDiv = document.createElement("div");
    infoDiv.className = "historico-bloco";
    infoDiv.style.marginBottom = "16px";
    infoDiv.innerHTML = `<div style="font-weight:700">Mês atual: ${dados.mes} | Saldo inicial: ${saldoInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Total gasto: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Saldo restante: ${saldoRest.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>`;
    const table = document.createElement("table");
    table.className = "historico-tabela";
    table.style.width = "100%";
    table.style.marginTop = "8px";
    table.innerHTML = `<thead><tr><th>Produto</th><th>Quantidade</th><th>Valor (R$)</th><th>Data</th></tr></thead><tbody>${itens.map((it) => `<tr><td>${it.produto}</td><td>${it.quantidade}</td><td>${it.valor}</td><td>${it.data}</td></tr>`).join("")}</tbody>`;
    info.appendChild(infoDiv);
    info.appendChild(table);
    return;
  }
}

function limparFiltro() {
  document.getElementById("filtroData").value = "";
  document
    .getElementById("tabelaHistorico")
    .getElementsByTagName("tbody")[0].innerHTML = "";
  document.getElementById("infoSaldoHistorico").textContent = "";
}

function abrirAba(id) {
  document
    .querySelectorAll(".aba")
    .forEach((d) => d.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const btn = Array.from(document.querySelectorAll(".tab-btn")).find(
    (x) => x.getAttribute("onclick") === `abrirAba('${id}')`,
  );
  if (btn) btn.classList.add("active");
}

// diálogo simples reutilizável
function mostrarDialogo(mensagem, tipo = "alert", cb = null) {
  if (document.querySelector(".dialogo-custom")) return; // evita múltiplos
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2000";
  const dlg = document.createElement("div");
  dlg.className = "dialogo-custom";
  dlg.style.cssText =
    "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:16px;border-radius:8px;z-index:2001;min-width:260px;";
  const p = document.createElement("p");
  p.textContent = mensagem;
  dlg.appendChild(p);
  if (tipo === "confirm") {
    const yes = document.createElement("button");
    yes.textContent = "Confirmar";
    yes.style.marginRight = "8px";
    yes.onclick = () => {
      cb && cb(true);
      overlay.remove();
      dlg.remove();
    };
    const no = document.createElement("button");
    no.textContent = "Cancelar";
    no.onclick = () => {
      cb && cb(false);
      overlay.remove();
      dlg.remove();
    };
    dlg.appendChild(no);
    dlg.appendChild(yes);
  } else {
    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.onclick = () => {
      overlay.remove();
      dlg.remove();
    };
    dlg.appendChild(ok);
  }
  document.body.appendChild(overlay);
  document.body.appendChild(dlg);
}

// Inicialização
window.addEventListener("DOMContentLoaded", () => {
  snapshotMesAnteriorSeNecessario();
  mostrarMesAtualNoTopo();
  instalarFormatadores();
  carregarInterfaceDoMes();
  abrirAba("abaCadastro");
});

function abrirModalSobre() {
  document.getElementById("modalSobre").style.display = "block";
}
function fecharModalSobre() {
  document.getElementById("modalSobre").style.display = "none";
}

function abrirModalResumo() {
  const porcentagemSaldo =
    window.salarioTotal > 0
      ? (window.saldoAtual / window.salarioTotal) * 100
      : 0;

  const porcentagemArredondada = Math.round(Math.max(0, porcentagemSaldo));
  const porcentagemGasta = 100 - porcentagemArredondada;
  document.querySelector(".circle").style.background =
    `conic-gradient(#0d9488 ${porcentagemArredondada}%, #1e293b 0)`;

  document.getElementById("porcentagemTxt").textContent =
    `O valor restante representa aproximadamente ${porcentagemArredondada}% do seu salário mensal.`;
  document.getElementById("modalResumoMes").style.display = "block";
}
function fecharModalResumo() {
  document.getElementById("modalResumoMes").style.display = "none";
}
