const historico = [];

const hoje = new Date().toDateString();

function verificarNovoDia() {
    const ultimoDiaSalvo = localStorage.getItem('dataUltimaAbertura');
    if (ultimoDiaSalvo !== hoje) {
        localStorage.setItem('dataUltimaAbertura', hoje);
        // Zera apenas os históricos de todos os cálculos
        const data = localStorage.getItem('calculos');
        if (data) {
            const calculos = JSON.parse(data);
            for (let nome in calculos) {
                calculos[nome].historico = [];
            }
            localStorage.setItem('calculos', JSON.stringify(calculos));
        }
    }
}

function verificarNovoMes() {
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const mesSalvo = localStorage.getItem('mesSalario');
    const mesAnoAtual = `${mesAtual}-${anoAtual}`;
    if (mesSalvo !== mesAnoAtual) {
        const data = localStorage.getItem('calculos');
        if (data) {
            const calculos = JSON.parse(data);
            for (let nome in calculos) {
                calculos[nome].salario = '';
                calculos[nome].acrescimo = '';
            }
            localStorage.setItem('calculos', JSON.stringify(calculos));
        }
        localStorage.setItem('mesSalario', mesAnoAtual);
    }
}

let calculos = {};
let calculoAtual = '';

function carregarCalculos() {
    const data = localStorage.getItem('calculos');
    if (data) {
        calculos = JSON.parse(data);
    }

    calculoAtual = localStorage.getItem('calculoAtual') || Object.keys(calculos)[0] || 'Principal';

    if (!calculos[calculoAtual]) {
        calculos[calculoAtual] = { salario: '', acrescimo: '', historico: [] };
    }

    atualizarSelect();
    carregarDadosDoCalculo();
}

function atualizarSelect() {
    const select = document.getElementById('selectCalculo');
    select.innerHTML = '';
    Object.keys(calculos).forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        if (nome === calculoAtual) opt.selected = true;
        select.appendChild(opt);
    });
}

function novoCalculo() {
    const nome = prompt("Nome do novo cálculo:");
    if (!nome || calculos[nome]) return;
    calculos[nome] = { salario: '', acrescimo: '', historico: [] };
    calculoAtual = nome;
    localStorage.setItem('calculoAtual', nome);
    salvarTodosOsCalculos();
    atualizarSelect();
    carregarDadosDoCalculo();
}

function trocarCalculo() {
    salvarDadosNoCalculo();
    const select = document.getElementById('selectCalculo');
    calculoAtual = select.value;
    localStorage.setItem('calculoAtual', calculoAtual);
    carregarDadosDoCalculo();
}

function salvarTodosOsCalculos() {
    localStorage.setItem('calculos', JSON.stringify(calculos));
}

function salvarDadosNoCalculo() {
    calculos[calculoAtual] = {
        salario: document.getElementById('salario').value,
        acrescimo: document.getElementById('acrescimo').value,
        historico: [...historico]
    };
    salvarTodosOsCalculos();
}

