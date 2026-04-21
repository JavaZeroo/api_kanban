import { useState, useMemo, useEffect, useCallback } from 'react';
import { APIS as APIS_DEFAULT, DIMENSIONS } from './data';
import { HeroSection, DimSection, MatrixSection, TrendSection, RepoSection } from './sections';
import Topbar from './components/Topbar';
import FocusCard from './components/FocusCard';
import TweaksPanel from './components/TweaksPanel';
import ImportPanel from './components/ImportPanel';

const TWEAKS_DEFAULTS = { matrixDensity: 'dense', showCudaBaseline: true };
const ALL_LEVELS = ['L0', 'L1', 'L2'];

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
        <span><b>{ready.toLocaleString()}</b> release-ready</span>
        <span className={blockingDims ? 'bad' : 'good'}><b>{blockingDims.toLocaleString()}</b> blocking dims</span>
        <span><b>{untestedDims.toLocaleString()}</b> untested dims</span>
        <span><b>{topModule?.module || 'clear'}</b> top risk</span>
      </div>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState(null);
  const [tweaksOn, setTweaksOn] = useState(false);
  const [importOn, setImportOn] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULTS);
  const [levels, setLevels] = useState(() => new Set(ALL_LEVELS));
  const [customApis, setCustomApis] = useState(null);

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
    const counts = { L0: 0, L1: 0, L2: 0 };
    searchFiltered.forEach(a => { if (counts[a.level] != null) counts[a.level]++; });
    return counts;
  }, [searchFiltered]);

  const filtered = useMemo(
    () => searchFiltered.filter(a => levels.has(a.level)),
    [searchFiltered, levels]
  );

  const levelFilterProps = { levels, onToggle: toggleLevel, counts: levelCounts };

  return (
    <>
      <Topbar search={search} setSearch={setSearch} matched={filtered.length} total={APIS.length} onImportClick={() => setImportOn(true)} />
      <ScopeBar search={search} setSearch={setSearch} filtered={filtered} customApis={customApis} onResetData={handleResetData} />
      <HeroSection filtered={searchFiltered} />
      <DimSection filtered={filtered} levelFilter={levelFilterProps} />
      <RepoSection onFocus={setFocus} levelFilter={levelFilterProps} />
      <TrendSection levelFilter={levelFilterProps} />
      <MatrixSection filtered={filtered} onFocus={setFocus} levelFilter={levelFilterProps} />
      <FocusCard focus={focus} onClose={() => setFocus(null)} />
      <TweaksPanel tweaksOn={tweaksOn} tweaks={tweaks} setTweak={setTweak} />
      <ImportPanel open={importOn} onClose={() => setImportOn(false)} onImport={handleImport} />
    </>
  );
}

