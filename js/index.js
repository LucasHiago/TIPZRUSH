const rows = 8;
const columns = 12;
let slot = [];
let multipliedSlot = [];
let iconsValues = [
  10,
  5,
  2,
  1,
  0.5,
  0.25,
  0.0125,
  0.005125,
  0.000255125
];
let winningBlocksHistory = [];
let contextEmojiKey;

const REEL_CONTAINER = document.querySelector('.reel-container');
const SPIN_BUTTON = document.querySelector('.spin');

const DELAY_WINNING_BLOCKS = 1000;
const DEKAY_NEW_BLOCKS = 500;

const modal = document.querySelector('.win-message');
const infoText = document.querySelector('.win-info');
const winText = document.querySelector('.win-text');
const closeMessageButton = document.querySelector('.close-message');

let credit = 2000;
let bet = 10;
let gain = 0;

let creditEl = document.querySelector('.credit');
let gainEl = document.querySelector('.gain');
let songEl = document.querySelector('.song_controller');

const getEmojiKey = () => {
  fetch('./assets/emojis/icons.json')
  .then(res => res.text())
  .then(data => {
    contextEmojiKey = JSON.parse(data);
    makeInitialSlot(contextEmojiKey);
  });

  closeMessageButton.addEventListener('click', () => {
    modal.classList.add('hidden');
    winText.innerHTML = '';
  });
}

const getRandomEmoji = (emojiKey = contextEmojiKey) => {
  const randomIndex = Math.floor(Math.random() * emojiKey.length);
  return emojiKey[randomIndex];
}

const updatePlayerValues = (GAIN = 0) => {
  creditEl.innerHTML = credit;

  if(GAIN > 0) {
    gain = GAIN;
    credit = credit + GAIN;

    gainEl.innerHTML = gain.toFixed(2);
    creditEl.innerHTML = credit.toFixed(2);
  } else {
    credit = credit - bet;
  }
}

const makeInitialSlot = (emojiKey) => {
  slot = [];
  multipliedSlot = [];

  updatePlayerValues();

  for(let col = 0; col < columns; col++) {
    let column = [];
    let multiplierColumn = [];
    for(let row = 0; row < rows; row ++) {
      column.push(getRandomEmoji(emojiKey));
      multiplierColumn.push(0);
    }
    slot.push(column);
    multipliedSlot.push(multiplierColumn);
  }

  renderSlot();
}

const renderSlot = () => {
  REEL_CONTAINER.innerHTML = '';

  // Remove todas as classes 'highlight' antes de renderizar
  const highlightedCells = document.querySelectorAll('.highlight');
  highlightedCells.forEach(cell => cell.classList.remove('highlight'));

  slot.forEach((column, colIndex) => {
      const DIV = document.createElement('div');
      DIV.classList.add('reel-column');

      column.forEach((item, rowIndex) => {
          const SYMBOL = document.createElement('div');
          SYMBOL.classList.add('reel-symbol');
          SYMBOL.classList.add('animate');

          // Adiciona um ID único baseado na posição da célula
          SYMBOL.id = `cell-${colIndex}-${rowIndex}`;

          const MULTIPLIER = document.createElement('div');
          MULTIPLIER.classList.add('multiplier');
          MULTIPLIER.id = `multiplier-${colIndex}-${rowIndex}`;
          MULTIPLIER.textContent = ''; 

          const EMOJI = renderEmoji(item);
          SYMBOL.appendChild(EMOJI);
          SYMBOL.appendChild(MULTIPLIER);
          DIV.appendChild(SYMBOL);
      });

      REEL_CONTAINER.appendChild(DIV);
  });

  processWinningBlocks();
}

const renderEmoji = (slotName) => {
  const svgNS = "http://www.w3.org/2000/svg";
  const xlinkNS = "http://www.w3.org/1999/xlink";

  const SVG = document.createElementNS(svgNS, "svg");
  SVG.setAttribute("viewBox", "0 0 64 64");
  SVG.setAttribute("class", "emoji");

  const USE = document.createElementNS(svgNS, "use");
  USE.setAttributeNS(xlinkNS, "xlink:href", `#${slotName}`);
  USE.setAttribute("href", `#${slotName}`);

  SVG.appendChild(USE);
  return SVG;
}

const getIconIndex = (iconName) => {
  return contextEmojiKey.indexOf(iconName);
}

