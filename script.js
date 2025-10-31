// Array para armazenar o histórico de produtos adicionados no cálculo atual
const historico = [];

// Armazena a data de hoje em formato string
const hoje = new Date().toDateString();

// Verifica se é um novo dia e zera o histórico dos cálculos se necessário
function verificarNovoDia() {
  const ultimoDiaSalvo = localStorage.getItem("dataUltimaAbertura");
  if (ultimoDiaSalvo !== hoje) {
    localStorage.setItem("dataUltimaAbertura", hoje);
    // Zera apenas os históricos de todos os cálculos
    const data = localStorage.getItem("calculos");
    if (data) {
      const calculos = JSON.parse(data);
      for (let nome in calculos) {
        calculos[nome].historico = [];
      }
      localStorage.setItem("calculos", JSON.stringify(calculos));
    }
  }
}

// Verifica se é um novo mês e zera salário/acréscimo dos cálculos se necessário
function verificarNovoMes() {
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const mesSalvo = localStorage.getItem("mesSalario");
  const mesAnoAtual = `${mesAtual}-${anoAtual}`;
  if (mesSalvo !== mesAnoAtual) {
    const data = localStorage.getItem("calculos");
    if (data) {
      const calculos = JSON.parse(data);
      for (let nome in calculos) {
        calculos[nome].salario = "";
        calculos[nome].acrescimo = "";
      }
      localStorage.setItem("calculos", JSON.stringify(calculos));
    }
    localStorage.setItem("mesSalario", mesAnoAtual);
  }
}

// Objeto para armazenar todos os cálculos e variável para o cálculo atual
let calculos = {};
let calculoAtual = "";

// Carrega os cálculos do localStorage e inicializa o cálculo atual
function carregarCalculos() {
  const data = localStorage.getItem("calculos");
  if (data) {
    calculos = JSON.parse(data);
  }

  calculoAtual =
    localStorage.getItem("calculoAtual") ||
    Object.keys(calculos)[0] ||
    "Principal";

  if (!calculos[calculoAtual]) {
    calculos[calculoAtual] = { salario: "", acrescimo: "", historico: [] };
  }

  atualizarSelect();
  carregarDadosDoCalculo();
}

// Atualiza o select de cálculos na interface
function atualizarSelect() {
  const select = document.getElementById("selectCalculo");
  select.innerHTML = "";
  Object.keys(calculos).forEach((nome) => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    if (nome === calculoAtual) opt.selected = true;
    select.appendChild(opt);
  });
}

