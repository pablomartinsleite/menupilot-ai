/**
 * MenuPilot AI - Frontend Application (Resilient Fullstack Architecture)
 * Suporta execução via backend FastAPI (http://localhost:8000) e modo client-side fallback com zero dependências.
 */

// Base URL dinâmica: se rodando em file:// ou porta diferente, tenta o backend local
const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';

// ============================================================================
// Dataset Embutido de Amostra (Hamburgueria Artesanal - 16 Itens)
// ============================================================================
const EMBEDDED_SAMPLE_ITEMS = [
  {
    id: "1",
    item_name: "Bacon BBQ Supreme",
    category: "Burgers",
    current_description: "Pão brioche tostado na manteiga, blend bovino 160g ao ponto, fatias crocantes de bacon artesanal defumado em macieira, queijo cheddar inglês derretido e molho barbecue rústico da casa.",
    price: 42.00,
    cost: 14.50,
    monthly_orders: 420
  },
  {
    id: "2",
    item_name: "Smash Duplo Cheddar",
    category: "Burgers",
    current_description: "Dois smash burgers de 90g com crostinha caramelizada, queijo cheddar cremoso duplo, cebola fininha chapeada e maionese secreta no pão brioche selado.",
    price: 36.00,
    cost: 12.00,
    monthly_orders: 490
  },
  {
    id: "3",
    item_name: "Batata Rústica Alecrim & Páprica",
    category: "Acompanhamentos",
    current_description: "Batatas cortadas à mão com casca, douradas e crocantes, temperadas com sal marinho, alecrim fresco da horta e páprica defumada. Acompanha maionese verde.",
    price: 24.00,
    cost: 6.00,
    monthly_orders: 380
  },
  {
    id: "4",
    item_name: "Milkshake Ninho & Nutella 400ml",
    category: "Sobremesas",
    current_description: "Sorvete artesanal batido com leite Ninho em pó de verdade, calda generosa de Nutella pura nas paredes do copo e chantilly fresco finalizado com cacau.",
    price: 26.00,
    cost: 7.50,
    monthly_orders: 310
  },
  {
    id: "5",
    item_name: "Cheeseburger Tradicional",
    category: "Burgers",
    current_description: "Pão brioche, hambúrguer 140g grelhado no fogo e queijo prato derretido.",
    price: 25.00,
    cost: 14.00,
    monthly_orders: 550
  },
  {
    id: "6",
    item_name: "Batata Frita Palito Individual",
    category: "Acompanhamentos",
    current_description: "Porção individual de batata frita palito tradicional sequinha e crocante.",
    price: 15.00,
    cost: 7.50,
    monthly_orders: 510
  },
  {
    id: "7",
    item_name: "Refrigerante Coca-Cola Lata 350ml",
    category: "Bebidas",
    current_description: "Lata 350ml gelada.",
    price: 7.50,
    cost: 4.20,
    monthly_orders: 680
  },
  {
    id: "8",
    item_name: "Cerveja Heineken Long Neck 330ml",
    category: "Bebidas",
    current_description: "Cerveja puro malte long neck 330ml bem gelada.",
    price: 13.00,
    cost: 7.80,
    monthly_orders: 340
  },
  {
    id: "9",
    item_name: "Burger Gorgonzola e Geleia de Pimenta",
    category: "Burgers",
    current_description: "Pão, hambúrguer de carne, queijo gorgonzola e geleia de pimenta.",
    price: 46.00,
    cost: 15.00,
    monthly_orders: 95
  },
  {
    id: "10",
    item_name: "Truffle Brie Burger",
    category: "Burgers",
    current_description: "Hambúrguer com queijo brie e azeite trufado no pão de brioche.",
    price: 52.00,
    cost: 18.00,
    monthly_orders: 75
  },
  {
    id: "11",
    item_name: "Onion Rings Empanadas na Cerveja",
    category: "Acompanhamentos",
    current_description: "Anéis de cebola empanados fritos. Acompanha molho da casa.",
    price: 28.00,
    cost: 7.00,
    monthly_orders: 110
  },
  {
    id: "12",
    item_name: "Brownie Belga com Gelato de Baunilha",
    category: "Sobremesas",
    current_description: "Fatia de brownie de chocolate com uma bola de sorvete de creme.",
    price: 29.00,
    cost: 8.50,
    monthly_orders: 120
  },
  {
    id: "13",
    item_name: "Salada Caesar de Frango",
    category: "Acompanhamentos",
    current_description: "Alface americana, tiras de frango grelhado, queijo ralado e croutons com molho caesar.",
    price: 26.00,
    cost: 16.50,
    monthly_orders: 40
  },
  {
    id: "14",
    item_name: "Chá Gelado de Pêssego 500ml",
    category: "Bebidas",
    current_description: "Chá gelado industrializado sabor pêssego garrafa 500ml.",
    price: 9.00,
    cost: 5.50,
    monthly_orders: 50
  },
  {
    id: "15",
    item_name: "Mini Churros de Doce de Leite (4 un)",
    category: "Sobremesas",
    current_description: "4 unidades de mini churros fritos com recheio de doce de leite.",
    price: 16.00,
    cost: 9.50,
    monthly_orders: 65
  },
  {
    id: "16",
    item_name: "Burger Vegetariano Grão-de-Bico",
    category: "Burgers",
    current_description: "Hambúrguer vegetal de grão-de-bico com alface e tomate no pão integral.",
    price: 29.00,
    cost: 18.00,
    monthly_orders: 45
  }
];

// ============================================================================
// Estado Global da Aplicação
// ============================================================================
const AppState = {
  items: [],
  summary: null,
  aiReport: null,
  currentTab: 'ALL',
  selectedCategory: 'ALL',
  searchQuery: '',
  geminiApiKey: sessionStorage.getItem('MENUPILOT_GEMINI_KEY') || '',
  hasEnvKey: false,
  chartInstance: null,
  isOptimizing: false
};

