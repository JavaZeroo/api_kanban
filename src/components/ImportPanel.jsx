import { useState, useRef } from 'react';
import { Drawer, Button, Upload, message, Collapse, Tag } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { DIMENSIONS, STATUS_META } from '../data';
import { colors } from './EChart';

const VALID_STATUSES = Object.keys(STATUS_META);
const VALID_DIMS = DIMENSIONS.map(d => d.key);
const VALID_LEVELS = ['L0', 'L1', 'L2'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV 至少需要表头 + 1 行数据');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'api' || h === 'api_name');
  const moduleIdx = headers.findIndex(h => h === 'module' || h === 'mod');
  const levelIdx = headers.findIndex(h => h === 'level');
  const freqIdx = headers.findIndex(h => h === 'freq' || h === 'frequency');
  const caseTotalIdx = headers.findIndex(h => h === 'casetotal' || h === 'case_total' || h === 'total_cases');
  const casePassIdx = headers.findIndex(h => h === 'casepass' || h === 'case_pass' || h === 'pass_cases');
  const dimIdxMap = {};
  VALID_DIMS.forEach(dk => {
    const idx = headers.findIndex(h => h === dk || h === `dim_${dk}`);
    if (idx >= 0) dimIdxMap[dk] = idx;
  });
  if (nameIdx < 0) throw new Error('CSV 缺少 name/api 列');

  const apis = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[nameIdx];
    if (!name) continue;
    const dims = {};
    VALID_DIMS.forEach(dk => {
      if (dimIdxMap[dk] !== undefined) {
        const val = cols[dimIdxMap[dk]]?.toLowerCase();
        dims[dk] = VALID_STATUSES.includes(val) ? val : 'untested';
      } else {
        dims[dk] = 'untested';
      }
    });
    const api = {
      name,
      short: name.split('.').pop(),
      module: moduleIdx >= 0 ? cols[moduleIdx] : name.split('.').slice(0, -1).join('.') || 'torch',
      level: levelIdx >= 0 && VALID_LEVELS.includes(cols[levelIdx]) ? cols[levelIdx] : 'L2',
      dims,
      caseTotal: caseTotalIdx >= 0 ? parseInt(cols[caseTotalIdx]) || 0 : 0,
      casePass: casePassIdx >= 0 ? parseInt(cols[casePassIdx]) || 0 : 0,
      freq: freqIdx >= 0 ? parseInt(cols[freqIdx]) || 0 : 0,
      updatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: 'import',
    };
    apis.push(api);
  }
  return { apis, errors };
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : data.apis || data.data || [];
  if (!arr.length) throw new Error('JSON 数据为空或格式不正确');
  const apis = arr.map(item => {
    const dims = {};
    VALID_DIMS.forEach(dk => {
      const val = (item.dims?.[dk] || item[dk] || 'untested').toLowerCase();
      dims[dk] = VALID_STATUSES.includes(val) ? val : 'untested';
    });
    return {
      name: item.name || item.api || item.api_name,
      short: (item.name || item.api || '').split('.').pop(),
      module: item.module || item.mod || (item.name || '').split('.').slice(0, -1).join('.') || 'torch',
      level: VALID_LEVELS.includes(item.level) ? item.level : 'L2',
      dims,
      caseTotal: parseInt(item.caseTotal || item.case_total || 0) || 0,
      casePass: parseInt(item.casePass || item.case_pass || 0) || 0,
      freq: parseInt(item.freq || item.frequency || 0) || 0,
      updatedAt: item.updatedAt || new Date().toISOString().slice(0, 10),
      updatedBy: item.updatedBy || 'import',
    };
  }).filter(a => a.name);
  return { apis, errors: [] };
}

function validateApis(apis) {
  const warnings = [];
  const names = new Set();
  apis.forEach((a, i) => {
    if (names.has(a.name)) warnings.push(`行 ${i + 1}: 重复 API "${a.name}"`);
    names.add(a.name);
    if (!a.module) warnings.push(`行 ${i + 1}: "${a.name}" 缺少 module`);
    Object.entries(a.dims).forEach(([dk, val]) => {
      if (!VALID_STATUSES.includes(val)) warnings.push(`行 ${i + 1}: "${a.name}" 维度 ${dk} 状态无效 "${val}"`);
    });
  });
  return warnings;
}

