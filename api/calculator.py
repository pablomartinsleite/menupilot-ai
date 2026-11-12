"""
MenuPilot AI - Deterministic Menu Engineering Calculator
Lógica matemática pura e determinística para a Matriz de Engenharia de Cardápio (Kasavana & Smith / BCG).
"""

import csv
import io
import statistics
from typing import List, Tuple
from .models import MenuItemInput, ProcessedMenuItem, MenuSummary, CalculationResponse


def parse_csv_content(csv_content: str) -> List[MenuItemInput]:
    """
    Realiza o parse robusto de um arquivo CSV (seja com vírgula ou ponto-e-vírgula),
    limpando cabeçalhos e tratando conversões numéricas com segurança.
    """
    f = io.StringIO(csv_content.strip())
    # Detecta dialeto do CSV (delimitador vírgula ou ponto e vírgula)
    sample = csv_content[:1024]
    delimiter = ';' if ';' in sample and sample.count(';') > sample.count(',') else ','
    
    reader = csv.DictReader(f, delimiter=delimiter)
    items: List[MenuItemInput] = []
    
    for idx, row in enumerate(reader, start=1):
        # Normaliza chaves para minúsculas sem espaços
        normalized_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        
        item_id = (
            normalized_row.get("id") or 
            normalized_row.get("sku") or 
            str(idx)
        )
        item_name = (
            normalized_row.get("item_name") or 
            normalized_row.get("nome") or 
            normalized_row.get("prato") or 
            f"Item {idx}"
        )
        category = (
            normalized_row.get("category") or 
            normalized_row.get("categoria") or 
            "Geral"
        )
        current_description = (
            normalized_row.get("current_description") or 
            normalized_row.get("descricao") or 
            normalized_row.get("description") or 
            ""
        )
        
        # Limpeza e conversão de valores numéricos (suporta padrão R$ 10,50 ou 10.50)
        def clean_float(val: str, default: float = 0.0) -> float:
            if not val:
                return default
            cleaned = str(val).replace("R$", "").replace(" ", "").replace("%", "")
            if "," in cleaned and "." in cleaned:
                cleaned = cleaned.replace(".", "").replace(",", ".")
            elif "," in cleaned:
                cleaned = cleaned.replace(",", ".")
            try:
                return float(cleaned)
            except ValueError:
                return default

        def clean_int(val: str, default: int = 0) -> int:
            if not val:
                return default
            cleaned = str(val).replace(".", "").replace(",", "").replace(" ", "")
            try:
                return int(float(cleaned))
            except ValueError:
                return default

        price = clean_float(normalized_row.get("price") or normalized_row.get("preco"))
        cost = clean_float(normalized_row.get("cost") or normalized_row.get("custo"))
        orders = clean_int(normalized_row.get("monthly_orders") or normalized_row.get("pedidos") or normalized_row.get("vendas"))
        
        items.append(
            MenuItemInput(
                id=str(item_id),
                item_name=item_name,
                category=category,
                current_description=current_description,
                price=price,
                cost=cost,
                monthly_orders=orders
            )
        )
        
    return items


def calculate_menu_engineering(raw_items: List[MenuItemInput]) -> CalculationResponse:
    """
    Executa todos os cálculos determinísticos da Engenharia de Cardápio:
    - Margem unitária e percentual
    - Faturamento e Lucro por item
    - Linhas de corte (Mediana dos pedidos e Média da margem unitária)
    - Classificação nos 4 quadrantes clássicos
    - KPIs agregados do cardápio
    """
    if not raw_items:
        return CalculationResponse(
            items=[],
            summary=MenuSummary(
                total_revenue=0.0,
                total_profit=0.0,
                total_orders=0,
                average_ticket=0.0,
                overall_margin_pct=0.0,
                popularity_threshold=0.0,
                profitability_threshold=0.0,
                quadrant_counts={}
            )
        )

    # 1. Cálculos preliminares por item
    preliminary_items = []
    margins = []
    orders_list = []
    
    for item in raw_items:
        margin_unit = round(item.price - item.cost, 2)
        margin_pct = round((margin_unit / item.price) * 100, 2) if item.price > 0 else 0.0
        total_rev = round(item.price * item.monthly_orders, 2)
        total_prof = round(margin_unit * item.monthly_orders, 2)
        
        margins.append(margin_unit)
        orders_list.append(item.monthly_orders)
        
        preliminary_items.append({
            "base": item,
            "margin_unit": margin_unit,
            "margin_pct": margin_pct,
            "total_revenue": total_rev,
            "total_profit": total_prof
        })

    # 2. Definição das Linhas de Corte (Benchmarks)
    # Popularidade: Mediana das vendas (ou média se número pequeno)
    popularity_threshold = round(float(statistics.median(orders_list)), 2)
    # Lucratividade: Média da margem de contribuição unitária
    profitability_threshold = round(float(statistics.mean(margins)), 2)

    # 3. Classificação nos 4 Quadrantes da Matriz
    processed_items: List[ProcessedMenuItem] = []
    quadrant_counts = {
        "Estrela": 0,
        "Cavalo de Batalha": 0,
        "Quebra-cabeça": 0,
        "Cão": 0
    }

    for p in preliminary_items:
        base: MenuItemInput = p["base"]
        m_unit = p["margin_unit"]
        orders = base.monthly_orders
        
        is_high_volume = orders >= popularity_threshold
        is_high_margin = m_unit >= profitability_threshold
        
        if is_high_volume and is_high_margin:
            quadrant = "Estrela"
            code = "star"
        elif is_high_volume and not is_high_margin:
            quadrant = "Cavalo de Batalha"
            code = "plowhorse"
        elif not is_high_volume and is_high_margin:
            quadrant = "Quebra-cabeça"
            code = "puzzle"
        else:
            quadrant = "Cão"
            code = "dog"
            
        quadrant_counts[quadrant] += 1
        
        processed_items.append(
            ProcessedMenuItem(
                id=base.id,
                item_name=base.item_name,
                category=base.category,
                current_description=base.current_description,
                price=base.price,
                cost=base.cost,
                monthly_orders=base.monthly_orders,
                margin_unit=m_unit,
                margin_pct=p["margin_pct"],
                total_revenue=p["total_revenue"],
                total_profit=p["total_profit"],
                quadrant=quadrant,
                quadrant_code=code
            )
        )

    # 4. Agregações Globais do Cardápio
    total_rev = round(sum(i.total_revenue for i in processed_items), 2)
    total_prof = round(sum(i.total_profit for i in processed_items), 2)
    total_orders = sum(i.monthly_orders for i in processed_items)
    avg_ticket = round(total_rev / total_orders, 2) if total_orders > 0 else 0.0
    overall_margin = round((total_prof / total_rev) * 100, 2) if total_rev > 0 else 0.0

    summary = MenuSummary(
        total_revenue=total_rev,
        total_profit=total_prof,
        total_orders=total_orders,
        average_ticket=avg_ticket,
        overall_margin_pct=overall_margin,
        popularity_threshold=popularity_threshold,
        profitability_threshold=profitability_threshold,
        quadrant_counts=quadrant_counts
    )

    return CalculationResponse(items=processed_items, summary=summary)

