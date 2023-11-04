document.addEventListener('DOMContentLoaded', () => {
  // Retrieving DOM elements
  const resetButton = document.getElementById('reset-button');
  const numberInputs = document.querySelectorAll('.number-input');
  const numberLabels = document.querySelectorAll('.number-label');
  const kimoLiLabel = document.getElementById('spin-predictor-label');
  const statusLabel = document.getElementById('status-label');
  const spinCountsRow = document.querySelectorAll('.row-spin-count');
  const spinCountsCol = document.querySelectorAll('.col-spin-count');
  const matrixCells = document.querySelectorAll('.cell');
  const matrix = [
    [32, 15, 19, 4, 21, 2],
    [25, 17, 34, 6, 27, 13],
    [36, 11, 30, 8, 23, 10],
    [5, 24, 16, 33, 1, 20],
    [14, 31, 9, 22, 18, 29],
    [7, 28, 12, 35, 3, 26]
  ];

  let spinCount = 0;
  let history = [];
  let selectedNumbers = [];
  let greenNumbers = [];
  let selectedMatrixLabel = null;

  for (let i = 0; i < numberLabels.length; i++) {
    numberLabels[i].addEventListener('click', () => {
      const num = parseInt(numberInputs[i].value);
      for (let j = 0; j < numberLabels.length; j++) {
        const label = numberLabels[j];
        const input = numberInputs[j];
        if (label.classList.contains('selected')) {
          label.classList.remove('selected');
          input.checked = false;
        }
      }
      // Check if the number is already selected
      if (selectedNumbers.includes(num)) {
        // If the number is already selected, deselect it and then reselect it, this allows the number to be respun
        const index = selectedNumbers.indexOf(num);
        selectedNumbers.splice(index, 1);
        numberLabels[i].classList.remove('selected');
      }

      // Select the number
      selectedNumbers.push(num);
      numberLabels[i].classList.add('selected');
      updateSelectedMatrixLabel();
      spin();
    });
  }

  resetButton.addEventListener('click', () => {
    spinCount = 0;
    history = [];
    selectedNumbers = [];
    selectedMatrixLabel?.classList.remove('selected', 'bold'); // Remove 'bold' class along with 'selected'
    selectedMatrixLabel = null;
    for (let i = 0; i < spinCountsRow.length; i++) {
      const spinCountRow = spinCountsRow[i];
      const spinCountCol = spinCountsCol[i];
      spinCountRow.textContent = '0';
      spinCountCol.textContent = '0';
    }
    const matrixLabels = document.querySelectorAll('.cell');
    for (const label of matrixLabels) {
      label.classList.remove('green', 'yellow', 'bold'); // Remove 'bold' class
    }
    const numberLabels = document.querySelectorAll('.number-label');
    for (const label of numberLabels) {
      label.classList.remove('selected');
    }
    kimoLiLabel.textContent = 'Spin Predictor:';
    greenNumbers = [];
    updateStatusLabel();
  });  

  function spin() {
    spinCount++;
    const selectedNum = selectedNumbers[selectedNumbers.length - 1];
    let row = -1;
    let col = -1;
  
    // Find the selected number in the matrix
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === selectedNum) {
          row = i;
          col = j;
          break;
        }
      }
      if (row !== -1) {
        break;
      }
    }
  
    const spinCountRow = spinCountsRow[row];
    const spinCountCol = spinCountsCol[col];
    spinCountRow.textContent = parseInt(spinCountRow.textContent) + 1;
    spinCountCol.textContent = parseInt(spinCountCol.textContent) + 1;
  
    history.unshift(selectedNum);
    updateStatusLabel();
    boldCurrentSpunNumber(row, col);
    checkRowCol();
  }
  
  function boldCurrentSpunNumber(row, col) {
    const matrixLabels = document.querySelectorAll('.cell');
    for (const label of matrixLabels) {
      label.classList.remove('bold');
    }
  
    const currentMatrixLabel = document.querySelector(`.row:nth-child(${row + 1}) .cell:nth-child(${col + 1})`);
    currentMatrixLabel.classList.add('bold');
  }  

  function updateSelectedMatrixLabel() {
    const selectedNum = selectedNumbers[selectedNumbers.length - 1];
    let row = -1;
    let col = -1;

    // Find the selected number in the matrix
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === selectedNum) {
          row = i;
          col = j;
          break;
        }
      }
      if (row !== -1) {
        break;
      }
    }

    const matrixLabel = document.querySelector(`.row:nth-child(${row + 1}) .cell:nth-child(${col + 1})`);
    if (matrixLabel.classList.contains('green')) {
      matrixLabel.classList.remove('green');
      const num = parseInt(matrixLabel.textContent);
      const index = greenNumbers.indexOf(num);
      if (index !== -1) {
        greenNumbers.splice(index, 1);
      }
    }
    matrixLabel.classList.add('yellow');
    if (selectedMatrixLabel !== matrixLabel) {
      selectedMatrixLabel?.classList.remove('selected');
      matrixLabel.classList.add('selected');
      selectedMatrixLabel = matrixLabel;
    }
  }

  function checkRowCol() {
    function addNewKimoLiNumber(newKimoLiNumber) {
      if (!greenNumbers.includes(newKimoLiNumber)) {
        greenNumbers.push(newKimoLiNumber);
      }
    }

    // Check rows
    for (let i = 0; i < 6; i++) {
      const rowLabels = document.querySelectorAll(`.row:nth-child(${i + 1}) .cell`);
      const rowSelectedCount = Array.from(rowLabels).filter(label => label.classList.contains('yellow')).length;
      if (rowSelectedCount >= 5) {
        const lastElement = Array.from(rowLabels).find(label => !label.classList.contains('yellow'));
        if (lastElement) {
          if (lastElement.classList.contains('green')) {
            lastElement.classList.remove('green');
            const num = parseInt(lastElement.textContent);
            const index = greenNumbers.indexOf(num);
            if (index !== -1) {
              greenNumbers.splice(index, 1);
            }
          }
          lastElement.classList.add('green');
          const num = parseInt(lastElement.textContent);
          addNewKimoLiNumber(num);
        }
      }
    }

    // Check columns
    for (let j = 0; j < 6; j++) {
      const colLabels = document.querySelectorAll(`.row .cell:nth-child(${j + 1})`);
      const colSelectedCount = Array.from(colLabels).filter(label => label.classList.contains('yellow')).length;
      if (colSelectedCount >= 5) {
        const lastElement = Array.from(colLabels).find(label => !label.classList.contains('yellow'));
        if (lastElement) {
          if (lastElement.classList.contains('green')) {
            lastElement.classList.remove('green');
            const num = parseInt(lastElement.textContent);
            const index = greenNumbers.indexOf(num);
            if (index !== -1) {
              greenNumbers.splice(index, 1);
            }
          }
          lastElement.classList.add('green');
          const num = parseInt(lastElement.textContent);
          addNewKimoLiNumber(num);
        }
      }
    }

    // Update the Kimo Li number label
    const kimoLiNumbersStr = greenNumbers.reverse().join(', ');
    kimoLiLabel.textContent = `Spin Predictor: ${kimoLiNumbersStr}`;
  }

  function updateStatusLabel() {
    const spinText = `Spin count: ${spinCount}`;
    const historyText = `History: ${history.join(', ')}`;
    statusLabel.innerHTML = `${spinText}<br>${historyText}`;
  }
});