function carregarDadosDoCalculo() {
    const dados = calculos[calculoAtual];
    document.getElementById('salario').value = dados.salario || '';
    document.getElementById('acrescimo').value = dados.acrescimo || '';

    historico.length = 0;
    const tabela = document.getElementById('tabelaProdutos').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';

    dados.historico.forEach(item => {
        historico.push(item);
        const novaLinha = tabela.insertRow();
        novaLinha.insertCell(0).textContent = item.produto;
        novaLinha.insertCell(1).textContent = item.quantidade;
        novaLinha.insertCell(2).textContent = item.valor;
        novaLinha.insertCell(3).textContent = item.data;
    });

    calcularSaldo();
}

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
        salvarDadosNoCalculo();
    }
}

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

    document.getElementById('totalGastoDia').textContent =
        `Total gasto hoje: ${totalGastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}

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
    salvarDadosNoCalculo();
});

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
    salvarDadosNoCalculo();
});

function abrirAba(id) {
    document.querySelectorAll('.aba').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector(`.tab-btn[onclick="abrirAba('${id}')"]`).classList.add('active');
}

function filtrarPorData() {
    const filtro = document.getElementById('filtroData').value;
    const tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    document.getElementById('infoSaldoHistorico').innerHTML = '';

    if (!filtro) return;

    // Converte data do input (aaaa-mm-dd) para dd/mm/aaaa
    const partes = filtro.split('-');
    const dataFiltro = `${partes[2]}/${partes[1]}/${partes[0]}`;

    // Junta todos os cálculos (apagados e atuais)
    const historicoCalculos = JSON.parse(localStorage.getItem('historicoCalculos') || '[]');
    const todosCalculos = [...historicoCalculos.map(c => ({ nome: c.nome, dados: c.dados })), ...Object.keys(calculos).map(nome => ({ nome, dados: calculos[nome] }))];

    let encontrou = false;

    // Para cada cálculo, verifica se tem itens no dia e exibe bloco separado
    todosCalculos.forEach(calc => {
        const itensDia = (calc.dados.historico || []).filter(item => item.data === dataFiltro);
        if (itensDia.length > 0) {
            encontrou = true;
            // Saldo inicial
            let salario = (calc.dados.salario || '').replace(/\D/g, '');
            let acrescimo = (calc.dados.acrescimo || '').replace(/\D/g, '');
            const saldoInicial = (Number(salario) + Number(acrescimo)) / 100;

            // Total gasto e saldo restante
            let totalGastoDia = 0;
            itensDia.forEach(item => {
                const valorUnitario = Number(item.valor.replace(/\D/g, '')) / 100;
                totalGastoDia += (Number(item.quantidade) || 1) * valorUnitario;
            });
            const saldoRestante = saldoInicial - totalGastoDia;

            // Cria bloco de resumo e tabela
            const infoDiv = document.createElement('div');
            infoDiv.className = 'historico-bloco';
            infoDiv.style.marginBottom = '32px';
            infoDiv.innerHTML = `
                <div style="font-weight:bold; margin-bottom:8px; color:#1a237e;">
                    Cálculo: ${calc.nome} | 
                    Saldo inicial do dia: ${saldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | 
                    Total gasto: ${totalGastoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | 
                    Saldo restante: ${saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                        ${itensDia.map(item => `
                            <tr>
                                <td>${item.produto}</td>
                                <td>${item.quantidade}</td>
                                <td>${item.valor}</td>
                                <td>${item.data}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('infoSaldoHistorico').appendChild(infoDiv);
        }
    });

    // Se não encontrou nada, limpa tudo
    if (!encontrou) {
        document.getElementById('infoSaldoHistorico').innerHTML = '';
        tbody.innerHTML = '';
    }
}

function limparFiltro() {
    document.getElementById('filtroData').value = '';
    const tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    document.getElementById('infoSaldoHistorico').textContent = '';
}

function apagarCalculo() {
    const select = document.getElementById('selectCalculo');
    const nome = select.value;
    if (!nome) return;
    if (!confirm(`Tem certeza que deseja apagar o cálculo "${nome}"?`)) return;

    // Salva o histórico desse cálculo antes de apagar
    if (!localStorage.getItem('historicoCalculos')) {
        localStorage.setItem('historicoCalculos', JSON.stringify([]));
    }
    const historicoCalculos = JSON.parse(localStorage.getItem('historicoCalculos'));
    historicoCalculos.push({
        nome: nome,
        dados: { ...calculos[nome] }
    });
    localStorage.setItem('historicoCalculos', JSON.stringify(historicoCalculos));

    // Remove do objeto e do localStorage
    delete calculos[nome];
    salvarTodosOsCalculos();

    // Remove do select
    select.remove(select.selectedIndex);

    // Seleciona outro cálculo se houver
    if (select.options.length > 0) {
        select.selectedIndex = 0;
        calculoAtual = select.value;
        localStorage.setItem('calculoAtual', calculoAtual);
        carregarDadosDoCalculo();
    } else {
        // Limpa campos se não houver mais cálculos
        calculoAtual = '';
        localStorage.removeItem('calculoAtual');
        document.getElementById('salario').value = '';
        document.getElementById('acrescimo').value = '';
        historico.length = 0;
        document.getElementById('tabelaProdutos').getElementsByTagName('tbody')[0].innerHTML = '';
        calcularSaldo();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    verificarNovoMes();
    verificarNovoDia();
    carregarCalculos();
});