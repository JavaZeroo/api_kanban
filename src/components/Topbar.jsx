export default function Topbar({ search, setSearch, matched, total }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark" />
        <span className="brand-title">ALIGN</span>
        <span className="brand-sub">v0.3</span>
      </div>
      <div className="nav">
        <a className="active" href="#">看板</a>
        <a href="#">API 列表</a>
        <a href="#">用例</a>
        <a href="#">评审</a>
        <a href="#">仓库扫描</a>
        <a href="#">发版</a>
      </div>
      <div className="tb-cell flex">
        <div className="search">
          <span style={{ color: 'var(--fg-3)' }}>⌕</span>
          <input
            data-dashboard-search
            placeholder="grep API, module, repo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="search-count">{matched?.toLocaleString?.() || 0}/{total?.toLocaleString?.() || 0}</span>
          {search && (
            <button className="search-clear" type="button" onClick={() => setSearch('')} aria-label="Clear search">
              ×
            </button>
          )}
          <span className="kbd">⌘K</span>
        </div>
      </div>
      <div className="tb-cell"><span className="pill"><span className="dot" />CI · 23 任务</span></div>
      <div className="tb-cell"><span className="mono dim" style={{ fontSize: 11 }}>torch 2.7.0</span></div>
      <div className="tb-cell"><span className="mono dim" style={{ fontSize: 11 }}>CANN 9.0.0</span></div>
      <div className="tb-cell right"><div className="avatar">ZS</div></div>
    </div>
  );
}
