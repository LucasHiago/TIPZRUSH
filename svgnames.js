const fs = require('fs');
const path = require('path');

// Defina o diretório onde estão os arquivos SVG
const diretorioSvg = path.join(__dirname, 'assets/emojis/SVG');

// Defina o caminho e nome do arquivo JSON de saída
const arquivoSaida = path.join(__dirname, 'nomesProcessados.json');

// Função para processar os nomes dos arquivos SVG
function obterNomesProcessados() {
  fs.readdir(diretorioSvg, (err, arquivos) => {
    if (err) {
      console.error('Erro ao ler o diretório:', err);
      return;
    }

    // Filtrar apenas arquivos com extensão .svg
    const arquivosSvg = arquivos.filter(arquivo => path.extname(arquivo).toLowerCase() === '.svg');

    // Processar os nomes: remover extensão, converter para minúsculas e substituir espaços por hífens
    const nomesProcessados = arquivosSvg.map(arquivo => {
      const nomeSemExtensao = path.basename(arquivo, '.svg');
      return nomeSemExtensao.toLowerCase().replace(/\s+/g, '-');
    });

    console.log('Nomes processados:', nomesProcessados);

    // Converter o array para uma string JSON formatada
    const conteudoJson = JSON.stringify(nomesProcessados, null, 2);

    // Escrever a string JSON no arquivo de saída
    fs.writeFile(arquivoSaida, conteudoJson, 'utf8', (err) => {
      if (err) {
        console.error('Erro ao escrever o arquivo JSON:', err);
        return;
      }
      console.log(`Arquivo "${arquivoSaida}" criado com sucesso!`);
    });
  });
}

// Verificar se o diretório SVG existe
fs.access(diretorioSvg, fs.constants.F_OK, (err) => {
  if (err) {
    console.error(`O diretório "${diretorioSvg}" não existe.`);
    return;
  }
  // Executar a função de processamento
  obterNomesProcessados();
});
