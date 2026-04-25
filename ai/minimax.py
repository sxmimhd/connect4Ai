import math
import random

# We will need the functions we wrote in the other files
from board import COLS, is_valid_location, get_next_open_row, drop_piece, winning_move
from heuristic import score_position

AI_PIECE = 2
HUMAN_PIECE = 1

def get_valid_locations(board):
    """Returns a list of all columns that are not completely full."""
    valid_locations = []
    for col in range(COLS):
        if is_valid_location(board, col):
            valid_locations.append(col)
    return valid_locations

def is_terminal_node(board):
    """Checks if the game has ended (someone won, or it's a draw)."""
    return winning_move(board, HUMAN_PIECE) or winning_move(board, AI_PIECE) or len(get_valid_locations(board)) == 0

def minimax(board, depth, alpha, beta, maximizingPlayer):
    """
    The core adversarial search algorithm with Alpha-Beta pruning.
    Returns a tuple: (best_column_to_play, score_of_that_move)
    """
    valid_locations = get_valid_locations(board)
    is_terminal = is_terminal_node(board)
    
    # BASE CASE: If we reached our depth limit or the game is over
    if depth == 0 or is_terminal:
        if is_terminal:
            if winning_move(board, AI_PIECE):
                return (None, 1000000000000) # AI wins! Huge positive score.
            elif winning_move(board, HUMAN_PIECE):
                return (None, -1000000000000) # Human wins! Huge negative score.
            else:
                return (None, 0) # Game is a draw
        else:
            # We reached the depth limit without a winner, so we use our heuristic!
            return (None, score_position(board, AI_PIECE))
            
    # AI'S TURN (Maximizing Player)
    if maximizingPlayer:
        value = -math.inf
        # Pick a random valid column as a fallback best move
        best_col = random.choice(valid_locations) 
        
        for col in valid_locations:
            row = get_next_open_row(board, col)
            
            # Create a deep copy of the board so we don't modify the real game
            b_copy = [r[:] for r in board] 
            drop_piece(b_copy, row, col, AI_PIECE)
            
            # Recursively call minimax for the human's turn (depth - 1)
            _, new_score = minimax(b_copy, depth - 1, alpha, beta, False)
            
            # If this move is better than our previous best, update it
            if new_score > value:
                value = new_score
                best_col = col
                
            # Alpha-Beta Pruning
            alpha = max(alpha, value)
            if alpha >= beta:
                break # Prune this branch! No need to evaluate further.
                
        return best_col, value
        
    # HUMAN'S TURN (Minimizing Player)
    else: 
        value = math.inf
        best_col = random.choice(valid_locations)
        
        for col in valid_locations:
            row = get_next_open_row(board, col)
            b_copy = [r[:] for r in board]
            drop_piece(b_copy, row, col, HUMAN_PIECE)
            
            # Recursively call minimax for the AI's turn (depth - 1)
            _, new_score = minimax(b_copy, depth - 1, alpha, beta, True)
            
            if new_score < value:
                value = new_score
                best_col = col
                
            # Alpha-Beta Pruning
            beta = min(beta, value)
            if alpha >= beta:
                break # Prune this branch!
                
        return best_col, value