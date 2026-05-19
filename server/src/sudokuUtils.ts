function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function findEmpty(grid: number[][]): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function solve(grid: number[][]): boolean {
  const empty = findEmpty(grid);
  if (!empty) return true;
  const [row, col] = empty;
  for (const num of shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;
      if (solve(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

function solveOrdered(grid: number[][]): boolean {
  const empty = findEmpty(grid);
  if (!empty) return true;
  const [row, col] = empty;
  for (let num = 1; num <= 9; num++) {
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;
      if (solveOrdered(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

function countSolutions(grid: number[][], limit = 2): number {
  let count = 0;
  function bt(g: number[][]): void {
    if (count >= limit) return;
    const empty = findEmpty(g);
    if (!empty) { count++; return; }
    const [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
      if (isValid(g, row, col, num)) {
        g[row][col] = num;
        bt(g);
        g[row][col] = 0;
      }
    }
  }
  bt(grid.map(r => [...r]));
  return count;
}

function generateSolvedGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let box = 0; box < 3; box++) {
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let i = 0;
    for (let r = box * 3; r < box * 3 + 3; r++) {
      for (let c = box * 3; c < box * 3 + 3; c++) {
        grid[r][c] = nums[i++];
      }
    }
  }
  solve(grid);
  return grid;
}

const DIFFICULTY_EMPTY: Record<string, number> = {
  easy: 32,
  medium: 42,
  hard: 50,
  expert: 56,
};

export function generateSudoku(difficulty: string): { puzzle: number[][]; solution: number[][] } {
  const solution = generateSolvedGrid();
  const puzzle = solution.map(r => [...r]);
  const target = DIFFICULTY_EMPTY[difficulty] ?? 42;

  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= target) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}

export function solveSudoku(grid: number[][]): number[][] | null {
  const copy = grid.map(r => [...r]);
  if (solveOrdered(copy)) return copy;
  return null;
}

export function validatePartialPuzzle(grid: number[][]): boolean {
  if (!Array.isArray(grid) || grid.length !== 9) return false;
  for (let row = 0; row < 9; row++) {
    if (!Array.isArray(grid[row]) || grid[row].length !== 9) return false;
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col];
      if (num < 0 || num > 9 || !Number.isInteger(num)) return false;
      if (num === 0) continue;
      grid[row][col] = 0;
      const valid = isValid(grid, row, col, num);
      grid[row][col] = num;
      if (!valid) return false;
    }
  }
  return true;
}

export function countEmpty(grid: number[][]): number {
  return grid.flat().filter(v => v === 0).length;
}