const findWinningBlocks = (matrix, minConnections = 4) => {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
      return [];
  }

  const cols = matrix.length;
  const rows = matrix[0].length;
  const visited = Array.from({ length: cols }, () => Array(rows).fill(false));

  // Movimentos possíveis: cima, baixo, esquerda, direita
  const directions = [
    [-1, 0], // Cima
    [1, 0],  // Baixo
    [0, -1], // Esquerda
    [0, 1]   // Direita
  ];

  // Array para armazenar todas as células que fazem parte de conexões válidas
  let connectionsToHighlight = [];

  function dfs(col, row, value) {
      const stack = [[col, row]];
      const connectedCells = [];

      while (stack.length > 0) {
          const [currentCol, currentRow] = stack.pop();

          // Verifica se a posição está dentro dos limites
          if (currentCol < 0 || currentCol >= cols || currentRow < 0 || currentRow >= rows) continue;

          // Verifica se já foi visitado ou se o valor é diferente
          if (visited[currentCol][currentRow] || matrix[currentCol][currentRow] !== value) continue;

          // Marca como visitado e adiciona à lista de células conectadas
          visited[currentCol][currentRow] = true;
          connectedCells.push([currentCol, currentRow]);

          // Adiciona vizinhos (cima, baixo, esquerda, direita) à pilha
          for (const [dc, dr] of directions) {
              const newCol = currentCol + dc;
              const newRow = currentRow + dr;
              stack.push([newCol, newRow]);
          }
      }

      // Se o número de conexões for suficiente, adiciona ao array de destaque
      if (connectedCells.length >= minConnections) {
          connectionsToHighlight.push(...connectedCells);
          //console.log(`Valor ${value} possui ${connectedCells.length} conexões.`);
      }
  }

  // Itera sobre cada célula da matriz
  for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
          if (!visited[col][row]) {
              dfs(col, row, matrix[col][row]);
          }
      }
  }

  // Remove duplicatas usando um Set
  const uniqueConnections = Array.from(new Set(connectionsToHighlight.map(c => c.join(',')))).map(c => c.split(',').map(Number));

  return uniqueConnections;
}

const highlightWinningBlocks = (winningBlocks) => {
  winningBlocks.forEach(([col, row]) => {
      const cell = document.getElementById(`cell-${col}-${row}`);
      if (cell) {
          cell.classList.add('highlight');
      }
  });
}

const updateMultiplier = (col, row) => {
  if (multipliedSlot[col][row] === 0) {
      multipliedSlot[col][row] = 2;
  } else {
      multipliedSlot[col][row] *= 2;
      if (multipliedSlot[col][row] > 1024) {
          multipliedSlot[col][row] = 1024;
      }
  }

  // Atualiza o DOM
  const multiplierElement = document.getElementById(`multiplier-${col}-${row}`);
  if (multiplierElement) {
      if (multipliedSlot[col][row] >= 2) {
          multiplierElement.textContent = `x${multipliedSlot[col][row]}`;
          multiplierElement.style.display = 'block';
      } else {
          multiplierElement.textContent = '';
          multiplierElement.style.display = 'none';
      }
  }
}

