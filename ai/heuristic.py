# heuristic.py

EMPTY = 0

def evaluate_window(window, piece):
    """Scores a specific window of 4 slots based on how good it is for the player."""
    score = 0
    opp_piece = 1 if piece == 2 else 2

    # A win is the best possible outcome
    if window.count(piece) == 4:
        score += 100
    # A run of 3 is great, especially if there is an empty slot to complete it
    elif window.count(piece) == 3 and window.count(EMPTY) == 1:
        score += 5
    # A run of 2 is a good start
    elif window.count(piece) == 2 and window.count(EMPTY) == 2:
        score += 2

    # Blocking the opponent: if they have 3 in a row, we MUST penalize this state heavily
    if window.count(opp_piece) == 3 and window.count(EMPTY) == 1:
        score -= 4

    return score

def score_position(board, piece):
    """Scans the entire board to calculate an overall score for the given piece."""
    score = 0
    ROWS = len(board)
    COLS = len(board[0])

    # 1. Score center column (Advanced logic: center columns are more valuable)
    # We extract the center column and count how many of our pieces are in it.
    center_column = [board[r][COLS//2] for r in range(ROWS)]
    center_count = center_column.count(piece)
    score += center_count * 3  # Give a flat +3 bonus for every piece in the center

    # 2. Score Horizontal windows
    for r in range(ROWS):
        row_array = board[r]
        for c in range(COLS - 3):
            # Extract a window of 4 horizontal slots
            window = row_array[c:c+4]
            score += evaluate_window(window, piece)

    # 3. Score Vertical windows
    for c in range(COLS):
        col_array = [board[r][c] for r in range(ROWS)]
        for r in range(ROWS - 3):
            # Extract a window of 4 vertical slots
            window = col_array[r:r+4]
            score += evaluate_window(window, piece)

    # 4. Score positively sloped diagonals (/)
    for r in range(ROWS - 3):
        for c in range(COLS - 3):
            window = [board[r+i][c+i] for i in range(4)]
            score += evaluate_window(window, piece)

    # 5. Score negatively sloped diagonals (\)
    for r in range(ROWS - 3):
        for c in range(COLS - 3):
            window = [board[r+3-i][c+i] for i in range(4)]
            score += evaluate_window(window, piece)

    return score