import { Card } from 'antd';
import { PixelMatrix, ImpactScatter, DtypeMatrix } from '../charts';
import { colors } from '../components/EChart';

export default function MatrixSection({ filtered, onFocus }) {
  return (
    <>
      <div className="sec-head">
        <span className="idx">§2</span>
        <div>
          <span className="title">全量 API × 维度矩阵</span>
          <span className="sub">每格 4 象限 = 功能↖ 精度↗ 内存↙ 确定性↘</span>
        </div>
        <div className="pxmat-legend">
          <span><span className="swatch" style={{ background: colors.aligned }} />完全对齐</span>
          <span><span className="swatch" style={{ background: colors.reviewed }} />已评审</span>
          <span><span className="swatch" style={{ background: colors.fixing }} />待修复</span>
          <span><span className="swatch" style={{ background: colors.unsupported }} />不支持</span>
          <span><span className="swatch" style={{ background: colors.untested, border: '1px solid ' + colors.line }} />未测</span>
        </div>
      </div>
      <div className="mat-main">
        <div className="mat-left">
          <div style={{ padding: '12px 16px' }}>
            <PixelMatrix apis={filtered} onFocus={onFocus} />
          </div>
        </div>
        <div className="mat-right">
          <Card className="block" bordered={false} bodyStyle={{ padding: '14px 16px' }}>
            <div className="block-header">
              <div className="block-title">影响散点 <b>频次 × 对齐</b></div>
              <div className="block-meta">红色区=最需关注</div>
            </div>
            <ImpactScatter apis={filtered} onFocus={onFocus} />
          </Card>
          <Card className="block" bordered={false} bodyStyle={{ padding: '14px 16px' }}>
            <div className="block-header">
              <div className="block-title">dtype 精度对齐 <b>4 × 9</b></div>
              <div className="block-meta">单元格=对齐率 %</div>
            </div>
            <DtypeMatrix />
          </Card>
        </div>
      </div>
    </>
  );
}
