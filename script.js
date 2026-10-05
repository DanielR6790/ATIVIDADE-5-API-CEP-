const CEP_DESTINO = "60740-020";

// Valores usados para estimar o Uber Moto
const TAXA_BASE = 6.00;
const VALOR_POR_KM = 1.50;


// Consulta o CEP na API ViaCEP
async function buscarCEP(cep) {

    cep = cep.replace(/\D/g, "");

    if (cep.length !== 8) {
        throw new Error("Digite um CEP válido.");
    }

    const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
    );

    const dados = await resposta.json();

    if (dados.erro) {
        throw new Error("CEP não encontrado.");
    }

    return dados;
}


// Busca latitude e longitude do endereço
async function buscarCoordenadas(endereco) {

    const consulta = encodeURIComponent(
        `${endereco.logradouro}, ${endereco.localidade}, ${endereco.uf}, Brasil`
    );

    const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${consulta}`
    );

    const dados = await resposta.json();

    if (dados.length === 0) {
        throw new Error("Não foi possível localizar o endereço.");
    }

    return {
        latitude: parseFloat(dados[0].lat),
        longitude: parseFloat(dados[0].lon)
    };
}


// Calcula a distância pela rota
async function calcularDistancia(origem, destino) {

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origem.longitude},${origem.latitude};` +
        `${destino.longitude},${destino.latitude}` +
        `?overview=false`;

    const resposta = await fetch(url);

    const dados = await resposta.json();

    if (dados.code !== "Ok") {
        throw new Error("Não foi possível calcular a distância.");
    }

    // A API retorna metros.
    // Dividimos por 1000 para transformar em quilômetros.
    return dados.routes[0].distance / 1000;
}


// Função principal
async function calcularFrete() {

    const cepOrigem =
        document.getElementById("cepOrigem").value;

    const resultado =
        document.getElementById("resultado");

    try {

        resultado.style.display = "block";

        document.getElementById("origem").textContent =
            "Consultando CEP...";

        document.getElementById("distancia").textContent =
            "";

        document.getElementById("valorFrete").textContent =
            "";

        // Busca o endereço de origem
        const origem =
            await buscarCEP(cepOrigem);

        // Busca o endereço fixo de destino
        const destino =
            await buscarCEP(CEP_DESTINO);


        // Mostra os endereços
        document.getElementById("origem").textContent =
            `Origem: ${origem.logradouro}, ${origem.bairro}, ${origem.localidade} - ${origem.uf}`;

        document.getElementById("destino").textContent =
            `Destino: ${destino.logradouro}, ${destino.bairro}, ${destino.localidade} - ${destino.uf}`;


        // Busca coordenadas
        const coordenadasOrigem =
            await buscarCoordenadas(origem);

        const coordenadasDestino =
            await buscarCoordenadas(destino);


        // Calcula a distância
        const distancia =
            await calcularDistancia(
                coordenadasOrigem,
                coordenadasDestino
            );


        // Calcula a estimativa
        const valorFrete =
            TAXA_BASE + (distancia * VALOR_POR_KM);


        // Mostra os resultados
        document.getElementById("distancia").textContent =
            `Distância aproximada: ${distancia.toFixed(2)} km`;

        document.getElementById("valorFrete").textContent =
            `Frete estimado: R$ ${valorFrete.toFixed(2)}`;


    } catch (erro) {

        resultado.style.display = "block";

        document.getElementById("origem").textContent =
            `Erro: ${erro.message}`;

        document.getElementById("distancia").textContent =
            "";

        document.getElementById("valorFrete").textContent =
            "";
    }
}

