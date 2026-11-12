"""
MenuPilot AI - Data Models and Schemas
Definições de dados para cálculo matemático determinístico e Structured Outputs do Google Gemini.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


# ============================================================================
# Modelos de Entrada e Processamento Determinístico
# ============================================================================

class MenuItemInput(BaseModel):
    id: str = Field(..., description="Identificador único do prato")
    item_name: str = Field(..., description="Nome comercial do item")
    category: str = Field(..., description="Categoria (ex: Burgers, Acompanhamentos, Bebidas, Sobremesas)")
    current_description: str = Field(..., description="Descrição atual exibida no cardápio/iFood")
    price: float = Field(..., description="Preço de venda ao consumidor (R$)")
    cost: float = Field(..., description="Custo de insumos/CMV (R$)")
    monthly_orders: int = Field(..., description="Quantidade de vendas no mês")


class ProcessedMenuItem(MenuItemInput):
    margin_unit: float = Field(..., description="Margem de contribuição unitária (R$) = Preço - Custo")
    margin_pct: float = Field(..., description="Margem percentual unitária (%)")
    total_revenue: float = Field(..., description="Faturamento total gerado pelo item (R$)")
    total_profit: float = Field(..., description="Lucro bruto total gerado pelo item (R$)")
    quadrant: str = Field(..., description="Classificação: Estrela, Cavalo de Batalha, Quebra-cabeça ou Cão")
    quadrant_code: str = Field(..., description="Código do quadrante: star, plowhorse, puzzle, dog")


class MenuSummary(BaseModel):
    total_revenue: float = Field(..., description="Faturamento mensal total da amostra (R$)")
    total_profit: float = Field(..., description="Lucro bruto total estimado (R$)")
    total_orders: int = Field(..., description="Volume total de pedidos no mês")
    average_ticket: float = Field(..., description="Ticket médio por item pedido (R$)")
    overall_margin_pct: float = Field(..., description="Margem média ponderada do cardápio (%)")
    popularity_threshold: float = Field(..., description="Linha de corte de popularidade (mediana dos pedidos)")
    profitability_threshold: float = Field(..., description="Linha de corte de lucratividade (média da margem)")
    quadrant_counts: Dict[str, int] = Field(default_factory=dict, description="Contagem de itens por quadrante")


class CalculationResponse(BaseModel):
    items: List[ProcessedMenuItem]
    summary: MenuSummary


# ============================================================================
# Modelos para Structured Outputs do Google Gemini (gemini-2.5-flash)
# ============================================================================

class CopywritingOptimization(BaseModel):
    item_id: str = Field(..., description="ID correspondente ao item do cardápio")
    item_name: str = Field(..., description="Nome do prato")
    category_matrix: str = Field(..., description="Classificação do prato (ex: Quebra-cabeça ou Estrela)")
    current_description: str = Field(..., description="Descrição original")
    optimized_description: str = Field(
        ...,
        description="Nova descrição persuasiva, rica em apelo sensorial, gatilhos de delivery e apetite appeal"
    )
    rationale: str = Field(
        ...,
        description="Justificativa técnica: por que essa descrição converte mais e ativa a imaginação do cliente"
    )


class StrategicCombo(BaseModel):
    combo_name: str = Field(..., description="Nome comercial magnético do combo para o delivery")
    items_included: List[str] = Field(..., description="Lista de pratos inclusos (âncora + item de alta margem)")
    suggested_price: float = Field(..., description="Preço de venda final sugerido para o combo (R$)")
    original_price_total: float = Field(..., description="Soma dos preços individuais dos itens (R$)")
    estimated_margin_unit: float = Field(..., description="Margem unitária estimada gerada pelo combo (R$)")
    margin_gain_explanation: str = Field(
        ...,
        description="Explicação do ganho de margem e incentivo ao aumento do ticket médio"
    )
    marketing_pitch: str = Field(
        ...,
        description="Chamada publicitária curta (headline) pronta para banner ou notificação push"
    )


class DogActionPlanItem(BaseModel):
    item_id: str = Field(..., description="ID do item")
    item_name: str = Field(..., description="Nome do prato classificado como Cão")
    action_type: str = Field(..., description="Ação sugerida: Reformular, Reajustar Preço ou Remover do Cardápio")
    practical_recommendation: str = Field(
        ...,
        description="Recomendação operacional objetiva (ex: trocar fornecedor, simplificar preparo ou descontinuar)"
    )


class AIReportOutput(BaseModel):
    executive_diagnosis: List[str] = Field(
        ...,
        description="Exatamente 3 bullets objetivos e profundos resumindo a saúde financeira e principais vazamentos de lucro"
    )
    copywriting_optimizations: List[CopywritingOptimization] = Field(
        ...,
        description="Pelo menos 5 otimizações de copywriting focadas nos itens Quebra-cabeça e Estrela"
    )
    strategic_combos: List[StrategicCombo] = Field(
        ...,
        description="3 combos estratégicos pareando âncoras de tráfego com itens de alta margem"
    )
    dog_action_plan: List[DogActionPlanItem] = Field(
        ...,
        description="Recomendações práticas e operacionais para os itens classificados como Cães"
    )
    overall_growth_potential: str = Field(
        ...,
        description="Projeção concisa do potencial de aumento de margem e faturamento com a implementação"
    )


# ============================================================================
# Requisição e Resposta da API de Otimização
# ============================================================================

class OptimizeRequest(BaseModel):
    items: List[ProcessedMenuItem]
    summary: Optional[MenuSummary] = None
    api_key: Optional[str] = Field(None, description="Chave opcional do Google Gemini informada na sessão do usuário")


class OptimizeResponse(BaseModel):
    success: bool = True
    is_simulated: bool = False
    model_used: str = "gemini-2.5-flash"
    report: AIReportOutput
    generated_at: str
    message: Optional[str] = None