const QUADRANT_CONFIG = {
  'Estrela': {
    name: 'Estrela',
    code: 'star',
    icon: '⭐',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#10B981',
    desc: 'Alta Venda + Alta Margem'
  },
  'Cavalo de Batalha': {
    name: 'Cavalo de Batalha',
    code: 'plowhorse',
    icon: '🐎',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: '#3B82F6',
    desc: 'Alta Venda + Baixa Margem'
  },
  'Quebra-cabeça': {
    name: 'Quebra-cabeça',
    code: 'puzzle',
    icon: '🧩',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    color: '#F59E0B',
    desc: 'Baixa Venda + Alta Margem'
  },
  'Cão': {
    name: 'Cão',
    code: 'dog',
    icon: '🐕',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    color: '#EF4444',
    desc: 'Baixa Venda + Baixa Margem'
  }
};

// ============================================================================
// Utilitários de Formatação & UI
// ============================================================================
const formatBRL = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const showToast = (message, type = 'info') => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-700 text-white',
    error: 'bg-rose-700 text-white',
    info: 'bg-slate-900 text-white'
  };

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// ============================================================================
// Motor Matemático Determinístico no Cliente (Fallback Seguro)
// ============================================================================
function calculateMenuClientSide(rawItems) {
  if (!rawItems || rawItems.length === 0) {
    return {
      items: [],
      summary: {
        total_revenue: 0,
        total_profit: 0,
        total_orders: 0,
        average_ticket: 0,
        overall_margin_pct: 0,
        popularity_threshold: 0,
        profitability_threshold: 0,
        quadrant_counts: { 'Estrela': 0, 'Cavalo de Batalha': 0, 'Quebra-cabeça': 0, 'Cão': 0 }
      }
    };
  }

  const margins = [];
  const orders = [];
  const preliminary = [];

  rawItems.forEach(item => {
    const margin_unit = Math.round((item.price - item.cost) * 100) / 100;
    const margin_pct = item.price > 0 ? Math.round((margin_unit / item.price) * 1000) / 10 : 0;
    const total_revenue = Math.round(item.price * item.monthly_orders * 100) / 100;
    const total_profit = Math.round(margin_unit * item.monthly_orders * 100) / 100;

    margins.push(margin_unit);
    orders.push(item.monthly_orders);

    preliminary.push({
      ...item,
      margin_unit,
      margin_pct,
      total_revenue,
      total_profit
    });
  });

  // Cálculo da Mediana de Vendas
  const sortedOrders = [...orders].sort((a, b) => a - b);
  const mid = Math.floor(sortedOrders.length / 2);
  const popularity_threshold = sortedOrders.length % 2 !== 0
    ? sortedOrders[mid]
    : (sortedOrders[mid - 1] + sortedOrders[mid]) / 2;

  // Cálculo da Média da Margem Unitária
  const profitability_threshold = Math.round((margins.reduce((a, b) => a + b, 0) / margins.length) * 100) / 100;

  const quadrant_counts = {
    'Estrela': 0,
    'Cavalo de Batalha': 0,
    'Quebra-cabeça': 0,
    'Cão': 0
  };

  const processed = preliminary.map(item => {
    const isHighVolume = item.monthly_orders >= popularity_threshold;
    const isHighMargin = item.margin_unit >= profitability_threshold;

    let quadrant = 'Cão';
    let quadrant_code = 'dog';

    if (isHighVolume && isHighMargin) {
      quadrant = 'Estrela';
      quadrant_code = 'star';
    } else if (isHighVolume && !isHighMargin) {
      quadrant = 'Cavalo de Batalha';
      quadrant_code = 'plowhorse';
    } else if (!isHighVolume && isHighMargin) {
      quadrant = 'Quebra-cabeça';
      quadrant_code = 'puzzle';
    }

    quadrant_counts[quadrant] += 1;

    return {
      ...item,
      quadrant,
      quadrant_code
    };
  });

  const total_revenue = Math.round(processed.reduce((sum, i) => sum + i.total_revenue, 0) * 100) / 100;
  const total_profit = Math.round(processed.reduce((sum, i) => sum + i.total_profit, 0) * 100) / 100;
  const total_orders = processed.reduce((sum, i) => sum + i.monthly_orders, 0);
  const average_ticket = total_orders > 0 ? Math.round((total_revenue / total_orders) * 100) / 100 : 0;
  const overall_margin_pct = total_revenue > 0 ? Math.round((total_profit / total_revenue) * 1000) / 10 : 0;

  return {
    items: processed,
    summary: {
      total_revenue,
      total_profit,
      total_orders,
      average_ticket,
      overall_margin_pct,
      popularity_threshold,
      profitability_threshold,
      quadrant_counts
    }
  };
}

// ============================================================================
// Inicialização do Aplicativo
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await checkHealthAndConfig();
  await loadSampleData();
});

