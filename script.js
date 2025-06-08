function adicionarProduto() {
    const produto = document.getElementById('produto').value.trim();
    let valor = document.getElementById('valor').value.trim();

    if (produto && valor) {
        // Remove tudo que não for número
        valor = valor.replace(/\D/g, '');

        // Se não houver valor, não adiciona
        if (!valor) return;

        // Converte para centavos e formata para real
        const valorFormatado = (Number(valor) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        // Pega a data atual no formato dd/mm/aaaa
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR');

        const tabela = document.getElementById('tabelaProdutos').getElementsByTagName('tbody')[0];
        const novaLinha = tabela.insertRow();
        const celulaProduto = novaLinha.insertCell(0);
        const celulaValor = novaLinha.insertCell(1);
        const celulaData = novaLinha.insertCell(2);
        celulaProduto.textContent = produto;
        celulaValor.textContent = valorFormatado;
        celulaData.textContent = dataFormatada;

        document.getElementById('produto').value = '';
        document.getElementById('valor').value = '';

        // Calcula o saldo automaticamente
        calcularSaldo();
    }
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
    // Pega o salário e o acréscimo formatados e converte para número
    let salario = document.getElementById('salario').value.replace(/\D/g, '');
    let acrescimo = document.getElementById('acrescimo').value.replace(/\D/g, '');
    salario = salario ? Number(salario) / 100 : 0;
    acrescimo = acrescimo ? Number(acrescimo) / 100 : 0;

    // Soma todos os valores da tabela
    let totalGastos = 0;
    const linhas = document.querySelectorAll('#tabelaProdutos tbody tr');
    linhas.forEach(linha => {
        const valorTexto = linha.cells[1].textContent.replace(/\D/g, '');
        totalGastos += valorTexto ? Number(valorTexto) / 100 : 0;
    });

    // Calcula o saldo (salário + acréscimo - gastos)
    const saldo = salario + acrescimo - totalGastos;

    // Exibe o resultado formatado
    document.getElementById('resultado').textContent =
        `Saldo restante: ${saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}