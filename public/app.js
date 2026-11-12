/**
 * MenuPilot AI - Frontend Application
 * Gerenciamento de estado, renderização de gráficos Chart.js, chamadas à API e interatividade.
 */

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

// Mapeamento de Quadrantes (Cores, Nomes e Ícones)
const QUADRANT_CONFIG = {
  'Estrela': {
    name: 'Estrela',
    code: 'star',
    icon: '⭐',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#10B981',
    lightBg: '#ecfdf5',
    desc: 'Alta Venda + Alta Margem'
  },
  'Cavalo de Batalha': {
    name: 'Cavalo de Batalha',
    code: 'plowhorse',
    icon: '🐎',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: '#3B82F6',
    lightBg: '#eff6ff',
    desc: 'Alta Venda + Baixa Margem'
  },
  'Quebra-cabeça': {
    name: 'Quebra-cabeça',
    code: 'puzzle',
    icon: '🧩',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    color: '#F59E0B',
    lightBg: '#fffbeb',
    desc: 'Baixa Venda + Alta Margem'
  },
  'Cão': {
    name: 'Cão',
    code: 'dog',
    icon: '🐕',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    color: '#EF4444',
    lightBg: '#fff1f2',
    desc: 'Baixa Venda + Baixa Margem'
  }
};

// ============================================================================
// Utilitários de Formatação
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
  
  // Animação de entrada
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remoção
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

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
  // Botão Carregar Exemplo
  document.getElementById('btnLoadSample').addEventListener('click', async () => {
    await loadSampleData();
    showToast('Cardápio exemplo (Hamburgueria) carregado!', 'success');
  });

  // Upload CSV
  document.getElementById('csvFileInput').addEventListener('change', handleCsvUpload);

  // Botões de Otimização IA
  document.getElementById('btnRunOptimization').addEventListener('click', () => runOptimization(false));
  document.getElementById('btnReOptimize').addEventListener('click', () => runOptimization(false));

  // Exportar CSV
  document.getElementById('btnExportCsv').addEventListener('click', exportOptimizedCsv);

  // Busca e Filtros da Tabela
  document.getElementById('searchInput').addEventListener('input', (e) => {
    AppState.searchQuery = e.target.value.toLowerCase();
    renderMenuTable();
  });

  document.getElementById('categorySelect').addEventListener('change', (e) => {
    AppState.selectedCategory = e.target.value;
    renderMenuTable();
  });

  // Tabs da Tabela
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

  // Cards de filtro de quadrante na seção BCG
  document.querySelectorAll('.quadrant-filter-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetQuadrant = card.getAttribute('data-filter');
      // Altera a tab da tabela correspondente
      const targetTab = document.querySelector(`.table-tab[data-tab="${targetQuadrant}"]`);
      if (targetTab) {
        targetTab.click();
        targetTab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Modal de API Key
  const modal = document.getElementById('apiKeyModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  
  if (AppState.geminiApiKey) {
    apiKeyInput.value = AppState.geminiApiKey;
  }

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
// Verificação de Integridade e Status da API
// ============================================================================
async function checkHealthAndConfig() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      AppState.hasEnvKey = data.has_gemini_key_in_env;
      updateApiKeyStatusIndicator();
    }
  } catch (err) {
    console.warn('Backend local ainda não respondeu ao health check:', err);
  }
}

function updateApiKeyStatusIndicator() {
  const dot = document.getElementById('apiKeyStatusDot');
  if (AppState.geminiApiKey) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    dot.title = 'Chave ativa inserida na sessão';
  } else if (AppState.hasEnvKey) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    dot.title = 'Chave configurada via arquivo .env';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400';
    dot.title = 'Modo Demonstração (Sem chave configurada)';
  }
}

