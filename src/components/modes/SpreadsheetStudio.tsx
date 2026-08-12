import React, { useState, useMemo } from 'react';
import {
  Table,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Plus,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileSpreadsheet,
  FileText,
  PieChart as PieIcon,
  LineChart as LineIcon,
  DollarSign,
  Percent,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckSquare,
  LayoutDashboard,
  Printer,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell as ReCell,
  AreaChart,
  Area,
} from 'recharts';
import { SpreadsheetCell, SpreadsheetData } from '../../types';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const INITIAL_ROWS = 20;

// Colors for Charts
const CHART_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#34d399', '#fbbf24'];

interface CustomChartWidget {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'area' | 'pie';
  categoryCol: string;
  valueCol: string;
  color: string;
}

// Sample Preset Templates
const PRESETS: { [name: string]: { name: string; desc: string; data: SpreadsheetData } } = {
  games: {
    name: 'Métricas de Jogo & Receita AAA',
    desc: 'Desempenho de vendas, jogadores ativos e compras no aplicativo',
    data: {
      A1: { raw: 'Mês', bold: true, bg: '#1e293b', color: '#38bdf8', align: 'left' },
      B1: { raw: 'Vendas (R$)', bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' },
      C1: { raw: 'Jogadores Ativos', bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' },
      D1: { raw: 'Taxa Conversão', bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' },
      A2: { raw: 'Janeiro' }, B2: { raw: '45000', format: 'currency' }, C2: { raw: '12500', format: 'number' }, D2: { raw: '4.2', format: 'percent' },
      A3: { raw: 'Fevereiro' }, B3: { raw: '52000', format: 'currency' }, C3: { raw: '14800', format: 'number' }, D3: { raw: '4.8', format: 'percent' },
      A4: { raw: 'Março' }, B4: { raw: '68000', format: 'currency' }, C4: { raw: '18900', format: 'number' }, D4: { raw: '5.5', format: 'percent' },
      A5: { raw: 'Abril' }, B5: { raw: '74000', format: 'currency' }, C5: { raw: '21000', format: 'number' }, D5: { raw: '6.1', format: 'percent' },
      A6: { raw: 'Maio' }, B6: { raw: '89000', format: 'currency' }, C6: { raw: '26500', format: 'number' }, D6: { raw: '6.8', format: 'percent' },
      A7: { raw: 'Junho' }, B7: { raw: '105000', format: 'currency' }, C7: { raw: '32000', format: 'number' }, D7: { raw: '7.4', format: 'percent' },
      A8: { raw: 'TOTAL', bold: true, bg: '#0f172a', color: '#4ade80' },
      B8: { raw: '=SUM(B2:B7)', bold: true, bg: '#0f172a', color: '#4ade80', format: 'currency' },
      C8: { raw: '=SUM(C2:C7)', bold: true, bg: '#0f172a', color: '#38bdf8', format: 'number' },
      D8: { raw: '=AVERAGE(D2:D7)', bold: true, bg: '#0f172a', color: '#c084fc', format: 'percent' },
    },
  },
  project: {
    name: 'Orçamento Visual MNAnimat Studio',
    desc: 'Planejamento de custos para produção 3D, Animação e Áudio',
    data: {
      A1: { raw: 'Categoria', bold: true, bg: '#1e293b', color: '#818cf8' },
      B1: { raw: 'Orçado (R$)', bold: true, bg: '#1e293b', color: '#818cf8', align: 'right' },
      C1: { raw: 'Executado (R$)', bold: true, bg: '#1e293b', color: '#818cf8', align: 'right' },
      D1: { raw: 'Diferença (R$)', bold: true, bg: '#1e293b', color: '#818cf8', align: 'right' },
      A2: { raw: 'Modelagem 3D' }, B2: { raw: '15000', format: 'currency' }, C2: { raw: '13500', format: 'currency' }, D2: { raw: '=B2-C2', format: 'currency' },
      A3: { raw: 'Animação Keyframe' }, B3: { raw: '22000', format: 'currency' }, C3: { raw: '21000', format: 'currency' }, D3: { raw: '=B3-C3', format: 'currency' },
      A4: { raw: 'Texturização & PBR' }, B4: { raw: '12000', format: 'currency' }, C4: { raw: '12800', format: 'currency' }, D4: { raw: '=B4-C4', format: 'currency' },
      A5: { raw: 'Trilha & Efeitos' }, B5: { raw: '8000', format: 'currency' }, C5: { raw: '7500', format: 'currency' }, D5: { raw: '=B5-C5', format: 'currency' },
      A6: { raw: 'VFX & Pós-Produção' }, B6: { raw: '18000', format: 'currency' }, C6: { raw: '17200', format: 'currency' }, D6: { raw: '=B6-C6', format: 'currency' },
      A7: { raw: 'TOTAL GERAL', bold: true, bg: '#0f172a', color: '#38bdf8' },
      B7: { raw: '=SUM(B2:B6)', bold: true, bg: '#0f172a', color: '#38bdf8', format: 'currency' },
      C7: { raw: '=SUM(C2:C6)', bold: true, bg: '#0f172a', color: '#38bdf8', format: 'currency' },
      D7: { raw: '=SUM(D2:D6)', bold: true, bg: '#0f172a', color: '#4ade80', format: 'currency' },
    },
  },
};

export const SpreadsheetStudio: React.FC = () => {
  const [data, setData] = useState<SpreadsheetData>(PRESETS.games.data);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [editingValue, setEditingValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'grid' | 'dashboard'>('grid');
  const [rowCount, setRowCount] = useState<number>(INITIAL_ROWS);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [categoryCol, setCategoryCol] = useState<string>('A');
  const [valueCol, setValueCol] = useState<string>('B');

  // Multi-Widget Dashboard State
  const [widgets, setWidgets] = useState<CustomChartWidget[]>([
    { id: 'w1', title: 'Vendas & Receita (Coluna A vs B)', type: 'bar', categoryCol: 'A', valueCol: 'B', color: '#38bdf8' },
    { id: 'w2', title: 'Evolução de Jogadores (Coluna A vs C)', type: 'line', categoryCol: 'A', valueCol: 'C', color: '#818cf8' },
    { id: 'w3', title: 'Distribuição Percentual', type: 'pie', categoryCol: 'A', valueCol: 'B', color: '#c084fc' },
  ]);

  // Modal State for adding custom chart
  const [isAddChartModalOpen, setIsAddChartModalOpen] = useState(false);
  const [newChartTitle, setNewChartTitle] = useState('Novo Gráfico Personalizado');
  const [newChartType, setNewChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [newChartCatCol, setNewChartCatCol] = useState('A');
  const [newChartValCol, setNewChartValCol] = useState('B');
  const [newChartColor, setNewChartColor] = useState('#38bdf8');
  const [copied, setCopied] = useState(false);

  // Helper to get raw cell value
  const getRawValue = (cellId: string): string => {
    return data[cellId]?.raw || '';
  };

  // Safe evaluate cell value including formulas
  const evaluateCell = (cellId: string, visited = new Set<string>()): string | number => {
    if (visited.has(cellId)) return '#CIRCULAR!';
    visited.add(cellId);

    const raw = getRawValue(cellId).trim();
    if (!raw) return '';

    if (raw.startsWith('=')) {
      const formula = raw.substring(1).toUpperCase();

      // Range functions: SUM, AVERAGE, MIN, MAX, COUNT
      const rangeMatch = formula.match(/^(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-J]\d+):([A-J]\d+)\)$/);
      if (rangeMatch) {
        const [, func, startCell, endCell] = rangeMatch;
        const startCol = startCell[0];
        const startRow = parseInt(startCell.substring(1), 10);
        const endCol = endCell[0];
        const endRow = parseInt(endCell.substring(1), 10);

        const colStartIndex = COLS.indexOf(startCol);
        const colEndIndex = COLS.indexOf(endCol);

        const values: number[] = [];

        for (let c = Math.min(colStartIndex, colEndIndex); c <= Math.max(colStartIndex, colEndIndex); c++) {
          for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
            const targetId = `${COLS[c]}${r}`;
            const val = evaluateCell(targetId, new Set(visited));
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            if (!isNaN(num)) {
              values.push(num);
            }
          }
        }

        if (values.length === 0) return 0;
        if (func === 'SUM') return values.reduce((a, b) => a + b, 0);
        if (func === 'AVERAGE') return values.reduce((a, b) => a + b, 0) / values.length;
        if (func === 'MIN') return Math.min(...values);
        if (func === 'MAX') return Math.max(...values);
        if (func === 'COUNT') return values.length;
      }

      // Simple subtraction / addition e.g. =B2-C2 or =A1+B1
      const binaryMatch = formula.match(/^([A-J]\d+)\s*([\+\-\*\/])\s*([A-J]\d+)$/);
      if (binaryMatch) {
        const [, cell1, op, cell2] = binaryMatch;
        const v1 = parseFloat(String(evaluateCell(cell1, new Set(visited))));
        const v2 = parseFloat(String(evaluateCell(cell2, new Set(visited))));
        if (isNaN(v1) || isNaN(v2)) return '#VALOR!';
        if (op === '+') return v1 + v2;
        if (op === '-') return v1 - v2;
        if (op === '*') return v1 * v2;
        if (op === '/') return v2 !== 0 ? v1 / v2 : '#DIV/0!';
      }

      return '#ERRO!';
    }

    const num = Number(raw);
    return isNaN(num) ? raw : num;
  };

  // Format value for display
  const formatCellDisplay = (cellId: string): string => {
    const cell = data[cellId];
    const val = evaluateCell(cellId);

    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'string' && val.startsWith('#')) return val;

    if (cell?.format === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    if (cell?.format === 'percent' && typeof val === 'number') {
      return `${val.toFixed(1)}%`;
    }
    if (cell?.format === 'number' && typeof val === 'number') {
      return val.toLocaleString('pt-BR');
    }

    return String(val);
  };

  // Handle Cell Value Change
  const updateCellValue = (cellId: string, val: string) => {
    setData((prev) => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        raw: val,
      },
    }));
  };

  // Formatting toggles
  const toggleCellFormat = (key: keyof SpreadsheetCell, val: any) => {
    if (!selectedCell) return;
    setData((prev) => ({
      ...prev,
      [selectedCell]: {
        ...prev[selectedCell],
        [key]: prev[selectedCell]?.[key] === val ? undefined : val,
      },
    }));
  };

  // Generic Helper to calculate chart data for any column pair
  const getWidgetData = (catCol: string, valCol: string) => {
    const chartRows: Array<{ name: string; value: number }> = [];
    for (let r = 2; r <= rowCount; r++) {
      const catId = `${catCol}${r}`;
      const valId = `${valCol}${r}`;

      const catVal = String(evaluateCell(catId) || '').trim();
      const numVal = evaluateCell(valId);

      if (catVal && typeof numVal === 'number' && !isNaN(numVal)) {
        chartRows.push({
          name: catVal,
          value: numVal,
        });
      }
    }
    return chartRows;
  };

  const handleAddWidget = () => {
    const newWidget: CustomChartWidget = {
      id: `w_${Date.now()}`,
      title: newChartTitle.trim() || 'Gráfico Personalizado',
      type: newChartType,
      categoryCol: newChartCatCol,
      valueCol: newChartValCol,
      color: newChartColor,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setIsAddChartModalOpen(false);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAutoGenerateDashboard = () => {
    const autoWidgets: CustomChartWidget[] = [
      { id: `w_auto_1`, title: 'Visão Geral (Coluna A vs B)', type: 'bar', categoryCol: 'A', valueCol: 'B', color: '#38bdf8' },
      { id: `w_auto_2`, title: 'Curva de Tendência (Coluna A vs C)', type: 'line', categoryCol: 'A', valueCol: 'C', color: '#818cf8' },
      { id: `w_auto_3`, title: 'Análise de Volume (Coluna A vs D)', type: 'area', categoryCol: 'A', valueCol: 'D', color: '#34d399' },
      { id: `w_auto_4`, title: 'Proporção Relativa', type: 'pie', categoryCol: 'A', valueCol: 'B', color: '#c084fc' },
    ];
    setWidgets(autoWidgets);
  };

  // Computed Dashboard Data
  const dashboardChartData = useMemo(() => {
    return getWidgetData(categoryCol, valueCol);
  }, [data, categoryCol, valueCol, rowCount]);

  // Key KPI metrics
  const kpis = useMemo(() => {
    let sum = 0;
    let count = 0;
    let max = -Infinity;
    let min = Infinity;

    for (let r = 2; r <= rowCount; r++) {
      const valId = `${valueCol}${r}`;
      const val = evaluateCell(valId);
      if (typeof val === 'number' && !isNaN(val)) {
        sum += val;
        count++;
        if (val > max) max = val;
        if (val < min) min = val;
      }
    }

    return {
      total: sum,
      avg: count > 0 ? sum / count : 0,
      count,
      max: max === -Infinity ? 0 : max,
      min: min === Infinity ? 0 : min,
    };
  }, [data, valueCol, rowCount]);

  // Export CSV
  const exportCSV = () => {
    let csv = '';
    for (let r = 1; r <= 15; r++) {
      const rowVals: string[] = [];
      for (const col of COLS) {
        const val = formatCellDisplay(`${col}${r}`);
        rowVals.push(`"${val.replace(/"/g, '""')}"`);
      }
      csv += rowVals.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MNAnimat_Spreadsheet_${Date.now()}.csv`;
    a.click();
  };

  // Export JSON
  const exportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MNAnimat_Data_${Date.now()}.json`;
    a.click();
  };

  // Import CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const lines = content.split('\n');
      const newData: SpreadsheetData = {};

      lines.slice(0, 25).forEach((line, rIdx) => {
        const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        cells.slice(0, 10).forEach((cVal, cIdx) => {
          const colName = COLS[cIdx];
          const cellId = `${colName}${rIdx + 1}`;
          const cleanVal = cVal.trim().replace(/^"|"$/g, '');
          newData[cellId] = {
            raw: cleanVal,
            bold: rIdx === 0,
            bg: rIdx === 0 ? '#1e293b' : undefined,
            color: rIdx === 0 ? '#38bdf8' : undefined,
          };
        });
      });

      setData(newData);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Planilhas & Dashboards Analíticos
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                Formula Engine v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Crie tabelas dinâmicas, fórmulas analíticas e gráficos interativos com Recharts
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              Grid da Planilha
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-300" />
              Dashboard Visual & KPIs
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Importar CSV
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'grid' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Formatting & Preset Toolbar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Modelos:</span>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setData(p.data)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Formula Bar & Cell Formatting */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold">
                {selectedCell}
              </span>
              <input
                type="text"
                placeholder="Valor ou Fórmula (ex: =SUM(B2:B7))"
                value={getRawValue(selectedCell)}
                onChange={(e) => updateCellValue(selectedCell, e.target.value)}
                className="w-64 md:w-80 px-3 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />

              <div className="h-4 w-px bg-slate-800 my-auto" />

              {/* Formatting buttons */}
              <button
                onClick={() => toggleCellFormat('bold', true)}
                className={`p-1.5 rounded hover:bg-slate-800 ${data[selectedCell]?.bold ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                title="Negrito"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleCellFormat('italic', true)}
                className={`p-1.5 rounded hover:bg-slate-800 ${data[selectedCell]?.italic ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                title="Itálico"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-800 my-auto" />

              <button
                onClick={() => toggleCellFormat('format', 'currency')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-slate-800 ${data[selectedCell]?.format === 'currency' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-950 text-slate-400'}`}
              >
                <DollarSign className="w-3 h-3 text-emerald-400" />
                R$ Moeda
              </button>
              <button
                onClick={() => toggleCellFormat('format', 'percent')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-slate-800 ${data[selectedCell]?.format === 'percent' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-950 text-slate-400'}`}
              >
                <Percent className="w-3 h-3 text-purple-400" />
                % Porcento
              </button>

              <button
                onClick={() => setRowCount((r) => r + 5)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
                + 5 Linhas
              </button>
            </div>
          </div>

          {/* Grid Table */}
          <div className="flex-1 overflow-auto bg-slate-950 p-2 select-none">
            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr>
                  <th className="w-12 bg-slate-900 border border-slate-800 text-slate-500 font-mono py-1.5 text-center">
                    #
                  </th>
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className="bg-slate-900 border border-slate-800 text-slate-300 font-bold py-1.5 text-center w-36"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }).map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  return (
                    <tr key={rowNum} className="hover:bg-slate-900/40">
                      <td className="bg-slate-900/80 border border-slate-800 text-slate-500 font-mono text-center font-medium">
                        {rowNum}
                      </td>
                      {COLS.map((col) => {
                        const cellId = `${col}${rowNum}`;
                        const cellData = data[cellId];
                        const displayVal = formatCellDisplay(cellId);
                        const isSelected = selectedCell === cellId;

                        return (
                          <td
                            key={cellId}
                            onClick={() => setSelectedCell(cellId)}
                            style={{
                              backgroundColor: cellData?.bg || undefined,
                              color: cellData?.color || undefined,
                            }}
                            className={`border border-slate-800/80 px-2 py-1.5 transition-all relative font-mono text-xs ${
                              cellData?.bold ? 'font-bold' : ''
                            } ${cellData?.italic ? 'italic' : ''} ${
                              cellData?.align === 'right'
                                ? 'text-right'
                                : cellData?.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            } ${
                              isSelected
                                ? 'outline-2 outline-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-400 z-10'
                                : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={getRawValue(cellId)}
                              onChange={(e) => updateCellValue(cellId, e.target.value)}
                              className="w-full bg-transparent border-none focus:outline-none font-sans text-inherit"
                            />
                            {cellData?.raw?.startsWith('=') && (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dashboard & Charts Tab */
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 space-y-6 relative">
          {/* Controls Bar for Dashboard */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Gerador de Gráficos & Dashboards Interativos</h3>
                <p className="text-xs text-slate-400">Sincronização em tempo real com as células da sua planilha</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => setIsAddChartModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar Gráfico
              </button>

              <button
                onClick={handleAutoGenerateDashboard}
                className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 rounded-xl font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Gerar Dashboard Inteligente
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Quick Axis Controls for Quick Preview */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Ajuste Rápido do Gráfico Destaque:
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Eixo X (Rotulos):</span>
                <select
                  value={categoryCol}
                  onChange={(e) => setCategoryCol(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-cyan-300 rounded-lg px-2 py-0.5 focus:outline-none"
                >
                  {COLS.map((c) => (
                    <option key={c} value={c}>Coluna {c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Eixo Y (Valores):</span>
                <select
                  value={valueCol}
                  onChange={(e) => setValueCol(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-2 py-0.5 focus:outline-none"
                >
                  {COLS.map((c) => (
                    <option key={c} value={c}>Coluna {c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Acumulado</p>
              <h4 className="text-2xl font-extrabold text-white mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.total)}
              </h4>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Sincronizado com Coluna {valueCol}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Média por Registro</p>
              <h4 className="text-2xl font-extrabold text-cyan-400 mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.avg)}
              </h4>
              <p className="text-xs text-slate-400 mt-2">Calculado em {kpis.count} registros ativos</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pico Máximo</p>
              <h4 className="text-2xl font-extrabold text-purple-300 mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.max)}
              </h4>
              <p className="text-xs text-purple-400 mt-2">Maior resultado registrado</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Registros</p>
              <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{kpis.count} itens</h4>
              <p className="text-xs text-slate-400 mt-2">Sincronização instantânea</p>
            </div>
          </div>

          {/* Dynamic Multi-Chart Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgets.map((w) => {
              const widgetData = getWidgetData(w.categoryCol, w.valueCol);
              return (
                <div key={w.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col min-h-[340px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      {w.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {w.categoryCol} vs {w.valueCol}
                      </span>
                      <button
                        onClick={() => handleDeleteWidget(w.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover Gráfico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {w.type === 'bar' ? (
                        <BarChart data={widgetData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Bar dataKey="value" fill={w.color} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : w.type === 'line' ? (
                        <LineChart data={widgetData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Line type="monotone" dataKey="value" stroke={w.color} strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      ) : w.type === 'area' ? (
                        <AreaChart data={widgetData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="value" stroke={w.color} fill={w.color} fillOpacity={0.25} />
                        </AreaChart>
                      ) : (
                        <PieChart>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Pie
                            data={widgetData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={45}
                            paddingAngle={3}
                          >
                            {widgetData.map((_, index) => (
                              <ReCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal to Add Custom Chart */}
          {isAddChartModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    Criar Novo Gráfico
                  </h3>
                  <button
                    onClick={() => setIsAddChartModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Título do Gráfico:</label>
                    <input
                      type="text"
                      value={newChartTitle}
                      onChange={(e) => setNewChartTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Tipo de Visualização:</label>
                    <select
                      value={newChartType}
                      onChange={(e) => setNewChartType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="bar">Gráfico de Barras</option>
                      <option value="line">Gráfico de Linhas</option>
                      <option value="area">Gráfico de Área</option>
                      <option value="pie">Gráfico de Pizza (Donut)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Coluna X (Categorias):</label>
                      <select
                        value={newChartCatCol}
                        onChange={(e) => setNewChartCatCol(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 focus:outline-none"
                      >
                        {COLS.map((c) => (
                          <option key={c} value={c}>Coluna {c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Coluna Y (Valores):</label>
                      <select
                        value={newChartValCol}
                        onChange={(e) => setNewChartValCol(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-indigo-300 focus:outline-none"
                      >
                        {COLS.map((c) => (
                          <option key={c} value={c}>Coluna {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Cor Principal:</label>
                    <div className="flex items-center gap-2">
                      {CHART_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewChartColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-7 h-7 rounded-full transition-transform ${newChartColor === col ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsAddChartModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddWidget}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    Adicionar ao Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