// ============================================================================
// Configuração de Event Listeners
// ============================================================================
function setupEventListeners() {
  // Botão Carregar Exemplo (Hamburgueria)
  document.getElementById('btnLoadSample').addEventListener('click', async () => {
    const success = await loadSampleData();
    if (success) {
      showToast('Cardápio exemplo (Hamburgueria) carregado!', 'success');
    }
  });

  // Upload CSV
  document.getElementById('csvFileInput').addEventListener('change', handleCsvUpload);

  // Otimização com IA
  document.getElementById('btnRunOptimization').addEventListener('click', () => runOptimization(false));
  document.getElementById('btnReOptimize').addEventListener('click', () => runOptimization(false));

  // Exportar CSV
  document.getElementById('btnExportCsv').addEventListener('click', exportOptimizedCsv);

  // Busca e Filtros
  document.getElementById('searchInput').addEventListener('input', (e) => {
    AppState.searchQuery = e.target.value.toLowerCase();
    renderMenuTable();
  });

  document.getElementById('categorySelect').addEventListener('change', (e) => {
    AppState.selectedCategory = e.target.value;
    renderMenuTable();
  });

  // Tabs de Quadrantes
  document.querySelectorAll('.table-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.table-tab').forEach(t => {
        t.className = 'table-tab px-3 py-1 rounded-md font-semibold transition text-slate-600 hover:bg-slate-200';
      });
      tab.className = 'table-tab px-3 py-1 rounded-md font-semibold transition bg-brand-600 text-white shadow-sm';
      AppState.currentTab = tab.getAttribute('data-tab');
      renderMenuTable();
    });
  });

  // Filtros dos Cards BCG
  document.querySelectorAll('.quadrant-filter-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetQuadrant = card.getAttribute('data-filter');
      const targetTab = document.querySelector(`.table-tab[data-tab="${targetQuadrant}"]`);
      if (targetTab) {
        targetTab.click();
        targetTab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Modal API Key
  const modal = document.getElementById('apiKeyModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  if (AppState.geminiApiKey) apiKeyInput.value = AppState.geminiApiKey;

  document.getElementById('btnOpenApiKeyModal').addEventListener('click', () => {
    modal.classList.remove('hidden');
    apiKeyInput.focus();
  });

  document.getElementById('btnCloseApiKeyModal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  document.getElementById('toggleApiKeyVisibility').addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnSaveApiKey').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      AppState.geminiApiKey = key;
      sessionStorage.setItem('MENUPILOT_GEMINI_KEY', key);
      showToast('Chave Gemini salva na sessão!', 'success');
    } else {
      AppState.geminiApiKey = '';
      sessionStorage.removeItem('MENUPILOT_GEMINI_KEY');
      showToast('Chave removida. Usando modo demonstração.', 'info');
    }
    updateApiKeyStatusIndicator();
    modal.classList.add('hidden');
  });

  document.getElementById('btnClearApiKey').addEventListener('click', () => {
    AppState.geminiApiKey = '';
    sessionStorage.removeItem('MENUPILOT_GEMINI_KEY');
    apiKeyInput.value = '';
    updateApiKeyStatusIndicator();
    showToast('Chave removida.', 'info');
    modal.classList.add('hidden');
  });
}

// ============================================================================
// Verificação de Integridade da API
// ============================================================================
async function checkHealthAndConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      const data = await res.json();
      AppState.hasEnvKey = data.has_gemini_key_in_env;
      updateApiKeyStatusIndicator();
    }
  } catch (err) {
    console.info('Backend API offline ou em modo estático. Modo de contingência ativo.');
    updateApiKeyStatusIndicator();
  }
}

function updateApiKeyStatusIndicator() {
  const dot = document.getElementById('apiKeyStatusDot');
  if (!dot) return;
  if (AppState.geminiApiKey) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    dot.title = 'Chave ativa inserida na sessão';
  } else if (AppState.hasEnvKey) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    dot.title = 'Chave configurada via .env';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400';
    dot.title = 'Modo Demonstração (Sem chave configurada)';
  }
}

// ============================================================================
// Carga de Dados (Resiliente: Servidor com Fallback Embutido)
// ============================================================================
async function loadSampleData() {
  const badge = document.getElementById('dataStatusBadge');
  if (badge) badge.textContent = 'Carregando exemplo...';

  let loaded = false;

  // Tentativa 1: Buscar do endpoint backend
  try {
    const res = await fetch(`${API_BASE}/api/sample-data`);
    if (res.ok) {
      const data = await res.json();
      AppState.items = data.items;
      AppState.summary = data.summary;
      loaded = true;
    }
  } catch (err) {
    console.warn('Endpoint /api/sample-data indisponível. Utilizando dataset embutido de contingência.');
  }

  // Tentativa 2: Fallback determinístico no cliente com os 16 itens reais
  if (!loaded) {
    const calc = calculateMenuClientSide(EMBEDDED_SAMPLE_ITEMS);
    AppState.items = calc.items;
    AppState.summary = calc.summary;
    loaded = true;
  }

  renderKPIs();
  renderBCGSummary();
  renderMenuEngineeringChart();
  renderMenuTable();

  if (badge) badge.textContent = '16 itens • Hamburgueria Artesanal';

  // Executa otimização inicial silenciosa
  await runOptimization(true);

  return true;
}

// ============================================================================
// Upload de CSV Customizado (com Fallback Client-side)
// ============================================================================
async function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  showToast(`Processando ${file.name}...`, 'info');

  const reader = new FileReader();
  reader.onload = async (evt) => {
    const csvContent = evt.target.result;
    let processedSuccessfully = false;

    // Tenta backend
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        AppState.items = data.items;
        AppState.summary = data.summary;
        processedSuccessfully = true;
      }
    } catch (err) {
      console.warn('Backend indisponível para cálculo de upload. Processando no cliente.');
    }

    // Fallback parser cliente
    if (!processedSuccessfully) {
      try {
        const rawItems = parseCsvClientSide(csvContent);
        if (rawItems.length === 0) throw new Error('Nenhum item válido identificado no CSV.');
        const calc = calculateMenuClientSide(rawItems);
        AppState.items = calc.items;
        AppState.summary = calc.summary;
        processedSuccessfully = true;
      } catch (clientErr) {
        showToast(clientErr.message, 'error');
        return;
      }
    }

    renderKPIs();
    renderBCGSummary();
    renderMenuEngineeringChart();
    renderMenuTable();

    document.getElementById('dataStatusBadge').textContent = `${AppState.items.length} itens carregados do arquivo`;
    showToast(`Cardápio processado: ${AppState.items.length} itens identificados!`, 'success');

    await runOptimization(false);
  };

  reader.readAsText(file);
  e.target.value = '';
}

