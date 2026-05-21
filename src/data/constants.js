export const STATUS_META = {
  aligned:     { label: '完全对齐',    short: '对齐', hint: 'Fully aligned' },
  reviewed:    { label: '旧标准对齐',  short: '已评审', hint: 'Legacy aligned' },
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
