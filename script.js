const historico = [];

function adicionarProduto() {
    const produto = document.getElementById('produto').value.trim();
    const quantidade = document.getElementById('quantidade').value.trim();
    let valor = document.getElementById('valor').value.trim();

    if (produto && valor && quantidade) {
        valor = valor.replace(/\D/g, '');
        if (!valor) return;

        const valorFormatado = (Number(valor) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR');

        const tabela = document.getElementById('tabelaProdutos').getElementsByTagName('tbody')[0];
        const novaLinha = tabela.insertRow();
        novaLinha.insertCell(0).textContent = produto;
        novaLinha.insertCell(1).textContent = quantidade;
        novaLinha.insertCell(2).textContent = valorFormatado;
        novaLinha.insertCell(3).textContent = dataFormatada;

        historico.push({
            produto,
            quantidade,
            valor: valorFormatado,
            data: dataFormatada
        });

        document.getElementById('produto').value = '';
        document.getElementById('quantidade').value = '1';
        document.getElementById('valor').value = '';

        calcularSaldo();
        salvarDados();
    }
}

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('salario', document.getElementById('salario').value);
    localStorage.setItem('acrescimo', document.getElementById('acrescimo').value);
    localStorage.setItem('historico', JSON.stringify(historico));
}

// Carregar dados do localStorage ao abrir a página
function carregarDados() {
    const salario = localStorage.getItem('salario');
    const acrescimo = localStorage.getItem('acrescimo');
    const hist = localStorage.getItem('historico');

    if (salario) document.getElementById('salario').value = salario;
    if (acrescimo) document.getElementById('acrescimo').value = acrescimo;
    if (hist) {
        const lista = JSON.parse(hist);
        lista.forEach(item => {
            historico.push(item);
            const tabela = document.getElementById('tabelaProdutos').getElementsByTagName('tbody')[0];
            const novaLinha = tabela.insertRow();
            novaLinha.insertCell(0).textContent = item.produto;
            novaLinha.insertCell(1).textContent = item.quantidade;
            novaLinha.insertCell(2).textContent = item.valor;
            novaLinha.insertCell(3).textContent = item.data;
        });
    }
    calcularSaldo();
}

// Formata o salário enquanto o usuário digita e recalcula o saldo
document.getElementById('salario').addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (!valor) {
        e.target.value = '';
        calcularSaldo();
        return;
    }
    valor = (Number(valor) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    e.target.value = valor;
    calcularSaldo();
});

// Formata o valor do produto enquanto o usuário digita
document.getElementById('valor').addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (!valor) {
        e.target.value = '';
        return;
    }
    valor = (Number(valor) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    e.target.value = valor;
});

// Formata o acréscimo enquanto o usuário digita e recalcula o saldo
document.getElementById('acrescimo').addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (!valor) {
        e.target.value = '';
        calcularSaldo();
        return;
    }
    valor = (Number(valor) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    e.target.value = valor;
    calcularSaldo();
});

function calcularSaldo() {
    let salario = document.getElementById('salario').value.replace(/\D/g, '');
    let acrescimo = document.getElementById('acrescimo').value.replace(/\D/g, '');
    salario = salario ? Number(salario) / 100 : 0;
    acrescimo = acrescimo ? Number(acrescimo) / 100 : 0;

    let totalGastos = 0;
    const linhas = document.querySelectorAll('#tabelaProdutos tbody tr');
    linhas.forEach(linha => {
        const quantidade = Number(linha.cells[1].textContent) || 1;
        const valorTexto = linha.cells[2].textContent.replace(/\D/g, '');
        totalGastos += quantidade * (valorTexto ? Number(valorTexto) / 100 : 0);
    });

    const saldo = salario + acrescimo - totalGastos;

    document.getElementById('resultado').textContent =
        `Saldo restante: ${saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}

// Controle de abas
function abrirAba(id) {
    document.querySelectorAll('.aba').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector(`.tab-btn[onclick="abrirAba('${id}')"]`).classList.add('active');
}

// Função para filtrar histórico por data
function filtrarPorData() {
    const filtro = document.getElementById('filtroData').value;
    const tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    document.getElementById('infoSaldoHistorico').textContent = '';

    if (!filtro) return;

    // Converte data do input (aaaa-mm-dd) para dd/mm/aaaa
    const partes = filtro.split('-');
    const dataFiltro = `${partes[2]}/${partes[1]}/${partes[0]}`;

    // Filtra os itens do histórico para o dia selecionado
    const itensDia = historico.filter(item => item.data === dataFiltro);

    // Mostra os produtos do dia
    let totalGastoDia = 0;
    itensDia.forEach(item => {
        const linha = tbody.insertRow();
        linha.insertCell(0).textContent = item.produto;
        linha.insertCell(1).textContent = item.quantidade;
        linha.insertCell(2).textContent = item.valor;
        linha.insertCell(3).textContent = item.data;

        // Soma o gasto do dia (quantidade * valor unitário)
        const valorUnitario = Number(item.valor.replace(/\D/g, '')) / 100;
        totalGastoDia += (Number(item.quantidade) || 1) * valorUnitario;
    });

    // Saldo inicial do dia (salário + acréscimo salvos no localStorage)
    let salario = localStorage.getItem('salario') || '';
    let acrescimo = localStorage.getItem('acrescimo') || '';
    salario = salario.replace(/\D/g, '');
    acrescimo = acrescimo.replace(/\D/g, '');
    const saldoInicial = (Number(salario) + Number(acrescimo)) / 100;
    const saldoRestante = saldoInicial - totalGastoDia;

    document.getElementById('infoSaldoHistorico').textContent =
        `Saldo inicial do dia: ${saldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | ` +
        `Total gasto: ${totalGastoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | ` +
        `Saldo restante: ${saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}

// Função para limpar filtro de data
function limparFiltro() {
    document.getElementById('filtroData').value = '';
    const tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    document.getElementById('infoSaldoHistorico').textContent = '';
}

// Sempre que adicionar produto ou alterar salário/acréscimo, salve:
document.getElementById('salario').addEventListener('input', salvarDados);
document.getElementById('acrescimo').addEventListener('input', salvarDados);

// Ao carregar a página:
window.addEventListener('DOMContentLoaded', carregarDados);

