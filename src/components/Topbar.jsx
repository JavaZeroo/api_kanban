import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Input, Avatar, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { colors } from './EChart';

const { Header } = Layout;

export default function Topbar({ search, setSearch }) {
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
    <Header
      style={{
        height: 44,
        lineHeight: '44px',
        padding: 0,
        background: colors.panel,
        borderBottom: '1px solid var(--line-hard)',
        display: 'flex',
        alignItems: 'stretch',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          padding: '0 14px',
          background: colors.fg,
          color: colors.bg,
          height: '100%',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <div
          style={{
            width: 18,
            height: 18,
            background: `linear-gradient(135deg, ${colors.npu} 50%, ${colors.cuda} 50%)`,
            borderRadius: 3,
          }}
        />
        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}>ALIGN</span>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10.5, opacity: 0.55 }}>v0.3</span>
      </div>
      <Menu
        mode="horizontal"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          height: 44,
          lineHeight: '44px',
          borderBottom: 'none',
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
        }}
      />
      <div style={{ flex: 1, padding: '0 14px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--line)' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--fg-3)' }} />}
          placeholder="grep API, module, repo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
          }}
          suffix={
            <span
              style={{
                fontSize: 10,
                color: 'var(--fg-3)',
                border: '1px solid var(--line)',
                padding: '1px 5px',
                borderRadius: 2,
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              ⌘K
            </span>
          }
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRight: '1px solid var(--line)', gap: 8, fontSize: 12 }}>
        <span className="pill">
          <span className="dot" />CI · 23 任务
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRight: '1px solid var(--line)', gap: 8 }}>
        <span className="mono dim" style={{ fontSize: 11 }}>torch 2.7.0</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRight: '1px solid var(--line)', gap: 8 }}>
        <span className="mono dim" style={{ fontSize: 11 }}>CANN 8.1.RC2</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', marginLeft: 'auto' }}>
        <Avatar size="small" style={{ background: colors.fg, color: colors.bg, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          ZS
        </Avatar>
      </div>
    </Header>
  );
}