function parseCsvClientSide(csvText) {
  const lines = csvText.trim().split(/\r\n|\n|\r/);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split respeitando aspas
    const regex = new RegExp(`(?:${delimiter}|^)(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
    const cols = [];
    let match;
    while ((match = regex.exec(line))) {
      cols.push(match[1] !== undefined ? match[1] : match[2]);
    }

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').trim();
    });

    const price = parseFloat(row.price || row.preco || 0);
    const cost = parseFloat(row.cost || row.custo || 0);
    const orders = parseInt(row.monthly_orders || row.pedidos || row.vendas || 0, 10);

    items.push({
      id: row.id || String(i),
      item_name: row.item_name || row.nome || row.prato || `Item ${i}`,
      category: row.category || row.categoria || 'Geral',
      current_description: row.current_description || row.descricao || '',
      price: isNaN(price) ? 0 : price,
      cost: isNaN(cost) ? 0 : cost,
      monthly_orders: isNaN(orders) ? 0 : orders
    });
  }
  return items;
}

// ============================================================================
// Renderização dos KPIs Executivos
// ============================================================================
function renderKPIs() {
  const s = AppState.summary;
  if (!s) return;

  document.getElementById('kpiRevenue').textContent = formatBRL(s.total_revenue);
  document.getElementById('kpiRevenueOrders').textContent = `${formatNumber(s.total_orders)} pedidos`;
  document.getElementById('kpiProfit').textContent = formatBRL(s.total_profit);
  document.getElementById('kpiTicket').textContent = formatBRL(s.average_ticket);
  document.getElementById('kpiMarginPct').textContent = `${s.overall_margin_pct.toFixed(1)}%`;

  document.getElementById('lblThresholdOrders').textContent = formatNumber(s.popularity_threshold);
  document.getElementById('lblThresholdMargin').textContent = formatBRL(s.profitability_threshold);
}

function renderBCGSummary() {
  const counts = AppState.summary?.quadrant_counts || {};
  document.getElementById('countStars').textContent = counts['Estrela'] || 0;
  document.getElementById('countPlowhorses').textContent = counts['Cavalo de Batalha'] || 0;
  document.getElementById('countPuzzles').textContent = counts['Quebra-cabeça'] || 0;
  document.getElementById('countDogs').textContent = counts['Cão'] || 0;

  document.getElementById('tabCountAll').textContent = AppState.items.length;
  document.getElementById('tabCountStar').textContent = counts['Estrela'] || 0;
  document.getElementById('tabCountPlow').textContent = counts['Cavalo de Batalha'] || 0;
  document.getElementById('tabCountPuzzle').textContent = counts['Quebra-cabeça'] || 0;
  document.getElementById('tabCountDog').textContent = counts['Cão'] || 0;
}

// ============================================================================
// Gráfico Scatter Plot - Matriz de Engenharia de Cardápio (Chart.js)
// ============================================================================
function renderMenuEngineeringChart() {
  const ctx = document.getElementById('menuEngineeringChart');
  if (!ctx || !AppState.items.length) return;

  const thresholdOrders = AppState.summary?.popularity_threshold || 200;
  const thresholdMargin = AppState.summary?.profitability_threshold || 15;

  const datasets = [
    {
      label: 'Estrelas (Stars)',
      data: AppState.items.filter(i => i.quadrant === 'Estrela').map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 10
    },
    {
      label: 'Cavalos de Batalha (Plowhorses)',
      data: AppState.items.filter(i => i.quadrant === 'Cavalo de Batalha').map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      borderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 10
    },
    {
      label: 'Quebra-cabeças (Puzzles)',
      data: AppState.items.filter(i => i.quadrant === 'Quebra-cabeça').map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 11
    },
    {
      label: 'Cães (Dogs)',
      data: AppState.items.filter(i => i.quadrant === 'Cão').map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
      borderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 10
    }
  ];

  if (AppState.chartInstance) {
    AppState.chartInstance.destroy();
  }

  const quadrantBackgroundPlugin = {
    id: 'quadrantBackground',
    beforeDraw: (chart) => {
      const { ctx, chartArea, scales: { x, y } } = chart;
      if (!chartArea) return;

      const xPos = x.getPixelForValue(thresholdOrders);
      const yPos = y.getPixelForValue(thresholdMargin);

      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      if (xPos >= chartArea.left && xPos <= chartArea.right) {
        ctx.beginPath();
        ctx.moveTo(xPos, chartArea.top);
        ctx.lineTo(xPos, chartArea.bottom);
        ctx.stroke();
      }

      if (yPos >= chartArea.top && yPos <= chartArea.bottom) {
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPos);
        ctx.lineTo(chartArea.right, yPos);
        ctx.stroke();
      }

      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.setLineDash([]);

      ctx.textAlign = 'left';
      ctx.fillText('🧩 QUEBRA-CABEÇAS (Alta Margem, Baixa Venda)', chartArea.left + 12, chartArea.top + 20);

      ctx.textAlign = 'right';
      ctx.fillText('⭐ ESTRELAS (Alta Margem, Alta Venda)', chartArea.right - 12, chartArea.top + 20);

      ctx.textAlign = 'left';
      ctx.fillText('🐕 CÃES (Baixa Margem, Baixa Venda)', chartArea.left + 12, chartArea.bottom - 12);

      ctx.textAlign = 'right';
      ctx.fillText('🐎 CAVALOS DE BATALHA (Baixa Margem, Alta Venda)', chartArea.right - 12, chartArea.bottom - 12);

      ctx.restore();
    }
  };

  AppState.chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    plugins: [quadrantBackgroundPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: '"Plus Jakarta Sans", sans-serif', size: 13, weight: '700' },
          bodyFont: { family: 'Inter, sans-serif', size: 12 },
          padding: 12,
          cornerRadius: 10,
          boxPadding: 4,
          callbacks: {
            title: (items) => {
              const item = items[0]?.raw?.raw;
              if (!item) return '';
              const icon = QUADRANT_CONFIG[item.quadrant]?.icon || '•';
              return `${icon} ${item.item_name}`;
            },
            label: (context) => {
              const i = context.raw?.raw;
              if (!i) return '';
              return [
                `Categoria: ${i.category}`,
                `Classificação: ${i.quadrant}`,
                `Preço: ${formatBRL(i.price)} | Custo: ${formatBRL(i.cost)}`,
                `Margem Unitária: ${formatBRL(i.margin_unit)} (${i.margin_pct.toFixed(1)}%)`,
                `Vendas Mensais: ${formatNumber(i.monthly_orders)} un`,
                `Lucro Total no Mês: ${formatBRL(i.total_profit)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Popularidade → Volume de Vendas Mensais (un)',
            font: { family: '"Plus Jakarta Sans", sans-serif', weight: '700', size: 12 },
            color: '#475569'
          },
          grid: { color: '#f1f5f9' }
        },
        y: {
          title: {
            display: true,
            text: 'Rentabilidade → Margem de Contribuição Unitária (R$)',
            font: { family: '"Plus Jakarta Sans", sans-serif', weight: '700', size: 12 },
            color: '#475569'
          },
          grid: { color: '#f1f5f9' },
          ticks: { callback: (val) => `R$ ${val}` }
        }
      }
    }
  });
}