// ============================================================================
// Carga de Dados (Exemplo e Upload CSV)
// ============================================================================
async function loadSampleData() {
  const badge = document.getElementById('dataStatusBadge');
  if (badge) badge.textContent = 'Carregando exemplo...';

  try {
    const res = await fetch('/api/sample-data');
    if (!res.ok) throw new Error('Falha ao obter dados do exemplo');
    const data = await res.json();
    
    AppState.items = data.items;
    AppState.summary = data.summary;
    
    renderKPIs();
    renderBCGSummary();
    renderMenuEngineeringChart();
    renderMenuTable();
    
    if (badge) badge.textContent = '16 itens • Hamburgueria Artesanal';
    
    // Roda a otimização com IA por padrão para inicializar o painel
    await runOptimization(true);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    if (badge) badge.textContent = 'Erro ao carregar dados';
    showToast('Erro ao carregar dados do servidor.', 'error');
  }
}

async function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  showToast(`Enviando ${file.name}...`, 'info');

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Erro ao processar CSV');
    }

    const data = await res.json();
    AppState.items = data.items;
    AppState.summary = data.summary;

    renderKPIs();
    renderBCGSummary();
    renderMenuEngineeringChart();
    renderMenuTable();

    document.getElementById('dataStatusBadge').textContent = `${data.items.length} itens carregados do arquivo`;
    showToast(`Cardápio processado: ${data.items.length} itens identificados!`, 'success');

    // Executa a otimização com o novo arquivo
    await runOptimization(false);
  } catch (err) {
    console.error('Erro no upload de CSV:', err);
    showToast(err.message, 'error');
  } finally {
    e.target.value = '';
  }
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

  // Linhas de corte
  document.getElementById('lblThresholdOrders').textContent = formatNumber(s.popularity_threshold);
  document.getElementById('lblThresholdMargin').textContent = formatBRL(s.profitability_threshold);
}

