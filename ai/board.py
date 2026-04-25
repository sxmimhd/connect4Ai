# board.py

# Constants for the game dimensions and player pieces
ROWS = 6
COLS = 7
EMPTY = 0
PLAYER_1 = 1
PLAYER_2 = 2

def create_board():
    """Initializes the board as an empty 2D array."""
    return [[EMPTY for _ in range(COLS)] for _ in range(ROWS)]

def is_valid_location(board, col):
    """Ensures a disc is placed in a valid column (not full)."""
    # If the very top row (index 0) of that column is empty, it's a valid move.
    return board[0][col] == EMPTY

def get_next_open_row(board, col):
    """Finds the lowest available space in the column."""
    # Loop from the bottom row (index 5) up to the top row (index 0).
    for r in range(ROWS - 1, -1, -1):
        if board[r][col] == EMPTY:
            return r
    return None

def drop_piece(board, row, col, piece):
    """Drops the piece into the board array."""
    board[row][col] = piece

def winning_move(board, piece):
    """Checks if a player has connected four discs."""
    # 1. Check horizontal locations
    for c in range(COLS - 3):
        for r in range(ROWS):
            if board[r][c] == piece and board[r][c+1] == piece and board[r][c+2] == piece and board[r][c+3] == piece:
                return True

    # 2. Check vertical locations
    for c in range(COLS):
        for r in range(ROWS - 3):
            if board[r][c] == piece and board[r+1][c] == piece and board[r+2][c] == piece and board[r+3][c] == piece:
                return True

    # 3. Check positively sloped diagonals (/)
    for c in range(COLS - 3):
        for r in range(ROWS - 3):
            if board[r][c] == piece and board[r+1][c+1] == piece and board[r+2][c+2] == piece and board[r+3][c+3] == piece:
                return True

    # 4. Check negatively sloped diagonals (\)
    for c in range(COLS - 3):
        for r in range(3, ROWS):
            if board[r][c] == piece and board[r-1][c+1] == piece and board[r-2][c+2] == piece and board[r-3][c+3] == piece:
                return True
                
    return False

def is_draw(board):
    """Checks if the board is full without a winner."""
    # If there are no empty slots in the top row, the board is entirely full.
    for c in range(COLS):
        if board[0][c] == EMPTY:
            return False
    return True