import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APIS, DIMENSIONS, STATUS_META, REPO_API_MAP } from '../data';

const DIM_LABEL = { func: 'F', prec: 'P', mem: 'M', det: 'D' };
const ROW_H = 32;
const OVERSCAN = 6;
const API_MAP = new Map(APIS.map(a => [a.name, a]));

function useRepoApis(repo, filteredApiNames) {
  return useMemo(() => {
    if (!repo) return { aligned: [], fixing: [] };

    const shortName = repo.name.split('/').pop();
    const repoApis = REPO_API_MAP[shortName] || REPO_API_MAP[repo.name];
    if (!repoApis) return { aligned: [], fixing: [] };

    const fixing = [];
    const aligned = [];

    repoApis.forEach(entry => {
      if (filteredApiNames && !filteredApiNames.has(entry.name)) return;
      const api = API_MAP.get(entry.name);
      if (!api) return;
      if (entry.fixing) {
        fixing.push({
          name: api.name,
          freq: api.freq,
          dims: api.dims,
          broken: entry.brokenDims,
        });
      } else {
        aligned.push({
          name: api.name,
          freq: api.freq,
          dims: api.dims,
        });
      }
    });

    fixing.sort((a, b) => b.freq - a.freq);
    aligned.sort((a, b) => b.freq - a.freq);

    return { aligned, fixing };
  }, [repo, filteredApiNames]);
}

function formatFreq(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function DimDots({ dims, highlightFixing }) {
  return (
    <span className="rm-dim-dots">
      {DIMENSIONS.map(d => {
        const s = dims[d.key];
        const isFixing = highlightFixing && s === 'fixing';
        return (
          <span
            key={d.key}
            className={'rm-dot' + (isFixing ? ' rm-dot-fix' : '')}
            style={{
              background: `var(--s-${s})`,
              ...(s === 'untested' ? { border: '1px solid var(--line)' } : {}),
            }}
            title={`${d.name}: ${STATUS_META[s]?.short || s}`}
          />
        );
      })}
    </span>
  );
}

function VirtualApiList({ items, renderItem }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setVh(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalH = items.length * ROW_H;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visibleCount = Math.ceil(vh / ROW_H) + OVERSCAN * 2;
  const end = Math.min(items.length, start + visibleCount);
  const visible = items.slice(start, end);
  const padTop = start * ROW_H;
  const padBottom = totalH - end * ROW_H;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  if (items.length === 0) {
    return (
      <div className="rm-scroll">
        <div className="rm-empty">无数据</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rm-scroll"
      onScroll={handleScroll}
    >
      <div style={{ height: totalH, position: 'relative', minHeight: '100%' }}>
        {padTop > 0 && <div style={{ height: padTop }} />}
        {visible.map((item, i) => renderItem(item, start + i))}
        {padBottom > 0 && <div style={{ height: padBottom }} />}
      </div>
    </div>
  );
}

function ApiRow({ api, showBroken }) {
  return (
    <div className="rm-api-row">
      <span className="rm-api-name" title={api.name}>{api.name}</span>
      <span className="rm-api-freq">{formatFreq(api.freq)}</span>
      <DimDots dims={api.dims} highlightFixing={showBroken} />
      {showBroken && api.broken && (
        <span className="rm-broken-tags">
          {api.broken.map(k => (
            <span key={k} className="rm-broken-tag" style={{ color: 'var(--s-fixing)', background: 'var(--s-fixing-dim)' }}>
              {DIM_LABEL[k]}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

export default function RepoDetailModal({ repo, onClose, filteredApiNames }) {
  const { aligned, fixing } = useRepoApis(repo, filteredApiNames);

  const onKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onKey]);

  if (!repo) return null;

  const [org, name] = repo.name.split('/');
  const rate = repo.apiAligned / repo.apiUsed;

  return createPortal(
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-panel" onClick={e => e.stopPropagation()}>
        <div className="rm-header">
          <div className="rm-header-top">
            <div className="rm-repo-name">
              <span className="rm-org">{org}/</span>
              <span className="rm-name">{name}</span>
              <span className="rm-stars">★{repo.stars}</span>
            </div>
            <div className="rm-header-actions">
              <div className="rm-rate-badge" style={{
                background: rate >= 0.95 ? 'var(--s-aligned-dim)' : rate >= 0.85 ? 'var(--s-reviewed-dim)' : 'var(--s-fixing-dim)',
                color: rate >= 0.95 ? 'var(--s-aligned)' : rate >= 0.85 ? 'var(--s-reviewed)' : 'var(--s-fixing)',
              }}>
                {(rate * 100).toFixed(0)}%
              </div>
              <button className="rm-close" onClick={onClose} type="button" aria-label="关闭">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="rm-stats">
            <div className="rm-stat">
              <span>匹配 API</span>
              <b>{repo.apiUsed}</b>
            </div>
            <div className="rm-stat good">
              <span>无阻塞</span>
              <b>{repo.apiAligned}</b>
            </div>
            <div className="rm-stat bad">
              <span>阻塞</span>
              <b>{repo.missing}</b>
            </div>
          </div>
        </div>

        <div className="rm-body">
          <div className="rm-col rm-col-fix">
            <div className="rm-col-head">
              <span className="rm-col-dot" style={{ background: 'var(--s-fixing)' }} />
              <span className="rm-col-title">待修复 API</span>
              <span className="rm-col-count">{fixing.length}</span>
            </div>
            <VirtualApiList
              items={fixing}
              renderItem={(api, i) => <ApiRow key={api.name + i} api={api} showBroken />}
            />
          </div>

          <div className="rm-col rm-col-ok">
            <div className="rm-col-head">
              <span className="rm-col-dot" style={{ background: 'var(--s-aligned)' }} />
              <span className="rm-col-title">可用 API</span>
              <span className="rm-col-count">{aligned.length}</span>
            </div>
            <VirtualApiList
              items={aligned}
              renderItem={(api, i) => <ApiRow key={api.name + i} api={api} />}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
