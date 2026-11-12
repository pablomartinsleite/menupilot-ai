"""
MenuPilot AI - Main FastAPI Application
Rotas REST para cálculo determinístico e otimização por IA (Google Gemini 2.5 Flash).
Compatível com execução local (Uvicorn) e Serverless Deployment na Vercel.
"""

import os
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .models import (
    MenuItemInput,
    CalculationResponse,
    OptimizeRequest,
    OptimizeResponse
)
from .calculator import parse_csv_content, calculate_menu_engineering
from .ai_service import optimize_menu_with_gemini

# Inicializa aplicação FastAPI
app = FastAPI(
    title="MenuPilot AI - API",
    description="Copiloto de Engenharia de Cardápio e Otimização com Google Gemini para Delivery",
    version="1.0.0"
)

# Configuração de CORS para permitir acesso local e na Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminho para pasta de arquivos públicos / estáticos
BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
SAMPLE_CSV_PATH = PUBLIC_DIR / "sample_menu.csv"


# ============================================================================
# Endpoints da API (/api/...)
# ============================================================================

@app.get("/api/health")
def health_check():
    """Verifica a integridade da aplicação e status de configuração da IA."""
    has_env_key = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    return {
        "status": "healthy",
        "app": "MenuPilot AI",
        "version": "1.0.0",
        "has_gemini_key_in_env": has_env_key,
        "supported_model": "gemini-2.5-flash",
        "framework": "FastAPI + google-genai"
    }


@app.get("/api/sample-data", response_model=CalculationResponse)
def get_sample_data():
    """Carrega instantaneamente o dataset de exemplo (hamburgueria artesanal com 16 itens)."""
    if not SAMPLE_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="Arquivo de exemplo sample_menu.csv não encontrado.")
    
    with open(SAMPLE_CSV_PATH, "r", encoding="utf-8") as f:
        csv_text = f.read()
        
    items = parse_csv_content(csv_text)
    return calculate_menu_engineering(items)


@app.post("/api/calculate", response_model=CalculationResponse)
async def calculate_menu(
    file: Optional[UploadFile] = File(None),
    raw_csv: Optional[str] = Form(None)
):
    """
    Recebe um arquivo CSV enviado pelo usuário ou texto CSV cru e executa
    a análise matemática determinística da Engenharia de Cardápio.
    """
    content = ""
    if file:
        file_bytes = await file.read()
        try:
            content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            # Fallback para latin1 caso o Excel do Windows salve em ANSI
            content = file_bytes.decode("latin-1")
    elif raw_csv:
        content = raw_csv
    else:
        raise HTTPException(status_code=400, detail="Nenhum arquivo CSV ou texto fornecido.")

    items = parse_csv_content(content)
    if not items:
        raise HTTPException(status_code=400, detail="Nenhum item válido identificado no CSV.")

    return calculate_menu_engineering(items)


@app.post("/api/optimize", response_model=OptimizeResponse)
def optimize_menu(
    request: OptimizeRequest,
    x_gemini_api_key: Optional[str] = Header(default=None)
):
    """
    Endpoint principal da IA: recebe os itens processados matematicamente e
    chama o Google Gemini (gemini-2.5-flash) com Structured Outputs (JSON Schema).
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="A lista de itens não pode estar vazia.")

    # Prioridade da chave: corpo da requisição > header HTTP > variável de ambiente
    header_key = x_gemini_api_key if isinstance(x_gemini_api_key, str) else None
    effective_key = request.api_key or header_key

    result = optimize_menu_with_gemini(
        items=request.items,
        summary=request.summary,
        custom_api_key=effective_key
    )
    return result


# ============================================================================
# Servindo arquivos estáticos no ambiente local
# ============================================================================

if PUBLIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(PUBLIC_DIR), html=True), name="public")