const removeWinningBlocks = (winningBlocks) => {
  // Primeiro, agrupa os blocos vencedores por coluna
  const blocksByColumn = {};

  winningBlocks.forEach(([col, row]) => {
      if (!blocksByColumn[col]) {
          blocksByColumn[col] = [];
      }
      blocksByColumn[col].push(row);
  });

  // Para cada coluna com blocos vencedores
  for (const col in blocksByColumn) {
      const rowsToRemove = blocksByColumn[col].sort((a, b) => a - b); // Ordena do menor para o maior (topo para baixo)

      // Remove os emojis vencedores marcando como null e atualizando o multiplicador
      rowsToRemove.forEach(row => {
          // Remove a classe 'highlight' e 'animate'
          const cell = document.getElementById(`cell-${col}-${row}`);
          if (cell) {
              cell.classList.remove('highlight');
              cell.classList.remove('animate');
              cell.innerHTML = ''; // Limpa o conteúdo existente

              // Adiciona o elemento de multiplicador novamente
              const MULTIPLIER = document.createElement('div');
              MULTIPLIER.classList.add('multiplier');
              MULTIPLIER.id = `multiplier-${col}-${row}`;
              MULTIPLIER.textContent = ''; // Inicialmente vazio
              cell.appendChild(MULTIPLIER);
          }

          // Marca a posição no array 'slot' como null para indicar vazio
          slot[col][row] = null;

          // Atualiza o multiplicador
          updateMultiplier(col, row);
      });

      // Faz com que os emojis acima desçam para preencher os espaços vazios
      let column = slot[col];
      let newColumn = [];

      // Percorre a coluna de baixo para cima para manter a ordem correta
      for(let row = rows - 1; row >= 0; row--) {
          if (column[row] !== null) {
              newColumn.push(column[row]);
          }
      }

      const emptySlots = rows - newColumn.length; // Número de espaços vazios

      // Adiciona novos emojis no topo
      for(let i = 0; i < emptySlots; i++) {
          newColumn.push(getRandomEmoji());
      }

      // Atualiza a coluna no array 'slot' com os novos emojis
      slot[col] = newColumn.reverse(); // Reverte para que index 0 seja o topo

      // Atualiza o DOM apenas nas células afetadas
      const reelColumns = document.querySelectorAll('.reel-column');
      const currentColumnDiv = reelColumns[col];
      if (currentColumnDiv) {
          // Atualiza cada célula da coluna
          newColumn.forEach((item, rowIndex) => {
              const SYMBOL = document.getElementById(`cell-${col}-${rowIndex}`);
              if (SYMBOL) {
                  // Atualiza o emoji
                  const newEMOJI = renderEmoji(item);
                  SYMBOL.innerHTML = ''; // Limpa o conteúdo existente

                  // Cria o elemento de multiplicador novamente
                  const MULTIPLIER = document.createElement('div');
                  MULTIPLIER.classList.add('multiplier');
                  MULTIPLIER.id = `multiplier-${col}-${rowIndex}`;
                  MULTIPLIER.textContent = ''; // Inicialmente vazio

                  SYMBOL.appendChild(newEMOJI);
                  SYMBOL.appendChild(MULTIPLIER);

                  // Reaplica a classe 'animate' para a nova animação
                  SYMBOL.classList.remove('animate'); // Remove para reiniciar a animação
                  void SYMBOL.offsetWidth; // Força reflow
                  SYMBOL.classList.add('animate'); // Adiciona novamente para iniciar a animação

                  const multiplierValue = multipliedSlot[col][rowIndex];
                  const multiplierElement = document.getElementById(`multiplier-${col}-${rowIndex}`);
                  if (multiplierElement) {
                      if (multiplierValue >= 2) {
                          multiplierElement.textContent = `x${multiplierValue}`;
                          multiplierElement.style.display = 'block';
                      } else {
                          multiplierElement.textContent = '';
                          multiplierElement.style.display = 'none';
                      }
                  }
              }
          });
      }
  }
}

const processWinningBlocks = () => {
  const winningBlocks = findWinningBlocks(slot, 4);

  if (winningBlocks.length > 0) {
      // Destaca os blocos vencedores
      highlightWinningBlocks(winningBlocks);

      let connectionTotalValue = 0;
      let connectionMultipliers = [];
      let iconsByValue;

      // Atualiza os multiplicadores
      winningBlocks.forEach(([col, row]) => {
        updateMultiplier(col, row);
        const multiplier = multipliedSlot[col][row];
        const iconValue = iconsValues[getIconIndex(slot[col][row])]; // Função para obter o valor baseado no ícone
        iconsByValue = iconValue;
        connectionTotalValue += iconValue * multiplier;
        connectionMultipliers.push(multiplier);
      });

      winningBlocksHistory.push({
        blocks: winningBlocks,
        multipliers: connectionMultipliers,
        totalValue: connectionTotalValue,
        iconValue: iconsByValue
      });

      saveHistory();

      if(connectionTotalValue > 0) {
        showBalloon(iconsByValue, connectionMultipliers);
      }

      // Aguarda um breve período para que o usuário possa ver o destaque
      setTimeout(() => {
          // Remove os blocos vencedores e aplica o efeito cascata
          removeWinningBlocks(winningBlocks);

          // Aguarda um breve período para as animações de remoção
          setTimeout(() => {
              // Verifica novamente se há novos blocos vencedores após a cascata
              processWinningBlocks();
          }, DEKAY_NEW_BLOCKS); // Ajuste o delay conforme necessário
      }, DELAY_WINNING_BLOCKS); // 1 segundo de delay para destacar
  } else {
    const sumMultipliers = winningBlocksHistory.map(block => {
      const MULTIPLIERS_TOTAL = block.multipliers.reduce((acc, curr) => acc + curr, 0);

      return { ...block, multiplierTotal: MULTIPLIERS_TOTAL, realTotal: block.iconValue * MULTIPLIERS_TOTAL };
    });


    const totalGanho = sumMultipliers.reduce((acc, curr) => acc + curr.realTotal, 0);

    updatePlayerValues(totalGanho);

    setTimeout(() => {
      if(totalGanho > 0) {
        openModalWithAnimation(totalGanho);
      } else {
        winText.innerHTML = '';
        infoText.innerHTML = `Rodada finalizada! tente novamente`;
        modal.classList.remove('hidden');
      }
    }, DELAY_WINNING_BLOCKS);

    saveHistory();
    winningBlocksHistory = [];
  }
}

