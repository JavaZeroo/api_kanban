import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './styles/index.css'
import App from './App'
import { ApiListPage, ApiDetailPage } from './pages'

const theme = {
  token: {
    colorPrimary: '#e88c3a',
    colorSuccess: '#3d9966',
    colorWarning: '#a89a4a',
    colorError: '#c94a4a',
    colorInfo: '#4a9e6a',
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontFamilyCode: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    borderRadius: 2,
    wireframe: true,
  },
}

createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={zhCN} theme={theme}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/apis" element={<ApiListPage />} />
        <Route path="/api/:name" element={<ApiDetailPage />} />
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
)