export default function ImportPanel({ open, onClose, onImport }) {
  const [preview, setPreview] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleParse = (text, format) => {
    try {
      const result = format === 'csv' ? parseCSV(text) : parseJSON(text);
      const warns = validateApis(result.apis);
      setPreview(result.apis);
      setWarnings(warns);
      if (result.apis.length === 0) {
        message.warning('未解析到有效 API 数据');
      } else {
        message.success(`解析成功: ${result.apis.length} API`);
      }
    } catch (e) {
      message.error(`解析失败: ${e.message}`);
      setPreview(null);
      setWarnings([]);
    }
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const ext = file.name.split('.').pop().toLowerCase();
      handleParse(text, ext === 'csv' ? 'csv' : 'json');
    };
    reader.readAsText(file);
    return false;
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴数据');
      return;
    }
    const trimmed = pasteText.trim();
    const format = trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'csv';
    handleParse(trimmed, format);
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onImport(preview);
      setLoading(false);
      message.success(`已导入 ${preview.length} API`);
      handleReset();
      onClose();
    }, 300);
  };

  const handleReset = () => {
    setPreview(null);
    setWarnings([]);
    setPasteText('');
  };

  const statusColor = (s) => {
    const map = { aligned: 'var(--s-aligned)', reviewed: 'var(--s-reviewed)', fixing: 'var(--s-fixing)', unsupported: 'var(--s-unsupported)', untested: 'var(--s-untested)' };
    return map[s] || 'var(--fg-3)';
  };

  const collapseItems = [
    {
      key: 'format',
      label: <span className="mono" style={{ fontSize: 11 }}>数据格式说明</span>,
      children: (
        <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.8 }}>
          <div style={{ marginBottom: 8 }}>
            <b style={{ color: 'var(--fg)' }}>JSON 格式</b>（推荐）
            <pre style={{ background: 'var(--bg-1)', padding: 8, borderRadius: 2, marginTop: 4, fontSize: 9.5, overflow: 'auto', maxHeight: 120 }}>
{`[
  {
    "name": "torch.abs",
    "module": "torch",
    "level": "L0",
    "dims": {
      "func": "aligned",
      "prec": "aligned",
      "mem": "reviewed",
      "det": "aligned"
    },
    "caseTotal": 24,
    "casePass": 24,
    "freq": 150000
  }
]`}
            </pre>
          </div>
          <div>
            <b style={{ color: 'var(--fg)' }}>CSV 格式</b>
            <pre style={{ background: 'var(--bg-1)', padding: 8, borderRadius: 2, marginTop: 4, fontSize: 9.5, overflow: 'auto', maxHeight: 100 }}>
{`name,module,level,func,prec,mem,det,caseTotal,casePass,freq
torch.abs,torch,L0,aligned,aligned,reviewed,aligned,24,24,150000`}
            </pre>
          </div>
          <div style={{ marginTop: 8 }}>
            <b style={{ color: 'var(--fg)' }}>状态值</b>：aligned / reviewed / fixing / unsupported / untested
          </div>
          <div>
            <b style={{ color: 'var(--fg)' }}>级别</b>：L0 / L1 / L2
          </div>
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={<span className="mono" style={{ fontSize: 12 }}>API 数据导入</span>}
      placement="right"
      open={open}
      onClose={() => { handleReset(); onClose(); }}
      width={420}
      styles={{
        header: { borderBottom: '1px solid var(--line)', padding: '10px 16px', fontFamily: 'var(--font-mono)' },
        body: { padding: 0, background: 'var(--bg)' },
      }}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '8px 0' }}>
          <Button size="small" onClick={handleReset} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
            重置
          </Button>
          <Button
            size="small"
            type="primary"
            loading={loading}
            disabled={!preview || preview.length === 0}
            onClick={handleImport}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
          >
            导入 {preview ? `(${preview.length})` : ''}
          </Button>
        </div>
      }
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <Collapse
          items={collapseItems}
          bordered={false}
          ghost
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)', marginBottom: 8 }}>
          <UploadOutlined style={{ marginRight: 6 }} />上传文件
        </div>
        <Upload
          accept=".json,.csv"
          showUploadList={false}
          beforeUpload={handleFile}
        >
          <Button
            size="small"
            icon={<FileTextOutlined />}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
          >
            选择 JSON / CSV 文件
          </Button>
        </Upload>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)', marginBottom: 8 }}>
          粘贴数据
        </div>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="粘贴 JSON 数组或 CSV 文本..."
          style={{
            width: '100%', minHeight: 100, resize: 'vertical',
            fontFamily: 'var(--font-mono)', fontSize: 10.5,
            background: 'var(--bg-1)', color: 'var(--fg)',
            border: '1px solid var(--line)', borderRadius: 2,
            padding: '8px 10px', outline: 'none',
          }}
        />
        <Button
          size="small"
          onClick={handlePaste}
          disabled={!pasteText.trim()}
          style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
        >
          解析粘贴数据
        </Button>
      </div>

      {warnings.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--s-reviewed-dim)' }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: 'var(--s-reviewed)', marginBottom: 4 }}>
            ⚠ 警告 ({warnings.length})
          </div>
          {warnings.slice(0, 5).map((w, i) => (
            <div key={i} className="mono dim" style={{ fontSize: 9.5, lineHeight: 1.5 }}>{w}</div>
          ))}
          {warnings.length > 5 && (
            <div className="mono dim" style={{ fontSize: 9.5 }}>...还有 {warnings.length - 5} 条</div>
          )}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ color: 'var(--s-aligned)' }} />
            预览 ({preview.length} API)
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--line-soft)', borderRadius: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              <thead>
                <tr style={{ background: 'var(--bg-1)', position: 'sticky', top: 0 }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--fg-3)', fontWeight: 500, borderBottom: '1px solid var(--line)' }}>API</th>
                  <th style={{ padding: '6px 4px', color: 'var(--fg-3)', fontWeight: 500, borderBottom: '1px solid var(--line)' }}>模块</th>
                  {DIMENSIONS.map(d => (
                    <th key={d.key} style={{ padding: '6px 4px', color: 'var(--fg-3)', fontWeight: 500, borderBottom: '1px solid var(--line)', textAlign: 'center' }}>{d.letter}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((api, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '4px 8px', color: 'var(--fg)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{api.name}</td>
                    <td style={{ padding: '4px', color: 'var(--fg-3)', fontSize: 9 }}>{api.module}</td>
                    {DIMENSIONS.map(d => (
                      <td key={d.key} style={{ padding: '4px', textAlign: 'center' }}>
                        <span style={{ color: statusColor(api.dims[d.key]), fontSize: 9 }}>●</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="mono dim" style={{ fontSize: 9.5, padding: '6px 8px', textAlign: 'center', background: 'var(--bg-1)' }}>
                ...还有 {preview.length - 50} 条
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