const showBalloon = (iconValue, multipliers, bet = false, betvalue = 0) => {
  return new Promise((resolve) => {
    if(bet) {
      const balloonContainer = document.querySelector('.balloon-container');
    
      // Cria o elemento do balão
      const balloon = document.createElement('div');
      balloon.classList.add('balloon');
      balloon.classList.add('negative');
      balloon.textContent = `- R$ ${betvalue.toFixed(2)}`;
  
      // Adiciona o balão ao container
      balloonContainer.appendChild(balloon);
  
      // Escuta o evento de término da animação
      balloon.addEventListener('animationend', () => {
        balloonContainer.removeChild(balloon);
        resolve();
      });
    } else {
      const balloonContainer = document.querySelector('.balloon-container');
  
      const sumMultipliers = multipliers.reduce((arr, curr) => arr + curr, 0);
      const realValue = iconValue * sumMultipliers;
  
      // Cria o elemento do balão
      const balloon = document.createElement('div');
      balloon.classList.add('balloon');
      balloon.textContent = `+ R$ ${realValue.toFixed(2)}`;
  
      // Adiciona o balão ao container
      balloonContainer.appendChild(balloon);
  
      // Escuta o evento de término da animação
      balloon.addEventListener('animationend', () => {
        balloonContainer.removeChild(balloon);
        resolve();
      });
    }
  });
};

const spinSlot = () => {
  SPIN_BUTTON.disabled = true; // Desabilita o botão
  // Adiciona uma animação de spin nas colunas
  const reelColumns = document.querySelectorAll('.reel-symbol');
  reelColumns.forEach(column => {
      column.classList.add('spinning');
      // Remove a animação após o spin
      setTimeout(() => {
          column.classList.remove('spinning');
      }, DELAY_WINNING_BLOCKS); // Duração da animação de spin (ajuste conforme necessário)
  });

  showBalloon(0, 0, true, bet);

  // Embaralha os emojis nas colunas
  setTimeout(() => {
      for(let col = 0; col < columns; col++) {
          for(let row = 0; row < rows; row++) {
              slot[col][row] = getRandomEmoji();
              multipliedSlot[col][row] = 0; // Reseta o multiplicador
          }
      }

      winningBlocksHistory = [];
      updatePlayerValues();
      renderSlot();

      // Reabilita o botão após o spin e processamento das cascatas
      setTimeout(() => {
          SPIN_BUTTON.disabled = false;
      }, DEKAY_NEW_BLOCKS * 2); // Tempo para completar o spin e processar as cascatas
  }, DELAY_WINNING_BLOCKS * 2); // Tempo para completar a animação de spin antes de renderizar
}

const checkWinCondition = () => {
  const totalWins = winningBlocksHistory.length;
  if (totalWins >= 5) {
      // Adiciona uma animação especial ao botão
      SPIN_BUTTON.classList.add('celebrate');
  }
}

const saveHistory = () => {
  localStorage.setItem('winningBlocksHistory', JSON.stringify(winningBlocksHistory));
}

const loadHistory = () => {
  const history = localStorage.getItem('winningBlocksHistory');
  if (history) {
      winningBlocksHistory = JSON.parse(history);
      //console.log('Histórico Carregado:', winningBlocksHistory);
  }
}

const animateValue = (element, start, end, duration) => {
  const startTime = performance.now();
  
  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1); // Limita entre 0 e 1
    const value = start + progress * (end - start);
    element.textContent = `R$ ${value.toFixed(2)}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const openModalWithAnimation = (maxValue) => {
  const modal = document.querySelector('.win-message');
  const infoText = document.querySelector('.win-info');
  const winText = document.querySelector('.win-text');

  modal.classList.remove('hidden');

  infoText.textContent = `Parabéns você acaba de ganhar!`;
  winText.textContent = `R$ 0.00`;

  animateValue(winText, 0, maxValue, 2000);
};

SPIN_BUTTON.addEventListener('click', spinSlot);

window.addEventListener('DOMContentLoaded', () => {
  songEl.volume = 0.05;
  getEmojiKey();
});