// Cria um novo cálculo, salva e atualiza a interface
function novoCalculo() {
  // Cria diálogo de entrada
  const dialogoNovo = document.createElement('div');
  dialogoNovo.className = 'dialogo-custom';
  dialogoNovo.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
    z-index: 2000;
    min-width: 300px;
    text-align: center;
  `;

  // Overlay que bloqueia interação com o resto da página
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    z-index: 1999;
  `;
  document.body.appendChild(overlay);

  // Conteúdo do diálogo
  dialogoNovo.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #0F172A;">Novo Cálculo</h3>
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 5px; color: #0F172A;">Nome do cálculo:</label>
      <input type="text" id="nomeNovoCalculo" style="width: 100%; padding: 8px; border: 1px solid #CBD5E1; border-radius: 6px;">
    </div>
    <div style="text-align: right;">
      <button id="btnCancelarNovo" style="background: #CBD5E1; color: #0F172A; border: none; border-radius: 6px; padding: 8px 16px; margin-right: 8px; cursor: pointer;">Cancelar</button>
      <button id="btnCriarNovo" style="background: #0D9488; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">Criar</button>
    </div>
  `;

  document.body.appendChild(dialogoNovo);

  // Foca no input
  const inputNome = document.getElementById('nomeNovoCalculo');
  inputNome.focus();

  // Event listeners
  document.getElementById('btnCancelarNovo').onclick = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(dialogoNovo);
  };

  document.getElementById('btnCriarNovo').onclick = () => {
    const nome = inputNome.value.trim();
    if (!nome) {
      mostrarDialogo('Por favor, digite um nome para o cálculo.');
      return;
    }
    if (calculos[nome]) {
      mostrarDialogo('Já existe um cálculo com este nome. Por favor, escolha outro nome.');
      return;
    }

    calculos[nome] = { salario: '', acrescimo: '', historico: [] };
    calculoAtual = nome;
    localStorage.setItem('calculoAtual', nome);
    salvarTodosOsCalculos();
    atualizarSelect();
    carregarDadosDoCalculo();

    document.body.removeChild(overlay);
    document.body.removeChild(dialogoNovo);
    mostrarDialogo('Novo cálculo criado com sucesso!');
  };

  // Permite criar com Enter
  inputNome.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btnCriarNovo').click();
    }
  });
}

// Troca o cálculo selecionado, salvando o anterior e carregando o novo
function trocarCalculo() {
  salvarDadosNoCalculo();
  const select = document.getElementById("selectCalculo");
  calculoAtual = select.value;
  localStorage.setItem("calculoAtual", calculoAtual);
  carregarDadosDoCalculo();
}

// Salva todos os cálculos no localStorage
function salvarTodosOsCalculos() {
  localStorage.setItem("calculos", JSON.stringify(calculos));
}

// Salva os dados do cálculo atual (salário, acréscimo e histórico)
function salvarDadosNoCalculo() {
  calculos[calculoAtual] = {
    salario: document.getElementById("salario").value,
    acrescimo: document.getElementById("acrescimo").value,
    historico: [...historico],
  };
  salvarTodosOsCalculos();
}

// Carrega os dados do cálculo atual na interface
function carregarDadosDoCalculo() {
  const dados = calculos[calculoAtual];
  document.getElementById("salario").value = dados.salario || "";
  document.getElementById("acrescimo").value = dados.acrescimo || "";

  historico.length = 0;
  const tabela = document
    .getElementById("tabelaProdutos")
    .getElementsByTagName("tbody")[0];
  tabela.innerHTML = "";

  dados.historico.forEach((item) => {
    historico.push(item);
    const novaLinha = tabela.insertRow();
    novaLinha.insertCell(0).textContent = item.produto;
    novaLinha.insertCell(1).textContent = item.quantidade;
    novaLinha.insertCell(2).textContent = item.valor;
    novaLinha.insertCell(3).textContent = item.data;
    // Coluna de ações (Editar / Excluir)
    const celAcoes = novaLinha.insertCell(4);
    const idx = historico.length - 1; // índice atual no array historico
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.title = "Editar item (somente se adicionado hoje)";
    btnEditar.onclick = function () {
      editarItem(idx);
    };
    btnEditar.style.marginRight = "8px";
    btnEditar.classList.add("botaoJS");

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.title = "Excluir item";
    btnExcluir.onclick = function () {
      excluirItem(idx);
    };
    btnExcluir.classList.add("botaoJS");

    celAcoes.appendChild(btnEditar);
    celAcoes.appendChild(btnExcluir);
  });

  calcularSaldo();
}

// Adiciona um produto ao histórico e à tabela, atualizando o saldo
function adicionarProduto() {
  const produto = document.getElementById("produto").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  let valor = document.getElementById("valor").value.trim();

  if (produto && valor && quantidade) {
    valor = valor.replace(/\D/g, "");
    if (!valor) return;

    const valorFormatado = (Number(valor) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR");

    const tabela = document
      .getElementById("tabelaProdutos")
      .getElementsByTagName("tbody")[0];
    const novaLinha = tabela.insertRow();
    novaLinha.insertCell(0).textContent = produto;
    novaLinha.insertCell(1).textContent = quantidade;
    novaLinha.insertCell(2).textContent = valorFormatado;
    novaLinha.insertCell(3).textContent = dataFormatada;
    // Coluna de ações
    const celAcoes = novaLinha.insertCell(4);
    const idx = historico.length; // novo índice que será inserido
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.title = "Editar item (somente se adicionado hoje)";
    btnEditar.onclick = function () {
      editarItem(idx);
    };
    btnEditar.style.marginRight = "8px";

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.title = "Excluir item";
    btnExcluir.onclick = function () {
      excluirItem(idx);
    };

    celAcoes.appendChild(btnEditar);
    celAcoes.appendChild(btnExcluir);

    historico.push({
      produto,
      quantidade,
      valor: valorFormatado,
      data: dataFormatada,
    });

    document.getElementById("produto").value = "";
    document.getElementById("quantidade").value = "1";
    document.getElementById("valor").value = "";

    calcularSaldo();
    salvarDadosNoCalculo();
  }
}

// Função para criar diálogo customizado (alert/confirm)
function mostrarDialogo(mensagem, tipo = "alert", confirmCallback = null) {
  // Remove diálogo existente se houver
  const dialogoExistente = document.querySelector(".dialogo-custom");
  if (dialogoExistente) {
    dialogoExistente.remove();
  }

  // Cria o diálogo
  const dialogo = document.createElement("div");
  dialogo.className = "dialogo-custom";
  dialogo.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
        z-index: 1000;
        min-width: 300px;
        text-align: center;
    `;

  // Adiciona fundo escuro
  const overlay = document.createElement("div");
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 999;
    `;
  document.body.appendChild(overlay);

  // Texto da mensagem
  const texto = document.createElement("p");
  texto.textContent = mensagem;
  texto.style.cssText = `
        margin: 0 0 20px 0;
        color: #0F172A;
        font-size: 16px;
        line-height: 1.5;
    `;
  dialogo.appendChild(texto);

  // Estilo base dos botões
  const estiloBotao = `
        background: #0D9488;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        margin: 0 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
    `;

  // Botões baseados no tipo
  if (tipo === "confirm") {
    const btnConfirmar = document.createElement("button");
    btnConfirmar.textContent = "Confirmar";
    btnConfirmar.style.cssText = estiloBotao;
    btnConfirmar.onmouseover = () =>
      (btnConfirmar.style.background = "#075E55");
    btnConfirmar.onmouseout = () => (btnConfirmar.style.background = "#0D9488");
    btnConfirmar.onclick = () => {
      if (confirmCallback) confirmCallback(true);
      document.body.removeChild(overlay);
      document.body.removeChild(dialogo);
    };

    const btnCancelar = document.createElement("button");
    btnCancelar.textContent = "Cancelar";
    btnCancelar.style.cssText =
      estiloBotao + "background: #CBD5E1; color: #0F172A;";
    btnCancelar.onmouseover = () => (btnCancelar.style.background = "#94A3B8");
    btnCancelar.onmouseout = () => (btnCancelar.style.background = "#CBD5E1");
    btnCancelar.onclick = () => {
      if (confirmCallback) confirmCallback(false);
      document.body.removeChild(overlay);
      document.body.removeChild(dialogo);
    };

    dialogo.appendChild(btnConfirmar);
    dialogo.appendChild(btnCancelar);
  } else {
    const btnOk = document.createElement("button");
    btnOk.textContent = "OK";
    btnOk.style.cssText = estiloBotao;
    btnOk.onmouseover = () => (btnOk.style.background = "#075E55");
    btnOk.onmouseout = () => (btnOk.style.background = "#0D9488");
    btnOk.onclick = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(dialogo);
    };
    dialogo.appendChild(btnOk);
  }

  document.body.appendChild(dialogo);
}

// Permite editar um item do histórico apenas se ele foi adicionado hoje
function editarItem(index) {
  const item = historico[index];
  if (!item) return;
  const hojeBR = new Date().toLocaleDateString("pt-BR");
  if (item.data !== hojeBR) {
    mostrarDialogo(
      "Este item não pode ser editado pois foi adicionado em outro dia. Apenas itens do dia atual podem ser modificados."
    );
    return;
  }

  // Cria diálogo de edição
  const dialogoEdicao = document.createElement("div");
  dialogoEdicao.className = "dialogo-custom";
  dialogoEdicao.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
        z-index: 1000;
        min-width: 300px;
    `;

  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 999;
    `;
  document.body.appendChild(overlay);

  // Conteúdo do diálogo
  dialogoEdicao.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #0F172A;">Editar Item</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #0F172A;">Produto:</label>
            <input type="text" id="editProduto" value="${item.produto}" style="width: 100%; padding: 8px; border: 1px solid #CBD5E1; border-radius: 6px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #0F172A;">Quantidade:</label>
            <input type="number" id="editQuantidade" value="${item.quantidade}" min="1" style="width: 100%; padding: 8px; border: 1px solid #CBD5E1; border-radius: 6px;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #0F172A;">Valor:</label>
            <input type="text" id="editValor" value="${item.valor}" style="width: 100%; padding: 8px; border: 1px solid #CBD5E1; border-radius: 6px;">
        </div>
        <div style="text-align: right;">
            <button id="btnCancelarEdicao" style="background: #CBD5E1; color: #0F172A; border: none; border-radius: 6px; padding: 8px 16px; margin-right: 8px; cursor: pointer;">Cancelar</button>
            <button id="btnSalvarEdicao" style="background: #0D9488; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">Salvar</button>
        </div>
    `;

  document.body.appendChild(dialogoEdicao);

  // Event listeners
  document.getElementById("btnCancelarEdicao").onclick = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(dialogoEdicao);
  };

  document.getElementById("btnSalvarEdicao").onclick = () => {
    const novoProduto = document.getElementById("editProduto").value.trim();
    const novaQuantidade = document
      .getElementById("editQuantidade")
      .value.trim();
    const novoValorInput = document.getElementById("editValor").value.trim();

    if (!novoProduto || !novaQuantidade) {
      mostrarDialogo("Por favor, preencha todos os campos.");
      return;
    }

    const valorDigits = novoValorInput.replace(/\D/g, "");
    if (!valorDigits) {
      mostrarDialogo(
        "Valor inválido. Por favor, insira um valor numérico válido."
      );
      return;
    }

    const valorFormatado = (Number(valorDigits) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    item.produto = novoProduto;
    item.quantidade = novaQuantidade;
    item.valor = valorFormatado;

    historico[index] = item;
    salvarDadosNoCalculo();
    carregarDadosDoCalculo();

    document.body.removeChild(overlay);
    document.body.removeChild(dialogoEdicao);

    mostrarDialogo("Item atualizado com sucesso!");
  };

  // Formatar valor ao digitar
  const inputValor = document.getElementById("editValor");
  inputValor.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (!valor) {
      e.target.value = "";
      return;
    }
    e.target.value = (Number(valor) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  });
}

