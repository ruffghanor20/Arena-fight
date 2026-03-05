import React, { useMemo, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Camera, Download, FileSpreadsheet, Mail, Package, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import saveAs from 'file-saver';

const TEMPLATE_COLUMNS = [
  'Material',
  'Descrição de material',
  'Centro',
  'Depósito',
  'GrpMercads.',
  'curva',
  'Estoque',
  'Custo unitario',
  'status',
  'Data 1° contagem',
  'Checagem',
  'Data 2° contagem',
];

const INITIAL_ROWS = [
  {
    id: '1',
    Material: 'MP-0001',
    'Descrição de material': 'RESINA PP HOMOPOLÍMERO',
    Centro: '1000',
    'Depósito': '1031',
    'GrpMercads.': 'MATÉRIA-PRIMA',
    curva: 'A',
    Estoque: 1200,
    'Custo unitario': 8.75,
    status: 'Pendente',
    'Data 1° contagem': '',
    Checagem: '',
    'Data 2° contagem': '',
    QuantidadeContada: '',
    Contado: 'Não',
    Localização: ['Rua A / Box 02'],
    NovaLocalizacao: '',
    Diferença: '',
    'Custo Divergência': '',
    Fotos: [],
  },
  {
    id: '2',
    Material: 'HB-0210',
    'Descrição de material': 'HALB TAMPA BRANCA 28MM',
    Centro: '1000',
    'Depósito': '1045',
    'GrpMercads.': 'SEMIACABADO',
    curva: 'B',
    Estoque: 540,
    'Custo unitario': 2.1,
    status: 'Pendente',
    'Data 1° contagem': '',
    Checagem: '',
    'Data 2° contagem': '',
    QuantidadeContada: '',
    Contado: 'Não',
    Localização: ['Rua C / Prateleira 07', 'Rua C / Pallet Extra 08'],
    NovaLocalizacao: '',
    Diferença: '',
    'Custo Divergência': '',
    Fotos: [],
  },
];

function formatDateBR(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

function sanitizeNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  const normalized = String(value).replace(',', '.').trim();
  if (normalized === '') return '';
  const n = Number(normalized);
  return Number.isFinite(n) ? n : '';
}

function normalizeLocations(value) {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .replace(/;|,/g, '|')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrencyBRL(value) {
  const numeric = sanitizeNumber(value);
  if (numeric === '') return '';

  const formatted = Math.abs(Number(numeric)).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (Number(numeric) > 0) return `+${formatted}`;
  if (Number(numeric) < 0) return `-${formatted}`;
  return formatted;
}

function getDivergenceTone(value) {
  const numeric = sanitizeNumber(value);
  if (numeric === '') return 'border-slate-200 bg-slate-50 text-slate-700';
  if (numeric < 0) return 'border-red-300 bg-red-50 text-red-700';
  if (numeric > 0) return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

// Excel sheet names cannot include: * ? : \ / [ ]  and must be <= 31 chars
function sanitizeWorksheetName(name) {
  const forbidden = ['\\', '/', '*', '?', ':', '[', ']'];
  const safe = String(name)
    .split('')
    .map((ch) => (forbidden.includes(ch) ? '-' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  // Excel also doesn't love empty names
  const nonEmpty = safe.length ? safe : 'Planilha';

  // Max 31 characters
  return nonEmpty.slice(0, 31);
}

function toImportRow(item, index) {
  const estoque = sanitizeNumber(item['Estoque']);
  const custo = sanitizeNumber(
    item['Custo unitario'] ??
      item['Custo unitário'] ??
      item[' Custo unitario'] ??
      item.CustoUnitario ??
      item['CustoUnitario']
  );

  return {
    id: String(Date.now() + index),
    Material: item.Material ?? '',
    'Descrição de material': item['Descrição de material'] ?? item['Texto breve material'] ?? '',
    Centro: item.Centro ?? '',
    'Depósito': item['Depósito'] ?? '',
    'GrpMercads.': item['GrpMercads.'] ?? item['Grupo de mercadorias'] ?? '',
    curva: item.curva ?? item.Curva ?? '',
    Estoque: estoque,
    'Custo unitario': custo === '' ? '' : custo,
    status: item.status ?? 'Pendente',
    'Data 1° contagem': item['Data 1° contagem'] ?? '',
    Checagem: item.Checagem ?? '',
    'Data 2° contagem': item['Data 2° contagem'] ?? '',
    QuantidadeContada: '',
    Contado: 'Não',
    Localização: normalizeLocations(item['Localização']),
    NovaLocalizacao: '',
    Diferença: '',
    'Custo Divergência': '',
    Fotos: [],
  };
}

function computeRow(row, patch = {}) {
  const next = { ...row, ...patch };
  const estoque = sanitizeNumber(next.Estoque);
  const contado = sanitizeNumber(next.QuantidadeContada);
  const custoUnitario = sanitizeNumber(next['Custo unitario']);

  next.Localização = normalizeLocations(next.Localização);

  if (estoque === '' || contado === '') {
    next.Diferença = '';
    next['Custo Divergência'] = '';
    return next;
  }

  // Regra definida:
  // Diferença = |contagem - saldo|
  // Custo = (contagem - saldo) * custo_unit
  const deltaContagem = Number(contado) - Number(estoque);
  next.Diferença = Math.abs(deltaContagem);
  next['Custo Divergência'] = custoUnitario === '' ? '' : Number(deltaContagem) * Number(custoUnitario);
  return next;
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getTodayCountedRows(rows, dateString = formatDateBR()) {
  return rows.filter((row) => {
    const countedThatDay = row['Data 1° contagem'] === dateString || row['Data 2° contagem'] === dateString;
    return row.Contado === 'Sim' && countedThatDay;
  });
}

function runLocalTests() {
  const tests = [
    {
      name: 'Falta de estoque: diferença absoluta e custo negativo',
      value: computeRow({ Estoque: 100, QuantidadeContada: 90, 'Custo unitario': 2, Localização: [] }),
      assert: (result) => result.Diferença === 10 && result['Custo Divergência'] === -20,
    },
    {
      name: 'Sobra de estoque: diferença absoluta e custo positivo',
      value: computeRow({ Estoque: 100, QuantidadeContada: 120, 'Custo unitario': 3, Localização: [] }),
      assert: (result) => result.Diferença === 20 && result['Custo Divergência'] === 60,
    },
    {
      name: 'Normalização de localizações',
      value: normalizeLocations('Rua A; Rua B, Rua C | Rua D'),
      assert: (result) => result.length === 4,
    },
    {
      name: 'Formatação monetária mantém sinal explícito',
      value: [formatCurrencyBRL(-20), formatCurrencyBRL(60)],
      assert: (result) => result[0] === '-R$ 20,00' && result[1] === '+R$ 60,00',
    },
    {
      name: 'Filtro do dia retorna apenas itens contados na data',
      value: getTodayCountedRows(
        [
          { Contado: 'Sim', 'Data 1° contagem': '05/03/26', 'Data 2° contagem': '' },
          { Contado: 'Sim', 'Data 1° contagem': '04/03/26', 'Data 2° contagem': '' },
          { Contado: 'Não', 'Data 1° contagem': '05/03/26', 'Data 2° contagem': '' },
        ],
        '05/03/26'
      ),
      assert: (result) => result.length === 1,
    },
    {
      name: 'Nome de planilha é sanitizado (remove / e limita tamanho)',
      value: sanitizeWorksheetName('Itens 05/03/26' + 'x'.repeat(50)),
      assert: (result) => !['\\', '/', '*', '?', ':', '[', ']'].some((c) => result.includes(c)) && result.length <= 31,
    },
  ];

  tests.forEach((test) => {
    console.assert(test.assert(test.value), `Falhou: ${test.name}`);
  });
}

if (typeof window !== 'undefined' && window.location?.search?.includes('debugTests=1')) {
  runLocalTests();
}

export default function EstoqueAuditoriaApp() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [reportDate, setReportDate] = useState(formatDateBR());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(INITIAL_ROWS[0]?.id || '');
  const fileInputRefs = useRef({});

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.Material,
        row['Descrição de material'],
        row['Depósito'],
        normalizeLocations(row.Localização).join(' | '),
      ]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, search]);

  const selectedRow = rows.find((row) => row.id === selectedId) || rows[0] || null;
  const selectedLocations = selectedRow ? normalizeLocations(selectedRow.Localização) : [];
  const divergenceTone = selectedRow
    ? getDivergenceTone(selectedRow['Custo Divergência'])
    : 'border-slate-200 bg-slate-50 text-slate-700';
  const divergenceValue = selectedRow ? formatCurrencyBRL(selectedRow['Custo Divergência']) : '';

  const handleImport = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames?.[0];
      if (!firstSheet) {
        console.warn('Arquivo XLSX sem planilhas');
        return;
      }
      const sheet = workbook.Sheets[firstSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const normalized = json.map((item, index) => toImportRow(item, index));

      const nextRows = normalized.length ? normalized : INITIAL_ROWS;
      setRows(nextRows);
      setSelectedId(nextRows[0]?.id || '');
    } catch (err) {
      console.error('Erro ao importar planilha:', err);
      alert('Erro ao importar planilha. Veja o console para mais detalhes.');
    }
  };

  const updateRow = (id, patch) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        return computeRow(row, patch);
      })
    );
  };

  const addLocation = (id) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const newLocation = String(row.NovaLocalizacao || '').trim();
        if (!newLocation) return row;

        const currentLocations = normalizeLocations(row.Localização);
        if (currentLocations.includes(newLocation)) return { ...row, NovaLocalizacao: '' };

        return computeRow(row, {
          Localização: [...currentLocations, newLocation],
          NovaLocalizacao: '',
        });
      })
    );
  };

  const removeLocation = (id, locationToRemove) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        return computeRow(row, {
          Localização: normalizeLocations(row.Localização).filter((loc) => loc !== locationToRemove),
        });
      })
    );
  };

  const handlePhoto = async (id, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const photos = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type || 'image/jpeg',
        dataUrl: await fileToDataUrl(file),
      }))
    );

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        return { ...row, Fotos: [...(row.Fotos || []), ...photos] };
      })
    );
  };

  const markCounted = (row) => {
    const firstDate = row['Data 1° contagem'] || formatDateBR();
    updateRow(row.id, {
      status: 'Contado',
      Contado: 'Sim',
      'Data 1° contagem': firstDate,
    });
  };

  const exportTemplate = () => {
    try {
      const templateRows = rows.map((row) => ({
        Material: row.Material,
        'Descrição de material': row['Descrição de material'],
        Centro: row.Centro,
        'Depósito': row['Depósito'],
        'GrpMercads.': row['GrpMercads.'],
        curva: row.curva,
        Estoque: row.Estoque,
        'Custo unitario': row['Custo unitario'],
        status: row.status,
        'Data 1° contagem': row['Data 1° contagem'],
        Checagem: row.Checagem,
        'Data 2° contagem': row['Data 2° contagem'],
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateRows, { header: TEMPLATE_COLUMNS });
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Importacao');
      XLSX.writeFile(workbook, 'template_contagem_estoque.xlsx');
    } catch (err) {
      console.error('Erro ao exportar template:', err);
      alert('Erro ao exportar template. Veja o console para mais detalhes.');
    }
  };

  const exportAuditWorkbook = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ChatGPT';
      workbook.created = new Date();

      const stockSheet = workbook.addWorksheet('Contagem');
      stockSheet.columns = [
        { header: 'Material', key: 'Material', width: 18 },
        { header: 'Descrição', key: 'Descricao', width: 34 },
        { header: 'Depósito', key: 'Deposito', width: 14 },
        { header: 'Quantidade Sistema', key: 'Estoque', width: 18 },
        { header: 'Quantidade Contada', key: 'QuantidadeContada', width: 18 },
        { header: 'Contado', key: 'Contado', width: 12 },
        { header: 'Localização', key: 'Localizacao', width: 24 },
        { header: 'Diferença de estoque', key: 'Diferenca', width: 18 },
        { header: 'Custo da divergência', key: 'CustoDivergencia', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
        { header: '1ª contagem', key: 'Data1', width: 14 },
        { header: 'Checagem', key: 'Checagem', width: 14 },
        { header: '2ª contagem', key: 'Data2', width: 14 },
        { header: 'Qtd. Fotos', key: 'QtdFotos', width: 12 },
      ];

      rows.forEach((row) => {
        stockSheet.addRow({
          Material: row.Material,
          Descricao: row['Descrição de material'],
          Deposito: row['Depósito'],
          Estoque: row.Estoque,
          QuantidadeContada: row.QuantidadeContada,
          Contado: row.Contado,
          Localizacao: normalizeLocations(row.Localização).join(' | '),
          Diferenca: row.Diferença,
          CustoDivergencia: row['Custo Divergência'],
          status: row.status,
          Data1: row['Data 1° contagem'],
          Checagem: row.Checagem,
          Data2: row['Data 2° contagem'],
          QtdFotos: row.Fotos?.length || 0,
        });
      });

      stockSheet.getRow(1).font = { bold: true };
      stockSheet.views = [{ state: 'frozen', ySplit: 1 }];

      const auditSheet = workbook.addWorksheet('Auditoria Fotos');
      auditSheet.columns = [
        { header: 'Material', key: 'Material', width: 18 },
        { header: 'Descrição', key: 'Descricao', width: 34 },
        { header: 'Depósito', key: 'Deposito', width: 14 },
        { header: 'Data contagem', key: 'DataContagem', width: 14 },
        { header: 'Foto', key: 'Foto', width: 28 },
        { header: 'Arquivo', key: 'Arquivo', width: 28 },
      ];
      auditSheet.getRow(1).font = { bold: true };

      let excelRow = 2;
      for (const row of rows) {
        if (!row.Fotos?.length) {
          auditSheet.addRow({
            Material: row.Material,
            Descricao: row['Descrição de material'],
            Deposito: row['Depósito'],
            DataContagem: row['Data 1° contagem'] || row['Data 2° contagem'] || '',
            Foto: 'Sem foto',
            Arquivo: '',
          });
          excelRow += 1;
          continue;
        }

        for (const photo of row.Fotos) {
          auditSheet.getRow(excelRow).height = 90;
          auditSheet.getCell(`A${excelRow}`).value = row.Material;
          auditSheet.getCell(`B${excelRow}`).value = row['Descrição de material'];
          auditSheet.getCell(`C${excelRow}`).value = row['Depósito'];
          auditSheet.getCell(`D${excelRow}`).value = row['Data 1° contagem'] || row['Data 2° contagem'] || '';
          auditSheet.getCell(`F${excelRow}`).value = photo.name;

          const base64 = String(photo.dataUrl).split(',')[1];
          const extension = photo.type.includes('png') ? 'png' : 'jpeg';
          const imageId = workbook.addImage({ base64, extension });

          auditSheet.addImage(imageId, {
            tl: { col: 4, row: excelRow - 1 },
            ext: { width: 120, height: 120 },
          });

          excelRow += 1;
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'auditoria_contagem_estoque.xlsx');
    } catch (err) {
      console.error('Erro ao exportar auditoria:', err);
      alert('Erro ao exportar auditoria. Veja o console para mais detalhes.');
    }
  };

  const exportDailyWorkbook = async (dateString = reportDate) => {
    const dayRows = getTodayCountedRows(rows, dateString);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ChatGPT';
    workbook.created = new Date();

    // FIX: dateString contains '/' which is invalid for worksheet names.
    const dailySheetName = sanitizeWorksheetName(`Itens ${dateString}`);
    const sheet = workbook.addWorksheet(dailySheetName);

    sheet.columns = [
      { header: 'Material', key: 'Material', width: 18 },
      { header: 'Descrição', key: 'Descricao', width: 34 },
      { header: 'Depósito', key: 'Deposito', width: 14 },
      { header: 'Quantidade', key: 'Quantidade', width: 14 },
      { header: 'Contado', key: 'Contado', width: 10 },
      { header: 'Localização', key: 'Localizacao', width: 28 },
      { header: 'Diferença de estoque', key: 'Diferenca', width: 18 },
      { header: 'Qtd. Fotos', key: 'QtdFotos', width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    dayRows.forEach((row) => {
      sheet.addRow({
        Material: row.Material,
        Descricao: row['Descrição de material'],
        Deposito: row['Depósito'],
        Quantidade: row.QuantidadeContada,
        Contado: row.Contado,
        Localizacao: normalizeLocations(row.Localização).join(' | '),
        Diferenca: row.Diferença,
        QtdFotos: row.Fotos?.length || 0,
      });
    });

    const fotosSheet = workbook.addWorksheet('Fotos do dia');
    fotosSheet.columns = [
      { header: 'Material', key: 'Material', width: 18 },
      { header: 'Descrição', key: 'Descricao', width: 34 },
      { header: 'Depósito', key: 'Deposito', width: 14 },
      { header: 'Data', key: 'Data', width: 10 },
      { header: 'Foto', key: 'Foto', width: 28 },
      { header: 'Arquivo', key: 'Arquivo', width: 28 },
    ];
    fotosSheet.getRow(1).font = { bold: true };

    let excelRow = 2;
    for (const row of dayRows) {
      if (!row.Fotos?.length) {
        fotosSheet.addRow({
          Material: row.Material,
          Descricao: row['Descrição de material'],
          Deposito: row['Depósito'],
          Data: dateString,
          Foto: 'Sem foto',
          Arquivo: '',
        });
        excelRow += 1;
        continue;
      }

      for (const photo of row.Fotos) {
        fotosSheet.getRow(excelRow).height = 90;
        fotosSheet.getCell(`A${excelRow}`).value = row.Material;
        fotosSheet.getCell(`B${excelRow}`).value = row['Descrição de material'];
        fotosSheet.getCell(`C${excelRow}`).value = row['Depósito'];
        fotosSheet.getCell(`D${excelRow}`).value = dateString;
        fotosSheet.getCell(`F${excelRow}`).value = photo.name;

        const base64 = String(photo.dataUrl).split(',')[1];
        const extension = photo.type.includes('png') ? 'png' : 'jpeg';
        const imageId = workbook.addImage({ base64, extension });
        fotosSheet.addImage(imageId, {
          tl: { col: 4, row: excelRow - 1 },
          ext: { width: 120, height: 120 },
        });

        excelRow += 1;
      }
    }

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `itens_contados_${dateString.replace(/\//g, '-')}.xlsx`);
    } catch (err) {
      console.error('Erro ao exportar planilha do dia:', err);
      alert('Erro ao exportar planilha do dia. Veja o console para mais detalhes.');
    }
  };

  const buildDailyEmailText = (dateString = reportDate) => {
    const dayRows = getTodayCountedRows(rows, dateString);
    const lines = [];
    lines.push(`Relatório de contagem - ${dateString}`);
    lines.push('');
    lines.push(`Total de itens: ${dayRows.length}`);
    lines.push('');
    lines.push('Material | Depósito | Qtd | Localização | Diferença');
    lines.push('---');
    for (const r of dayRows) {
      const loc = normalizeLocations(r.Localização).join(' | ');
      lines.push(`${r.Material} | ${r['Depósito']} | ${r.QuantidadeContada} | ${loc} | ${r.Diferença}`);
    }
    lines.push('');
    lines.push('Obs: gere a planilha do dia (com fotos) e anexe manualmente no e-mail.');
    return lines.join('\n');
  };

  const openOutlookCompose = () => {
    const subject = `Relatório de contagem - ${reportDate}`;
    const body = buildDailyEmailText(reportDate);
    const url = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const openMailto = () => {
    const subject = `Relatório de contagem - ${reportDate}`;
    const body = buildDailyEmailText(reportDate);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contagem de Estoque com Auditoria</h1>
              <p className="text-sm text-slate-600">Importe sua base, faça a contagem, tire fotos e exporte para Excel.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportTemplate}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar layout
              </Button>
              <Button onClick={exportAuditWorkbook}>
                <Download className="mr-2 h-4 w-4" />
                Exportar auditoria
              </Button>
            </div>
          </div>
        </Motion.div>

        <Tabs defaultValue="importacao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="importacao">Tela 1 • Importação</TabsTrigger>
            <TabsTrigger value="contagem">Tela 2 • Contagem</TabsTrigger>
            <TabsTrigger value="dia">Tela 3 • Itens do dia</TabsTrigger>
          </TabsList>

          <TabsContent value="importacao" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="h-5 w-5" />
                    Base de importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Importar planilha Excel (.xlsx)</Label>
                    <Input id="import-file" type="file" accept=".xlsx,.xls" onChange={handleImport} />
                  </div>

                  <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Layout esperado:</p>
                    <p className="mt-2 leading-6">{TEMPLATE_COLUMNS.join(' • ')}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">Itens carregados</p>
                      <p className="text-2xl font-bold">{rows.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">Itens contados</p>
                      <p className="text-2xl font-bold">{rows.filter((r) => r.Contado === 'Sim').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Campos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p><strong>Estoque</strong>: saldo no sistema</p>
                    <p><strong>Quantidade contada</strong>: informada pelo operador</p>
                    <p><strong>Diferença</strong>: |contagem - saldo|</p>
                    <p><strong>Custo divergência</strong>: (contagem - saldo) × custo unitário</p>
                    <p><strong>Localização</strong>: múltiplos pallets/endereços separados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Prévia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Depósito</TableHead>
                        <TableHead>Curva</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 8).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.Material}</TableCell>
                          <TableCell>{row['Descrição de material']}</TableCell>
                          <TableCell>{row['Depósito']}</TableCell>
                          <TableCell>{row.curva}</TableCell>
                          <TableCell>{row.Estoque}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === 'Contado' ? 'default' : 'secondary'}>{row.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contagem" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Package className="h-5 w-5" />
                    Itens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar por material, descrição, depósito ou localização"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[520px] overflow-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Depósito</TableHead>
                          <TableHead>Contado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className={`cursor-pointer ${selectedId === row.id ? 'bg-slate-100' : ''}`}
                            onClick={() => setSelectedId(row.id)}
                          >
                            <TableCell>{row.Material}</TableCell>
                            <TableCell>{row['Descrição de material']}</TableCell>
                            <TableCell>{row['Depósito']}</TableCell>
                            <TableCell>
                              <Badge variant={row.Contado === 'Sim' ? 'default' : 'secondary'}>{row.Contado}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Registro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRow ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`material-${selectedRow.id}`}>Material</Label>
                          <Input id={`material-${selectedRow.id}`} value={selectedRow.Material} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`descricao-${selectedRow.id}`}>Descrição</Label>
                          <Input id={`descricao-${selectedRow.id}`} value={selectedRow['Descrição de material']} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`deposito-${selectedRow.id}`}>Depósito</Label>
                          <Input id={`deposito-${selectedRow.id}`} value={selectedRow['Depósito']} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`estoque-${selectedRow.id}`}>Saldo no sistema</Label>
                          <Input id={`estoque-${selectedRow.id}`} value={selectedRow.Estoque} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`quantidade-${selectedRow.id}`}>Quantidade contada</Label>
                          <Input
                            id={`quantidade-${selectedRow.id}`}
                            type="number"
                            value={selectedRow.QuantidadeContada}
                            onChange={(e) => updateRow(selectedRow.id, { QuantidadeContada: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`contado-${selectedRow.id}`}>Contado</Label>
                          <Input id={`contado-${selectedRow.id}`} value={selectedRow.Contado} readOnly />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`diferenca-${selectedRow.id}`}>Diferença</Label>
                          <Input id={`diferenca-${selectedRow.id}`} value={selectedRow.Diferença} readOnly />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Custo da divergência</Label>
                          <div className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${divergenceTone}`}>{divergenceValue}</div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border p-4">
                        <div>
                          <Label htmlFor={`localizacoes-${selectedRow.id}`}>Localizações</Label>
                          <p className="mt-1 text-sm text-slate-500">Clique para remover. Adicione quantos pallets precisar.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedLocations.map((loc) => (
                            <Badge
                              key={loc}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeLocation(selectedRow.id, loc)}
                            >
                              {loc} ✕
                            </Badge>
                          ))}
                          {!selectedLocations.length && <span className="text-sm text-slate-500">Nenhuma localização cadastrada.</span>}
                        </div>
                        <div className="flex flex-col gap-2 md:flex-row">
                          <Input
                            id={`nova-localizacao-${selectedRow.id}`}
                            placeholder="Adicionar pallet, rua, box ou endereço"
                            value={selectedRow.NovaLocalizacao || ''}
                            onChange={(e) => updateRow(selectedRow.id, { NovaLocalizacao: e.target.value })}
                          />
                          <Button type="button" variant="outline" onClick={() => addLocation(selectedRow.id)}>
                            Adicionar
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`checagem-${selectedRow.id}`}>Checagem</Label>
                          <Input
                            id={`checagem-${selectedRow.id}`}
                            placeholder="OK / Divergente"
                            value={selectedRow.Checagem}
                            onChange={(e) => updateRow(selectedRow.id, { Checagem: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`data1-${selectedRow.id}`}>Data 1° contagem</Label>
                          <Input
                            id={`data1-${selectedRow.id}`}
                            placeholder="dd/mm/aa"
                            value={selectedRow['Data 1° contagem']}
                            onChange={(e) => updateRow(selectedRow.id, { 'Data 1° contagem': e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`data2-${selectedRow.id}`}>Data 2° contagem</Label>
                          <Input
                            id={`data2-${selectedRow.id}`}
                            placeholder="dd/mm/aa"
                            value={selectedRow['Data 2° contagem']}
                            onChange={(e) => updateRow(selectedRow.id, { 'Data 2° contagem': e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">Fotos para auditoria</p>
                            <p className="text-sm text-slate-500">No celular, abre a câmera (traseira) para registrar o item.</p>
                          </div>
                          <div className="flex gap-2">
                            <input
                              ref={(el) => {
                                fileInputRefs.current[selectedRow.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              className="hidden"
                              onChange={(e) => handlePhoto(selectedRow.id, e.target.files)}
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRefs.current[selectedRow.id]?.click()}>
                              <Camera className="mr-2 h-4 w-4" />
                              Tirar foto
                            </Button>
                            <Button type="button" onClick={() => markCounted(selectedRow)}>
                              Marcar como contado
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                          {(selectedRow.Fotos || []).map((photo, idx) => (
                            <div key={`${photo.name}-${idx}`} className="overflow-hidden rounded-2xl border">
                              <img src={photo.dataUrl} alt={photo.name} className="h-28 w-full object-cover" />
                              <div className="p-2 text-xs text-slate-500">{photo.name}</div>
                            </div>
                          ))}
                          {!selectedRow.Fotos?.length && (
                            <div className="col-span-full rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                              Nenhuma foto adicionada.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">Selecione um item.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dia" className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <span>Itens contados no dia</span>
                  <span className="text-sm font-normal text-slate-500">Data: {reportDate}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reportDate">Data do relatório (dd/mm/aa)</Label>
                      <Input id="reportDate" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="dd/mm/aa" />
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">Itens contados nessa data</p>
                      <p className="text-2xl font-bold">{getTodayCountedRows(rows, reportDate).length}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => exportDailyWorkbook(reportDate)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Gerar planilha do dia
                    </Button>
                    <Button variant="outline" onClick={openMailto}>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar (cliente padrão)
                    </Button>
                    <Button onClick={openOutlookCompose}>
                      <Mail className="mr-2 h-4 w-4" />
                      Abrir Outlook (web)
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Depósito</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Contado</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Diferença</TableHead>
                        <TableHead>Fotos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTodayCountedRows(rows, reportDate).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.Material}</TableCell>
                          <TableCell>{row['Descrição de material']}</TableCell>
                          <TableCell>{row['Depósito']}</TableCell>
                          <TableCell>{row.QuantidadeContada}</TableCell>
                          <TableCell>
                            <Badge variant={row.Contado === 'Sim' ? 'default' : 'secondary'}>{row.Contado}</Badge>
                          </TableCell>
                          <TableCell>{normalizeLocations(row.Localização).join(' | ')}</TableCell>
                          <TableCell>{row.Diferença}</TableCell>
                          <TableCell>{row.Fotos?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                      {!getTodayCountedRows(rows, reportDate).length && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                            Nenhum item marcado como contado nessa data.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Envio por e-mail</p>
                  <p className="mt-1">
                    No navegador, não dá para anexar automaticamente a planilha com fotos sem um backend (Microsoft Graph).
                    Aqui o app abre um rascunho no Outlook Web (ou no cliente padrão) com o texto do relatório.
                    Para incluir fotos, gere a planilha do dia e anexe manualmente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
