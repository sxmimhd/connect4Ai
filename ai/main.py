# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

# Import our game logic
from minimax import minimax, AI_PIECE, is_terminal_node
from board import drop_piece, get_next_open_row

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # You can restrict this to your Vercel URL later!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS SETUP ---
# This allows your React frontend (typically running on port 3000 or 5173) 
# to communicate with this FastAPI backend without browser security blocks.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your exact React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
# This defines the exact JSON structure we expect React to send us.
class GameState(BaseModel):
    board: list[list[int]]  # The 6x7 2D array
    depth: int = 5          # The AI difficulty (Advanced = 5+)

# --- API ENDPOINTS ---
@app.post("/api/play-turn")
async def play_turn(state: GameState):
    """
    Receives the current board from React, calculates the AI's best move,
    and returns the column the AI chose.
    """
    current_board = state.board
    
    # Check if the human's last move already ended the game
    if is_terminal_node(current_board):
        return {"status": "game_over", "message": "Game is already over."}

    # 1. Ask the AI to find the best move
    # We pass maximizingPlayer=True because the AI wants to maximize its score
    best_col, minimax_score = minimax(
        current_board, 
        depth=state.depth, 
        alpha=-math.inf, 
        beta=math.inf, 
        maximizingPlayer=True
    )
    
    # 2. Safety check: Ensure the AI actually found a valid column
    if best_col is not None:
        # Note: You can either have Python drop the piece and return the whole new board,
        # or just return the column number and let React update its own board state.
        # Returning just the column is usually cleaner for web apps!
        
        return {
            "status": "success",
            "ai_column": best_col,
            "ai_score": minimax_score
        }
    else:
        return {"status": "error", "message": "No valid moves left."}

# To run this server, you would type this in your terminal:
# uvicorn main:app --reload