// ============================================================================
// Resumo dos Quadrantes (Contadores)
// ============================================================================
function renderBCGSummary() {
  const counts = AppState.summary?.quadrant_counts || {};
  document.getElementById('countStars').textContent = counts['Estrela'] || 0;
  document.getElementById('countPlowhorses').textContent = counts['Cavalo de Batalha'] || 0;
  document.getElementById('countPuzzles').textContent = counts['Quebra-cabeça'] || 0;
  document.getElementById('countDogs').textContent = counts['Cão'] || 0;

  // Atualiza também contadores das tabs da tabela
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

  // Agrupa os itens em 4 datasets por quadrante para cores e legendas perfeitas
  const datasets = [
    {
      label: 'Estrelas (Stars)',
      data: AppState.items
        .filter(i => i.quadrant === 'Estrela')
        .map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 10
    },
    {
      label: 'Cavalos de Batalha (Plowhorses)',
      data: AppState.items
        .filter(i => i.quadrant === 'Cavalo de Batalha')
        .map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      borderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 10
    },
    {
      label: 'Quebra-cabeças (Puzzles)',
      data: AppState.items
        .filter(i => i.quadrant === 'Quebra-cabeça')
        .map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 11
    },
    {
      label: 'Cães (Dogs)',
      data: AppState.items
        .filter(i => i.quadrant === 'Cão')
        .map(i => ({ x: i.monthly_orders, y: i.margin_unit, raw: i })),
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

  // Plugin customizado para desenhar as linhas de corte e os rótulos de fundo dos 4 quadrantes
  const quadrantBackgroundPlugin = {
    id: 'quadrantBackground',
    beforeDraw: (chart) => {
      const { ctx, chartArea, scales: { x, y } } = chart;
      if (!chartArea) return;

      const xPos = x.getPixelForValue(thresholdOrders);
      const yPos = y.getPixelForValue(thresholdMargin);

      ctx.save();

      // Linhas de corte pontilhadas
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Linha Vertical (Corte de Vendas)
      if (xPos >= chartArea.left && xPos <= chartArea.right) {
        ctx.beginPath();
        ctx.moveTo(xPos, chartArea.top);
        ctx.lineTo(xPos, chartArea.bottom);
        ctx.stroke();
      }

      // Linha Horizontal (Corte de Margem)
      if (yPos >= chartArea.top && yPos <= chartArea.bottom) {
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPos);
        ctx.lineTo(chartArea.right, yPos);
        ctx.stroke();
      }

      // Rótulos d'água dos 4 Quadrantes
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.setLineDash([]);

      // Superior Esquerdo: Quebra-cabeças
      ctx.textAlign = 'left';
      ctx.fillText('🧩 QUEBRA-CABEÇAS (Alta Margem, Baixa Venda)', chartArea.left + 12, chartArea.top + 20);

      // Superior Direito: Estrelas
      ctx.textAlign = 'right';
      ctx.fillText('⭐ ESTRELAS (Alta Margem, Alta Venda)', chartArea.right - 12, chartArea.top + 20);

      // Inferior Esquerdo: Cães
      ctx.textAlign = 'left';
      ctx.fillText('🐕 CÃES (Baixa Margem, Baixa Venda)', chartArea.left + 12, chartArea.bottom - 12);

      // Inferior Direito: Cavalos de Batalha
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
        legend: {
          display: false // Usamos a legenda customizada abaixo do gráfico
        },
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
          ticks: {
            callback: (value) => `R$ ${value}`
          }
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
    // Filtro por Tab
    if (AppState.currentTab !== 'ALL' && item.quadrant !== AppState.currentTab) {
      return false;
    }
    // Filtro por Categoria
    if (AppState.selectedCategory !== 'ALL' && item.category !== AppState.selectedCategory) {
      return false;
    }
    // Filtro por Busca
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
// Execução da Otimização com IA (Google Gemini 2.5 Flash)
// ============================================================================
async function runOptimization(silent = false) {
  if (AppState.isOptimizing) return;
  if (!AppState.items || AppState.items.length === 0) {
    if (!silent) showToast('Carregue os dados do cardápio primeiro.', 'error');
    return;
  }

  AppState.isOptimizing = true;
  updateAiLoadingState(true);

  if (!silent) showToast('Enviando dados estruturados para o Google Gemini...', 'info');

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

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Falha ao executar otimização por IA');
    }

    const data = await res.json();
    AppState.aiReport = data.report;

    // Atualiza cabeçalho do painel IA
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
    if (!silent) showToast('Otimização concluída com sucesso!', 'success');
  } catch (err) {
    console.error('Erro na otimização com IA:', err);
    if (!silent) showToast(err.message, 'error');
  } finally {
    AppState.isOptimizing = false;
    updateAiLoadingState(false);
  }
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

  // 1. Diagnóstico Executivo (3 Bullets)
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

  // 2. Otimização de Copywriting (Antes vs. Depois)
  const copyContainer = document.getElementById('copywritingCardsContainer');
  if (copyContainer && report.copywriting_optimizations) {
    copyContainer.innerHTML = report.copywriting_optimizations.map((item, idx) => {
      const qConf = QUADRANT_CONFIG[item.category_matrix] || { icon: '✨', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
      const uniqueId = `copy_text_${idx}`;

      return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition space-y-3 p-4 sm:p-5">
          <!-- Cabeçalho do Card -->
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

          <!-- Comparativo Antes vs Depois -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <!-- ANTES -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Descrição Original (Antes)</span>
                <span class="text-rose-500">❌ Fraca / Genérica</span>
              </div>
              <p class="text-slate-600 leading-relaxed italic">
                "${escapeHtml(item.current_description || 'Sem descrição cadastrada')}"
              </p>
            </div>

            <!-- DEPOIS -->
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

          <!-- Rationale / Justificativa Estratégica -->
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

            <!-- Itens Inclusos -->
            <div class="space-y-1.5 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Itens no Pacote:</span>
              <ul class="text-xs space-y-1 text-slate-700 font-medium">
                ${combo.items_included.map(i => `<li class="flex items-center gap-1.5"><span class="text-brand-500 font-bold">•</span> ${escapeHtml(i)}</li>`).join('')}
              </ul>
            </div>

            <!-- Pitch de Marketing iFood -->
            <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 italic font-medium">
              "${escapeHtml(combo.marketing_pitch)}"
            </div>
          </div>

          <!-- Bloco de Preço e Margem -->
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

  // Potencial Geral de Crescimento
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

  // Mapeia otimizações geradas pela IA para cruzar com os dados
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
    // Fallback
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

