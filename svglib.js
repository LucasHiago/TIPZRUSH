const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');
const xmlFormatter = require('xml-formatter');

// Caminho da pasta com os SVGs
const directoryPath = path.join(__dirname, 'assets/emojis/SVG');

// Filtra apenas arquivos .svg
const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.svg'));

let symbols = [];

files.forEach(file => {
  const filepath = path.join(directoryPath, file);
  const svgContent = fs.readFileSync(filepath, 'utf8');

  // Parseia o SVG
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const svgEl = doc.getElementsByTagName('svg')[0];

  if (!svgEl) {
    console.warn(`Arquivo ${file} não é um SVG válido.`);
    return;
  }

  // Extrai o viewBox
  const viewBox = svgEl.getAttribute('viewBox') || '0 0 64 64';

  // Nome do símbolo baseado no nome do arquivo
  const iconName = path.parse(file).name.toLowerCase().replace(/\s+/g, '-');
  const prefix = iconName + '-';

  // Função para prefixar IDs e classes
  function prefixAttributes(node) {
    if (node.nodeType === 1) { // ELEMENT_NODE
      // Prefixa o ID se existir
      const id = node.getAttribute('id');
      if (id) {
        node.setAttribute('id', prefix + id);
      }

      // Prefixa as classes se existirem
      const classAttr = node.getAttribute('class');
      if (classAttr) {
        const classes = classAttr.split(' ').map(cls => prefix + cls).join(' ');
        node.setAttribute('class', classes);
      }

      // Atualiza atributos que referenciam IDs
      const attributesToUpdate = [
        'xlink:href', 'href', 'clip-path', 'mask', 'filter',
        'marker-start', 'marker-mid', 'marker-end', 'fill', 'stroke'
      ];

      attributesToUpdate.forEach(attr => {
        const val = node.getAttribute(attr);
        if (val && val.includes('url(#')) {
          // Substitui url(#id) por url(#prefixid)
          const newVal = val.replace(/url\(#([^)]*)\)/g, `url(#${prefix}$1)`);
          node.setAttribute(attr, newVal);
        } else if (val && val.startsWith('#')) {
          // Para atributos como xlink:href="#id"
          const newVal = `#${prefix}${val.slice(1)}`;
          node.setAttribute(attr, newVal);
        }
      });

      // Repetir para todos filhos
      for (let i = 0; i < node.childNodes.length; i++) {
        prefixAttributes(node.childNodes[i]);
      }
    }
  }

  // Aplica o prefixo nos IDs, classes e referências
  prefixAttributes(svgEl);

  // Atualiza o conteúdo de <style> se existir
  const styleEls = svgEl.getElementsByTagName('style');
  for (let i = 0; i < styleEls.length; i++) {
    const styleEl = styleEls[i];
    let cssContent = '';
    for (let j = 0; j < styleEl.childNodes.length; j++) {
      const node = styleEl.childNodes[j];
      if (node.nodeType === 3 || node.nodeType === 4) { // TEXT_NODE ou CDATA_SECTION_NODE
        cssContent += node.data;
      }
    }

    // Prefixar IDs no CSS: #id -> #prefixid, mas não tocar em cores hexadecimais
    // Usamos uma regex que não captura padrões de cores hexadecimais
    cssContent = cssContent.replace(/#(?![0-9a-fA-F]{3,6}\b)([\w-]+)/g, `#${prefix}$1`);

    // Prefixar classes no CSS: .cls-1 -> .prefixcls-1
    cssContent = cssContent.replace(/\.([\w-]+)/g, `.${prefix}$1`);

    // Remove nós internos do <style>
    while (styleEl.firstChild) {
      styleEl.removeChild(styleEl.firstChild);
    }

    // Cria um novo nó de texto com o CSS modificado
    styleEl.appendChild(doc.createTextNode(cssContent));
  }

  // Extrai o conteúdo interno do <svg>
  let innerContent = '';
  for (let i = 0; i < svgEl.childNodes.length; i++) {
    const node = svgEl.childNodes[i];
    const nodeStr = new XMLSerializer().serializeToString(node);
    if (nodeStr.trim()) {
      innerContent += nodeStr;
    }
  }

  // Cria o símbolo com o id original (sem prefix)
  const symbol = `<symbol id="${iconName}" viewBox="${viewBox}">${innerContent}</symbol>`;
  symbols.push(symbol);
});

// Monta o sprite final
let spriteContent = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">\n${symbols.join('\n')}\n</svg>`;

// Formata o XML para legibilidade
spriteContent = xmlFormatter(spriteContent, { indentation: '  ', collapseContent: false });

// Escreve o arquivo final
fs.writeFileSync('_sprite.svg', spriteContent, 'utf8');
console.log('Sprite gerado com sucesso! Confira o arquivo "_sprite.svg".');