// Exclui item do histórico com confirmação
function excluirItem(index) {
  const item = historico[index];
  if (!item) return;
  mostrarDialogo(
    `Deseja realmente excluir "${item.produto}"?`,
    "confirm",
    (confirmado) => {
      if (confirmado) {
        historico.splice(index, 1);
        salvarDadosNoCalculo();
        carregarDadosDoCalculo();
        mostrarDialogo("Item excluído com sucesso!");
      }
    }
  );
}

// Calcula o saldo restante e o total gasto no dia, exibindo na interface
function calcularSaldo() {
  let salario = document.getElementById("salario").value.replace(/\D/g, "");
  let acrescimo = document.getElementById("acrescimo").value.replace(/\D/g, "");
  salario = salario ? Number(salario) / 100 : 0;
  acrescimo = acrescimo ? Number(acrescimo) / 100 : 0;

  let totalGastos = 0;
  const linhas = document.querySelectorAll("#tabelaProdutos tbody tr");
  linhas.forEach((linha) => {
    const quantidade = Number(linha.cells[1].textContent) || 1;
    const valorTexto = linha.cells[2].textContent.replace(/\D/g, "");
    totalGastos += quantidade * (valorTexto ? Number(valorTexto) / 100 : 0);
  });

  const saldo = salario + acrescimo - totalGastos;

  document.getElementById(
    "resultado"
  ).textContent = `Saldo restante: ${saldo.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;

  document.getElementById(
    "totalGastoDia"
  ).textContent = `Total gasto hoje: ${totalGastos.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;
}

// Formata o campo salário enquanto o usuário digita e salva alterações
document.getElementById("salario").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (!valor) {
    e.target.value = "";
    calcularSaldo();
    return;
  }
  valor = (Number(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  e.target.value = valor;
  calcularSaldo();
  salvarDadosNoCalculo();
});

// Formata o campo valor do produto enquanto o usuário digita
document.getElementById("valor").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (!valor) {
    e.target.value = "";
    return;
  }
  valor = (Number(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  e.target.value = valor;
});

// Formata o campo acréscimo enquanto o usuário digita e salva alterações
document.getElementById("acrescimo").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (!valor) {
    e.target.value = "";
    calcularSaldo();
    return;
  }
  valor = (Number(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  e.target.value = valor;
  calcularSaldo();
  salvarDadosNoCalculo();
});

// Alterna entre abas da interface
function abrirAba(id) {
  document
    .querySelectorAll(".aba")
    .forEach((div) => div.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document
    .querySelector(`.tab-btn[onclick="abrirAba('${id}')"]`)
    .classList.add("active");
}

// Filtra o histórico por data e exibe os resultados na interface
function filtrarPorData() {
  const filtro = document.getElementById("filtroData").value;
  const tbody = document
    .getElementById("tabelaHistorico")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  document.getElementById("infoSaldoHistorico").innerHTML = "";

  if (!filtro) return;

  // Converte data do input (aaaa-mm-dd) para dd/mm/aaaa
  const partes = filtro.split("-");
  const dataFiltro = `${partes[2]}/${partes[1]}/${partes[0]}`;

  // Junta todos os cálculos (apagados e atuais)
  const historicoCalculos = JSON.parse(
    localStorage.getItem("historicoCalculos") || "[]"
  );
  const todosCalculos = [
    ...historicoCalculos.map((c) => ({ nome: c.nome, dados: c.dados })),
    ...Object.keys(calculos).map((nome) => ({ nome, dados: calculos[nome] })),
  ];

  let encontrou = false;

  // Para cada cálculo, verifica se tem itens no dia e exibe bloco separado
  todosCalculos.forEach((calc) => {
    const itensDia = (calc.dados.historico || []).filter(
      (item) => item.data === dataFiltro
    );
    if (itensDia.length > 0) {
      encontrou = true;
      // Saldo inicial
      let salario = (calc.dados.salario || "").replace(/\D/g, "");
      let acrescimo = (calc.dados.acrescimo || "").replace(/\D/g, "");
      const saldoInicial = (Number(salario) + Number(acrescimo)) / 100;

      // Total gasto e saldo restante
      let totalGastoDia = 0;
      itensDia.forEach((item) => {
        const valorUnitario = Number(item.valor.replace(/\D/g, "")) / 100;
        totalGastoDia += (Number(item.quantidade) || 1) * valorUnitario;
      });
      const saldoRestante = saldoInicial - totalGastoDia;

      // Cria bloco de resumo e tabela
      const infoDiv = document.createElement("div");
      infoDiv.className = "historico-bloco";
      infoDiv.style.marginBottom = "32px";
      infoDiv.innerHTML = `
                <div style="font-weight:bold; margin-bottom:8px; color:#1a237e;">
                    Cálculo: ${calc.nome} | 
                    Saldo inicial do dia: ${saldoInicial.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )} | 
                    Total gasto: ${totalGastoDia.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })} | 
                    Saldo restante: ${saldoRestante.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                </div>
                <table class="historico-tabela" style="width:100%;margin-bottom:8px;">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Valor (R$)</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itensDia
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.produto}</td>
                                <td>${item.quantidade}</td>
                                <td>${item.valor}</td>
                                <td>${item.data}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
      document.getElementById("infoSaldoHistorico").appendChild(infoDiv);
    }
  });

  // Se não encontrou nada, limpa tudo
  if (!encontrou) {
    document.getElementById("infoSaldoHistorico").innerHTML = "";
    tbody.innerHTML = "";
  }
}

// Limpa o filtro de data e o histórico exibido
function limparFiltro() {
  document.getElementById("filtroData").value = "";
  const tbody = document
    .getElementById("tabelaHistorico")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  document.getElementById("infoSaldoHistorico").textContent = "";
}

// Apaga o cálculo selecionado, salvando seu histórico antes
function apagarCalculo() {
  const select = document.getElementById("selectCalculo");
  const nome = select.value;
  if (!nome) return;
  if (!confirm(`Tem certeza que deseja apagar o cálculo "${nome}"?`)) return;

  // Salva o histórico desse cálculo antes de apagar
  if (!localStorage.getItem("historicoCalculos")) {
    localStorage.setItem("historicoCalculos", JSON.stringify([]));
  }
  const historicoCalculos = JSON.parse(
    localStorage.getItem("historicoCalculos")
  );
  historicoCalculos.push({
    nome: nome,
    dados: { ...calculos[nome] },
  });
  localStorage.setItem("historicoCalculos", JSON.stringify(historicoCalculos));

  // Remove do objeto e do localStorage
  delete calculos[nome];
  salvarTodosOsCalculos();

  // Remove do select
  select.remove(select.selectedIndex);

  // Seleciona outro cálculo se houver
  if (select.options.length > 0) {
    select.selectedIndex = 0;
    calculoAtual = select.value;
    localStorage.setItem("calculoAtual", calculoAtual);
    carregarDadosDoCalculo();
  } else {
    // Limpa campos se não houver mais cálculos
    calculoAtual = "";
    localStorage.removeItem("calculoAtual");
    document.getElementById("salario").value = "";
    document.getElementById("acrescimo").value = "";
    historico.length = 0;
    document
      .getElementById("tabelaProdutos")
      .getElementsByTagName("tbody")[0].innerHTML = "";
    calcularSaldo();
  }
}

// Inicializa o sistema ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
  verificarNovoMes();
  verificarNovoDia();
  carregarCalculos();
});