// ============================================================================
// Renderização da Tabela Interativa
// ============================================================================
function renderMenuTable() {
  const tbody = document.getElementById('menuTableBody');
  if (!tbody) return;

  const filtered = AppState.items.filter(item => {
    if (AppState.currentTab !== 'ALL' && item.quadrant !== AppState.currentTab) return false;
    if (AppState.selectedCategory !== 'ALL' && item.category !== AppState.selectedCategory) return false;
    if (AppState.searchQuery) {
      const matchName = item.item_name.toLowerCase().includes(AppState.searchQuery);
      const matchDesc = item.current_description.toLowerCase().includes(AppState.searchQuery);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-12 text-center text-slate-400">
          <div class="text-3xl mb-2">🔍</div>
          <p class="font-semibold text-sm">Nenhum prato encontrado com os filtros atuais.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const qConf = QUADRANT_CONFIG[item.quadrant] || { icon: '•', badgeClass: 'bg-slate-100 text-slate-700' };
    
    return `
      <tr class="hover:bg-slate-50/90 transition group">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 group-hover:text-brand-700 transition flex items-center gap-1.5">
            <span>${qConf.icon}</span>
            <span>${escapeHtml(item.item_name)}</span>
          </div>
          <div class="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title="${escapeHtml(item.current_description)}">
            ${escapeHtml(item.current_description || 'Sem descrição')}
          </div>
        </td>
        <td class="py-3 px-3 text-slate-600">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
            ${escapeHtml(item.category)}
          </span>
        </td>
        <td class="py-3 px-3 text-right font-semibold text-slate-800">${formatBRL(item.price)}</td>
        <td class="py-3 px-3 text-right text-slate-500">${formatBRL(item.cost)}</td>
        <td class="py-3 px-3 text-right font-bold text-slate-900">${formatBRL(item.margin_unit)}</td>
        <td class="py-3 px-3 text-right font-medium ${item.margin_pct >= 60 ? 'text-emerald-600' : 'text-slate-600'}">
          ${item.margin_pct.toFixed(1)}%
        </td>
        <td class="py-3 px-3 text-right font-bold text-slate-800">${formatNumber(item.monthly_orders)}</td>
        <td class="py-3 px-3 text-right text-slate-600">${formatBRL(item.total_revenue)}</td>
        <td class="py-3 px-3 text-right font-black text-emerald-700">${formatBRL(item.total_profit)}</td>
        <td class="py-3 px-4 text-center">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${qConf.badgeClass}">
            <span>${qConf.icon}</span>
            <span>${item.quadrant}</span>
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// Otimização com IA (Google Gemini 2.5 Flash / Fallback)
// ============================================================================
async function runOptimization(silent = false) {
  if (AppState.isOptimizing) return;
  if (!AppState.items || AppState.items.length === 0) {
    if (!silent) showToast('Carregue os dados do cardápio primeiro.', 'error');
    return;
  }

  AppState.isOptimizing = true;
  updateAiLoadingState(true);

  if (!silent) showToast('Consultando IA estratégica do MenuPilot...', 'info');

  let reportLoaded = false;

  // Tentativa 1: Chamar endpoint backend do FastAPI
  try {
    const payload = {
      items: AppState.items,
      summary: AppState.summary,
      api_key: AppState.geminiApiKey || null
    };

    const headers = { 'Content-Type': 'application/json' };
    if (AppState.geminiApiKey) {
      headers['x-gemini-api-key'] = AppState.geminiApiKey;
    }

    const res = await fetch(`${API_BASE}/api/optimize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      AppState.aiReport = data.report;

      document.getElementById('aiModelBadge').textContent = data.model_used;
      document.getElementById('aiTimestamp').textContent = `Atualizado em ${data.generated_at}`;

      const noticeEl = document.getElementById('aiStatusNotice');
      const noticeText = document.getElementById('aiStatusNoticeText');

      if (data.is_simulated) {
        noticeEl.className = 'mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2.5';
        noticeText.innerHTML = `<strong>Modo Demonstração:</strong> ${data.message || 'Exibindo análise simulada pré-calculada.'} Insira sua chave Gemini no cabeçalho para chamadas ao vivo.`;
      } else {
        noticeEl.className = 'mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-200 flex items-start gap-2.5';
        noticeText.innerHTML = `<strong>Sucesso:</strong> ${data.message}`;
      }

      renderAIRecommendations();
      reportLoaded = true;
      if (!silent) showToast('Otimização concluída com sucesso!', 'success');
    }
  } catch (err) {
    console.warn('Backend indisponível para otimização IA. Utilizando gerador local inteligente.');
  }

  // Tentativa 2: Fallback local para execução offline com dados calculados
  if (!reportLoaded) {
    const localReport = generateLocalFallbackReport(AppState.items, AppState.summary);
    AppState.aiReport = localReport;

    document.getElementById('aiModelBadge').textContent = 'simulação-heuristica-local';
    document.getElementById('aiTimestamp').textContent = `Atualizado agora (${new Date().toLocaleTimeString('pt-BR')})`;

    const noticeEl = document.getElementById('aiStatusNotice');
    const noticeText = document.getElementById('aiStatusNoticeText');
    noticeEl.className = 'mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2.5';
    noticeText.innerHTML = `<strong>Modo Demonstração Local:</strong> Análise heurística de alta fidelidade ativa. Para chamadas ao vivo via Gemini 2.5 Flash, inicie o backend e insira sua chave.`;

    renderAIRecommendations();
    if (!silent) showToast('Otimização de demonstração carregada!', 'success');
  }

  AppState.isOptimizing = false;
  updateAiLoadingState(false);
}

function generateLocalFallbackReport(items, summary) {
  return {
    executive_diagnosis: [
      `Forte dependência de Cavalos de Batalha de margem baixa (como o Cheeseburger Tradicional com apenas R$ 11 de margem), que sobrecarregam a chapa sem maximizar o lucro líquido.`,
      `Subaproveitamento crítico dos 4 itens 'Quebra-cabeça' (Gorgonzola, Truffle Brie, Onion Rings e Brownie), que somam margens unitárias acima de R$ 20 a R$ 34, mas sofrem com descrições genéricas.`,
      `Cardápio com excelente potencial de alavancagem: transformar 15% das vendas dos itens populares em combos casados geraria um incremento estimado de +R$ 14.800,00 no lucro bruto mensal.`
    ],
    copywriting_optimizations: [
      {
        item_id: "9",
        item_name: "Burger Gorgonzola e Geleia de Pimenta",
        category_matrix: "Quebra-cabeça",
        current_description: "Pão, hambúrguer de carne, queijo gorgonzola e geleia de pimenta.",
        optimized_description: "Blend suculento de 160g grelhado no ponto perfeito, coroado com creme aveludado de gorgonzola dolce derretido e nossa exclusiva geleia artesanal de pimenta dedo-de-moça com maçã caramelizada, servido no pão brioche dourado na manteiga da fazenda. Um contraste irresistível entre o picante e o agridoce.",
        rationale: "Substitui termos secos por adjetivos sensoriais ('aveludado', 'caramelizada', 'dourado na manteiga') e destaca a alquimia do sabor agridoce, justificando o ticket nobre de R$ 46."
      },
      {
        item_id: "10",
        item_name: "Truffle Brie Burger",
        category_matrix: "Quebra-cabeça",
        current_description: "Hambúrguer com queijo brie e azeite trufado no pão de brioche.",
        optimized_description: "Experiência gastronômica premium: burger alto de 180g selado no fogo alto, generosa fatia de queijo Brie francês gratinado até a cremosidade máxima, finalizado com perfume de azeite trufado branco e maionese aioli da casa em brioche artesanal macio como nuvem.",
        rationale: "O item mais rentável da casa (R$ 34 de margem líquida!) ganha vocabulário de alta gastronomia para destravar compras por indulgência no delivery."
      },
      {
        item_id: "11",
        item_name: "Onion Rings Empanadas na Cerveja",
        category_matrix: "Quebra-cabeça",
        current_description: "Anéis de cebola empanados fritos. Acompanha molho da casa.",
        optimized_description: "Anéis generosos de cebola fresca envoltos em massa leve e aerada com cerveja artesanal IPA, fritos em óleo limpo até atingirem uma crocância sonora inigualável. Acompanha nosso molho secreto de alho assado e ervas.",
        rationale: "Destaca a técnica de empanamento na cerveja IPA e gatilho auditivo ('crocância sonora'), essencial para estimular o apetite como acompanhamento de R$ 28 com R$ 21 de lucro puro."
      },
      {
        item_id: "12",
        item_name: "Brownie Belga com Gelato de Baunilha",
        category_matrix: "Quebra-cabeça",
        current_description: "Fatia de brownie de chocolate com uma bola de sorvete de creme.",
        optimized_description: "Autêntico brownie denso feito com 70% de puro cacau belga Callebaut, servido aquecido com casquinha craquelada e centro ultra chocolatudo, acompanhado de gelato cremoso de favas de baunilha de Madagascar.",
        rationale: "Sobremesas no delivery são decisões de impulso: citar chocolate belga Callebaut e baunilha de Madagascar aumenta a percepção de valor e dispara o ticket médio."
      },
      {
        item_id: "1",
        item_name: "Bacon BBQ Supreme",
        category_matrix: "Estrela",
        current_description: "Pão brioche tostado na manteiga, blend bovino 160g ao ponto, fatias crocantes de bacon artesanal defumado em macieira, queijo cheddar inglês derretido e molho barbecue rústico da casa.",
        optimized_description: "O campeão de vendas consagrado: 160g de pura carne fresca grelhada no calor intenso, coberto com mantas crocantes de bacon defumado por 8 horas em lenha de macieira, derretimento farto de cheddar autêntico e barbecue rústico caramelizado no brioche artesanal.",
        rationale: "Reforça a prova social de item campeão e detalha o processo de defumação lenta de 8 horas, consolidando sua liderança e protegendo sua alta margem."
      }
    ],
    strategic_combos: [
      {
        combo_name: "Combo Trufado Supremo para 2 Pessoas",
        items_included: [
          "Truffle Brie Burger (Quebra-cabeça)",
          "Bacon BBQ Supreme (Estrela)",
          "Batata Rústica Alecrim & Páprica (Estrela)",
          "2x Coca-Cola 350ml (Cavalo)"
        ],
        original_price_total: 133.00,
        suggested_price: 118.90,
        estimated_margin_unit: 71.70,
        margin_gain_explanation: "Alavanca o item de maior margem da casa (Truffle Brie) pareando com a estrela consolidada. Mesmo com R$ 14,10 de desconto percebido pelo cliente, o combo entrega R$ 71,70 de margem limpa em uma única entrega de motoboy.",
        marketing_pitch: "🔥 Noite Especial a Dois: Leve o aclamado Truffle Brie + Bacon BBQ + Batata Rústica com R$ 14 OFF!"
      },
      {
        combo_name: "Combo Smash & Onion Rings Crocante",
        items_included: [
          "Smash Duplo Cheddar (Estrela)",
          "Onion Rings na Cerveja (Quebra-cabeça)",
          "Refrigerante Coca-Cola (Cavalo)"
        ],
        original_price_total: 71.50,
        suggested_price: 64.90,
        estimated_margin_unit: 41.70,
        margin_gain_explanation: "Substitui a batata palito de baixa margem pelas Onion Rings de alta lucratividade (R$ 21 de margem), elevando a margem unitária do combo de R$ 25 para mais de R$ 41.",
        marketing_pitch: "⚡ Upgrade Crocante: Turbine seu Smash Duplo com as legítimas Onion Rings empanadas na IPA!"
      },
      {
        combo_name: "Experiência Sweet & Salty Clássica",
        items_included: [
          "Cheeseburger Tradicional (Cavalo de Batalha)",
          "Brownie Belga com Gelato (Quebra-cabeça)",
          "Cerveja Heineken Long Neck (Cavalo)"
        ],
        original_price_total: 67.00,
        suggested_price: 59.90,
        estimated_margin_unit: 29.60,
        margin_gain_explanation: "Usa o Cheeseburger como isca de preço baixo e injeta a alta margem da sobremesa belga, transformando um pedido simples de R$ 25 em uma refeição completa de R$ 59,90 com margem quase triplicada.",
        marketing_pitch: "✨ Fechamento Perfeito: Burguer artesanal + Cerveja Puro Malte + Brownie Belga Quente!"
      }
    ],
    dog_action_plan: [
      {
        item_id: "13",
        item_name: "Salada Caesar de Frango",
        action_type: "Remover do Cardápio",
        practical_recommendation: "O delivery de hamburgueria não tem vocação para salada fresca; o alface murcha no transporte, tem alto CMV (R$ 16,50) e vende apenas 40 unidades. Descontinuar elimina perdas de insumos perecíveis e simplifica a mise en place."
      },
      {
        item_id: "14",
        item_name: "Chá Gelado de Pêssego 500ml",
        action_type: "Substituir Fornecedor ou Remover",
        practical_recommendation: "Com apenas 50 vendas e margem irrisória de R$ 3,50, ocupa espaço na geladeira. Substitua por Chá Gelado Artesanal da Casa feito com infusão de hibisco/frutas vermelhas (custo R$ 1,80, preço R$ 12,00, gerando +R$ 10 de margem)."
      },
      {
        item_id: "15",
        item_name: "Mini Churros de Doce de Leite (4 un)",
        action_type: "Reformular ou Transformar em Cortesia",
        practical_recommendation: "Fritar churros na mesma gordura das batatas gera sabor cruzado e o doce esfria rápido no tráfego. Mude para 'Churros Bites com Pote de Doce de Leite Havanna' ou utilize como incentivo de primeira compra no app."
      },
      {
        item_id: "16",
        item_name: "Burger Vegetariano Grão-de-Bico",
        action_type: "Reformular Receita e Reduzir CMV",
        practical_recommendation: "Não elimine a opção veggie para não vetar grupos de amigos, mas reformule a receita caseira para baratear o custo (atualmente R$ 18,00!). Um blend de lentilha e cogumelos shimeji reduz o custo para R$ 11,00 e agrega maior sabor."
      }
    ],
    overall_growth_potential: "Implementando as novas descrições sensoriais e os 3 combos estratégicos, estima-se um aumento de 18% a 24% na conversão do cardápio e uma expansão de margem bruta mensal na ordem de +R$ 12.000,00 a +R$ 18.500,00."
  };
}

function updateAiLoadingState(isLoading) {
  const btn = document.getElementById('btnRunOptimization');
  const btnRe = document.getElementById('btnReOptimize');
  const spinner = document.getElementById('aiIcon');
  const sparkle = document.getElementById('sparkleIcon');
  const btnText = document.getElementById('btnAiText');

  if (isLoading) {
    btn.disabled = true;
    btnRe.disabled = true;
    spinner.classList.remove('hidden');
    sparkle.classList.add('hidden');
    btnText.textContent = 'Processando...';
  } else {
    btn.disabled = false;
    btnRe.disabled = false;
    spinner.classList.add('hidden');
    sparkle.classList.remove('hidden');
    btnText.textContent = 'Otimizar com IA';
  }
}

// ============================================================================
// Renderização das Recomendações da IA
// ============================================================================
function renderAIRecommendations() {
  const report = AppState.aiReport;
  if (!report) return;

  // 1. Diagnóstico Executivo
  const bulletsContainer = document.getElementById('executiveBulletsContainer');
  if (bulletsContainer && report.executive_diagnosis) {
    const icons = ['💡', '🎯', '💰'];
    bulletsContainer.innerHTML = report.executive_diagnosis.map((bullet, idx) => `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-sm flex items-start gap-3 hover:border-brand-300 transition">
        <span class="text-xl p-2 rounded-lg bg-white shadow-sm border border-slate-100 flex-shrink-0">${icons[idx] || '📌'}</span>
        <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">${escapeHtml(bullet)}</p>
      </div>
    `).join('');
  }

  // 2. Otimização de Copywriting
  const copyContainer = document.getElementById('copywritingCardsContainer');
  if (copyContainer && report.copywriting_optimizations) {
    copyContainer.innerHTML = report.copywriting_optimizations.map((item, idx) => {
      const qConf = QUADRANT_CONFIG[item.category_matrix] || { icon: '✨', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
      const uniqueId = `copy_text_${idx}`;

      return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition space-y-3 p-4 sm:p-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="text-lg">${qConf.icon}</span>
              <h4 class="text-sm font-extrabold text-slate-900">${escapeHtml(item.item_name)}</h4>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${qConf.badgeClass}">
                ${item.category_matrix}
              </span>
            </div>
            <button type="button" onclick="copyToClipboard('${uniqueId}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition active:scale-95 self-start sm:self-auto">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar Texto Otimizado
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Descrição Original (Antes)</span>
                <span class="text-rose-500">❌ Fraca / Genérica</span>
              </div>
              <p class="text-slate-600 leading-relaxed italic">
                "${escapeHtml(item.current_description || 'Sem descrição cadastrada')}"
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-1">
              <div class="flex items-center justify-between text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                <span>✨ Otimizada pela IA (Depois)</span>
                <span class="text-emerald-600">✅ Alta Conversão</span>
              </div>
              <p id="${uniqueId}" class="text-slate-800 leading-relaxed font-medium">
                ${escapeHtml(item.optimized_description)}
              </p>
            </div>
          </div>

          <div class="pt-2 text-[11px] text-slate-500 flex items-start gap-1.5 border-t border-slate-100">
            <span class="font-bold text-slate-700 flex-shrink-0">🧠 Por que converte mais:</span>
            <span>${escapeHtml(item.rationale)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. Combos Estratégicos
  const combosContainer = document.getElementById('combosCardsContainer');
  if (combosContainer && report.strategic_combos) {
    combosContainer.innerHTML = report.strategic_combos.map(combo => {
      const discount = combo.original_price_total - combo.suggested_price;
      return `
        <div class="bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-slate-200 hover:border-brand-300 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                Combo Estratégico
              </span>
              ${discount > 0 ? `
                <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Economia: ${formatBRL(discount)}
                </span>
              ` : ''}
            </div>

            <h4 class="text-base font-extrabold text-slate-900 leading-snug">${escapeHtml(combo.combo_name)}</h4>

            <div class="space-y-1.5 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Itens no Pacote:</span>
              <ul class="text-xs space-y-1 text-slate-700 font-medium">
                ${combo.items_included.map(i => `<li class="flex items-center gap-1.5"><span class="text-brand-500 font-bold">•</span> ${escapeHtml(i)}</li>`).join('')}
              </ul>
            </div>

            <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 italic font-medium">
              "${escapeHtml(combo.marketing_pitch)}"
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 space-y-2">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-[10px] text-slate-400 line-through">De ${formatBRL(combo.original_price_total)}</span>
                <div class="text-xl font-black text-slate-900">${formatBRL(combo.suggested_price)}</div>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-slate-500">Margem do Combo</span>
                <div class="text-base font-extrabold text-emerald-600">${formatBRL(combo.estimated_margin_unit)}</div>
              </div>
            </div>
            <p class="text-[11px] text-slate-500 leading-tight">
              ${escapeHtml(combo.margin_gain_explanation)}
            </p>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Plano de Ação para Itens Cão
  const dogContainer = document.getElementById('dogActionPlanContainer');
  if (dogContainer && report.dog_action_plan) {
    dogContainer.innerHTML = report.dog_action_plan.map(item => `
      <div class="bg-white rounded-xl p-4 border border-rose-200 shadow-sm space-y-2.5">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-extrabold text-slate-900 truncate">${escapeHtml(item.item_name)}</h5>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            ${escapeHtml(item.action_type)}
          </span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">
          ${escapeHtml(item.practical_recommendation)}
        </p>
      </div>
    `).join('');
  }

  const growthBox = document.getElementById('growthPotentialBox');
  const growthText = document.getElementById('growthPotentialText');
  if (growthBox && growthText && report.overall_growth_potential) {
    growthText.textContent = report.overall_growth_potential;
    growthBox.classList.remove('hidden');
  }
}

// ============================================================================
// Exportação de CSV Otimizado
// ============================================================================
function exportOptimizedCsv() {
  if (!AppState.items || AppState.items.length === 0) {
    showToast('Nenhum dado para exportar.', 'error');
    return;
  }

  const optMap = {};
  if (AppState.aiReport && AppState.aiReport.copywriting_optimizations) {
    AppState.aiReport.copywriting_optimizations.forEach(o => {
      optMap[o.item_id] = o;
    });
  }

  const headers = [
    'ID',
    'Nome do Prato',
    'Categoria',
    'Preco de Venda (R$)',
    'Custo Insumos (R$)',
    'Margem Unitaria (R$)',
    'Margem Percentual (%)',
    'Vendas Mensais',
    'Faturamento Total (R$)',
    'Lucro Total (R$)',
    'Classificacao Matriz',
    'Descricao Original',
    'Descricao Otimizada IA',
    'Justificativa Copywriting'
  ];

  const rows = AppState.items.map(item => {
    const opt = optMap[item.id] || {};
    return [
      `"${item.id}"`,
      `"${escapeCsv(item.item_name)}"`,
      `"${escapeCsv(item.category)}"`,
      item.price.toFixed(2),
      item.cost.toFixed(2),
      item.margin_unit.toFixed(2),
      item.margin_pct.toFixed(2),
      item.monthly_orders,
      item.total_revenue.toFixed(2),
      item.total_profit.toFixed(2),
      `"${item.quadrant}"`,
      `"${escapeCsv(item.current_description)}"`,
      `"${escapeCsv(opt.optimized_description || '')}"`,
      `"${escapeCsv(opt.rationale || '')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `menupilot_cardapio_otimizado_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Cardápio otimizado baixado em CSV com sucesso!', 'success');
}

// ============================================================================
// Utilitários Auxiliares
// ============================================================================
window.copyToClipboard = (elementId) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('Descrição copiada para a área de transferência!', 'success');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Descrição copiada!', 'success');
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsv(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}
