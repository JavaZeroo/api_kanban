export const MODULES = [
  { key: 'torch',              name: 'torch',           weight: 58 },
  { key: 'torch.Tensor',       name: 'torch.Tensor',    weight: 62 },
  { key: 'torch.nn',           name: 'torch.nn',        weight: 45 },
  { key: 'torch.nn.functional',name: 'torch.nn.functional', weight: 38 },
  { key: 'torch.linalg',       name: 'torch.linalg',    weight: 22 },
  { key: 'torch.fft',          name: 'torch.fft',       weight: 14 },
  { key: 'torch.distributions',name: 'torch.distributions', weight: 18 },
  { key: 'torch.cuda',         name: 'torch.cuda→npu',  weight: 16 },
];

export const STATUS_META = {
  aligned:     { label: '完全对齐',    short: '对齐', hint: 'Fully aligned' },
  reviewed:    { label: '差异·已评审', short: '已评', hint: 'Reviewed' },
  fixing:      { label: '差异·待修复', short: '待修', hint: 'Fixing' },
  unsupported: { label: '不支持',      short: '不支', hint: 'Unsupported' },
  untested:    { label: '未测试',      short: '未测', hint: 'Untested' },
};

export const DIMENSIONS = [
  { key: 'func', name: '功能',   letter: 'F', desc: '计算结果与 CUDA 一致' },
  { key: 'prec', name: '精度',   letter: 'P', desc: '数值误差在可接受范围内' },
  { key: 'mem',  name: '内存',   letter: 'M', desc: '内存模式与 CUDA 一致' },
  { key: 'det',  name: '确定性', letter: 'D', desc: '相同输入多次运行一致' },
];

export const DTYPES = ['fp32', 'fp16', 'bf16', 'fp8', 'int8', 'int32', 'int64', 'bool', 'complex64'];
