import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Input, Avatar, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { colors } from './EChart';

const { Header } = Layout;

export default function Topbar({ search, setSearch, onImportClick }) {
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
      <div className="tb-cell"><span className="mono dim" style={{ fontSize: 11 }}>torch 2.7.0</span></div>
      <div className="tb-cell"><span className="mono dim" style={{ fontSize: 11 }}>CANN 9.0.0</span></div>
      <div className="tb-cell right"><div className="avatar">ZS</div></div>
    </div>
  );
}
