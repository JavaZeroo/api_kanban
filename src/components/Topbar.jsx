import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';

function CannPopover({ versions, active, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  };

  useEffect(() => {
    const onDoc = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inMenu = popoverRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onDoc);
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      updatePos();
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  const menu = (
    <div ref={popoverRef} className="cann-menu" style={{ position: 'fixed', top: pos.top, right: pos.right }}>
      <div className="cann-menu-hd">选择 CANN 版本</div>
      {versions.map(v => (
        <button
          key={v.value}
          type="button"
          className={active?.value === v.value ? 'active' : ''}
          onClick={() => { onChange(v); setOpen(false); }}
        >
          <span className="cann-line" />
          <span className="cann-info">
            <span className="cann-name">{v.label}</span>
            <span className="cann-torch">{v.torch}</span>
          </span>
          {active?.value === v.value && <span className="cann-check">✓</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="cann-popover">
      <button
        ref={triggerRef}
        type="button"
        className={`cann-trigger ${open ? 'open' : ''}`}
        onClick={() => { if (!open) updatePos(); setOpen(!open); }}
      >
        <span className="cann-dot" />
        <span className="cann-label">{active?.label || 'CANN'}</span>
        <span className="cann-arrow" />
      </button>
      {open && createPortal(menu, document.body)}
    </div>
  );
}

export default function Topbar({ search, setSearch, onImportClick, cannVer, setCannVer, cannVersions }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'dashboard', label: '看板' },
    { key: 'api', label: 'API 列表' },
    { key: 'cases', label: '用例' },
    { key: 'review', label: '评审' },
    { key: 'scan', label: '仓库扫描' },
    { key: 'release', label: '发版' },
  ];

  const getSelectedKey = () => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/api')) return 'api';
    return 'dashboard';
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'dashboard') navigate('/');
    else if (key === 'api') navigate('/apis');
  };

  return (
    <div className="topbar">
      <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="brand-mark" />
        <span className="brand-title">ALIGN</span>
        <span className="brand-sub">v0.3</span>
      </div>
      <nav className="nav">
        {menuItems.map(item => (
          <a
            key={item.key}
            className={getSelectedKey() === item.key ? 'active' : ''}
            onClick={() => handleMenuClick({ key: item.key })}
            style={{ cursor: 'pointer' }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="tb-cell flex">
        <div className="search">
          <SearchOutlined style={{ color: 'var(--fg-3)' }} />
          <input
            placeholder="grep API, module, repo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-dashboard-search
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} type="button">×</button>
          )}
          <span className="kbd">⌘K</span>
        </div>
      </div>
      <div className="tb-cell"><span className="pill"><span className="dot" />CI · 23 任务</span></div>
      <div className="tb-cell">
        <button
          className="import-btn"
          type="button"
          onClick={onImportClick}
          title="导入 API 数据"
        >
          ↗ 导入
        </button>
      </div>
      <div className="tb-cell">
        <CannPopover versions={cannVersions} active={cannVer} onChange={setCannVer} />
      </div>
      <div className="tb-cell right"><div className="avatar">ZS</div></div>
    </div>
  );
}
