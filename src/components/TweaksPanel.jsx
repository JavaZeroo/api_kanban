import { Drawer, Form, Switch } from 'antd';

export default function TweaksPanel({ tweaksOn, tweaks, setTweak }) {
  return (
    <Drawer
      title="Tweaks"
      placement="right"
      open={tweaksOn}
      onClose={() => {}}
      mask={false}
      width={260}
      styles={{ body: { padding: 16 } }}
      style={{ top: 56 }}
      closable={false}
    >
      <Form layout="vertical" size="small">
        <Form.Item>
          <Switch
            checked={tweaks.showCudaBaseline}
            onChange={(v) => setTweak('showCudaBaseline', v)}
          />{' '}
          <span style={{ marginLeft: 8 }}>CUDA 基准线</span>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
