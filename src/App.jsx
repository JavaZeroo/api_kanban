import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { APIS as APIS_DEFAULT, DIMENSIONS } from './data';
import { HeroSection, DimSection, TrendSection, RepoSection } from './sections';
const MatrixSection = lazy(() => import('./sections/MatrixSection'));
import Topbar from './components/Topbar';
import FocusCard from './components/FocusCard';
import TweaksPanel from './components/TweaksPanel';
import ImportPanel from './components/ImportPanel';

const TWEAKS_DEFAULTS = { showCudaBaseline: true };
const DEFAULT_LEVELS = ['L01'];
const L01_SET = new Set(['L0', 'L1']);

function ScopeBar({ search, setSearch, filtered, customApis, onResetData }) {
  const total = filtered.length;
  const ready = filtered.filter(api => DIMENSIONS.every(d => {
    const status = api.dims[d.key];
    return status === 'aligned' || status === 'reviewed';
  })).length;
  const blockingDims = filtered.reduce((sum, api) => (
    sum + DIMENSIONS.filter(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported').length
  ), 0);
  const untestedDims = filtered.reduce((sum, api) => (
    sum + DIMENSIONS.filter(d => api.dims[d.key] === 'untested').length
  ), 0);
  const topModule = [...filtered.reduce((map, api) => {
    const risk = DIMENSIONS.reduce((sum, d) => {
      const status = api.dims[d.key];
      return sum + (status === 'fixing' || status === 'unsupported' ? 3 : status === 'untested' ? 1 : 0);
    }, 0);
    if (!risk) return map;
    const current = map.get(api.module) || { module: api.module, risk: 0, apis: 0 };
    current.risk += risk;
    current.apis += 1;
    map.set(api.module, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.risk - a.risk || b.apis - a.apis)[0];

  return (
    <div className="scope-bar">
      <div className="scope-main">
        <span className="scope-label">当前范围</span>
        {search.trim() ? (
          <button className="scope-query" type="button" onClick={() => setSearch('')} title="清除搜索">
            <span>{search.trim()}</span>
            <b>×</b>
          </button>
        ) : (
          <span className="scope-query muted">全部 API</span>
        )}
      </div>
      <div className="scope-metrics">
        {customApis && (
          <button className="scope-query" type="button" onClick={onResetData} title="恢复默认数据" style={{ background: 'var(--s-npu-dim, var(--accent-soft))', borderColor: 'var(--npu, var(--accent))' }}>
            <span>已导入自定义数据</span>
            <b>×</b>
          </button>
        )}
        <span><b>{total.toLocaleString()}</b> APIs</span>
        <span><b>{ready.toLocaleString()}</b> 四维全齐</span>
        <span className={blockingDims ? 'bad' : 'good'}><b>{blockingDims.toLocaleString()}</b> blocking dims</span>
        <span><b>{untestedDims.toLocaleString()}</b> untested dims</span>
        <span><b>{topModule?.module || 'clear'}</b> top risk</span>
      </div>
    </div>
  );
}

const CANN_VERSIONS = [
  { label: 'CANN 8.0.RC3', value: '8.0.RC3', torch: 'torch 2.5.1' },
  { label: 'CANN 9.0.0', value: '9.0.0', torch: 'torch 2.7.0' },
  { label: 'CANN 9.0.RC1', value: '9.0.RC1', torch: 'torch 2.7.0' },
];

export default function App() {
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState(null);
  const [tweaksOn, setTweaksOn] = useState(false);
  const [importOn, setImportOn] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULTS);
  const [levels, setLevels] = useState(() => new Set(DEFAULT_LEVELS));
  const [customApis, setCustomApis] = useState(null);
  const [cannVer, setCannVer] = useState(CANN_VERSIONS[1]);

  const APIS = customApis || APIS_DEFAULT;

  const toggleLevel = (lv) => {
    setLevels(prev => {
      const next = new Set(prev);
      if (next.has(lv)) {
        if (next.size === 1) return prev;
        next.delete(lv);
      } else {
        next.add(lv);
      }
      return next;
    });
  };

  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOn(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('[data-dashboard-search]')?.focus();
      }
      if (e.key === 'Escape' && search) setSearch('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search]);

  const setTweak = (k, v) => {
    setTweaks(t => ({ ...t, [k]: v }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const handleImport = useCallback((apis) => {
    setCustomApis(apis);
  }, []);

  const handleResetData = useCallback(() => {
    setCustomApis(null);
  }, []);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return APIS;
    const q = search.toLowerCase();
    return APIS.filter(a => {
      const haystack = [
        a.name,
        a.short,
        a.module,
        a.level,
        a.alignment,
        ...(a.tags || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [search]);

  const levelCounts = useMemo(() => {
    const counts = { L01: 0, L2: 0 };
    searchFiltered.forEach(a => {
      if (a.level === 'L0' || a.level === 'L1') counts.L01++;
      else if (a.level === 'L2') counts.L2++;
    });
    return counts;
  }, [searchFiltered]);

  const filtered = useMemo(
    () => searchFiltered.filter(a => {
      if (levels.has('L01') && L01_SET.has(a.level)) return true;
      if (levels.has('L2') && a.level === 'L2') return true;
      return false;
    }),
    [searchFiltered, levels]
  );

  const levelFilterProps = { levels, onToggle: toggleLevel, counts: levelCounts };

  return (
    <>
      <Topbar search={search} setSearch={setSearch} matched={filtered.length} total={APIS.length} onImportClick={() => setImportOn(true)} cannVer={cannVer} setCannVer={setCannVer} cannVersions={CANN_VERSIONS} />
      <ScopeBar search={search} setSearch={setSearch} filtered={filtered} customApis={customApis} onResetData={handleResetData} />
      <HeroSection filtered={searchFiltered} cannVer={cannVer} setCannVer={setCannVer} cannVersions={CANN_VERSIONS} />
      <DimSection filtered={filtered} levelFilter={levelFilterProps} />
      <RepoSection onFocus={setFocus} levelFilter={levelFilterProps} filtered={filtered} />
      <TrendSection levelFilter={levelFilterProps} />
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>加载矩阵...</div>}>
        <MatrixSection filtered={filtered} onFocus={setFocus} levelFilter={levelFilterProps} />
      </Suspense>
      <FocusCard focus={focus} onClose={() => setFocus(null)} />
      <TweaksPanel tweaksOn={tweaksOn} tweaks={tweaks} setTweak={setTweak} />
      <ImportPanel open={importOn} onClose={() => setImportOn(false)} onImport={handleImport} />
    </>
  );
}

