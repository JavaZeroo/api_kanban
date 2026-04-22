import { mulberry32 } from './utils';
import { DIMENSIONS, DTYPES } from './constants';
import { APIS } from './apis';
import { overallAlignment, dimRate, apiConsistencyRate, weightedAlignment } from './metrics';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);
const CONSISTENCY_GAP = 0.01;
const DIM_TREND_GAIN = {
  func: [0.13, 0.18],
  prec: [0.11, 0.16],
  mem: [0.09, 0.13],
  det: [0.07, 0.11],
};

function randomRisingValues(length, start, end) {
  if (length <= 1) return [end];
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const steps = Array.from({ length: length - 1 }, (_, i) => {
    const t = i / Math.max(1, length - 2);
    const middleBoost = 0.85 + Math.sin(t * Math.PI) * 0.25;
    return randomBetween(0.75, 1.35) * middleBoost;
  });
  const total = steps.reduce((sum, step) => sum + step, 0);
  let acc = 0;

  return [
    from,
    ...steps.map(step => {
      acc += step;
      return from + (to - from) * (acc / total);
    }),
  ];
}

function historyEndingAt(endRate, minGain, maxGain) {
  const end = clamp(endRate, 0, 0.98);
  const headroom = Math.max(0, end - 0.02);
  const min = Math.min(minGain, headroom);
  const max = Math.min(maxGain, headroom);
  const gain = max > min ? randomBetween(min, max) : min;
  return randomRisingValues(30, end - gain, end).map(v => clamp(v));
}

export const TREND_30D = (() => {
  const arr = [];
  const endRate = overallAlignment(APIS).rate;
  const weightedEndRate = weightedAlignment(APIS).rate;
  const rateTrend = historyEndingAt(endRate, 0.10, 0.16);
  const weightedTrend = historyEndingAt(weightedEndRate, 0.12, 0.18);
  const dimTrends = Object.fromEntries(
    DIMENSIONS.map(d => {
      const [minGain, maxGain] = DIM_TREND_GAIN[d.key] ?? [0.09, 0.15];
      return [d.key, historyEndingAt(dimRate(APIS, d.key), minGain, maxGain)];
    })
  );
  const consistencyTrend = historyEndingAt(apiConsistencyRate(APIS), 0.03, 0.06);
  const newlyAlignedTrend = randomRisingValues(30, randomBetween(4, 7), randomBetween(13, 20));

  for (let i = 0; i < 30; i++) {
    const entry = {
      day: i,
      rate: rateTrend[i],
      weighted: weightedTrend[i],
      newlyAligned: Math.round(newlyAlignedTrend[i]),
      newlyFailed: Math.floor(randomBetween(0, 3)),
    };
    DIMENSIONS.forEach(d => {
      entry[d.key] = dimTrends[d.key][i];
    });
    const lowestDimension = Math.min(...DIMENSIONS.map(d => entry[d.key]));
    entry.apiConsistency = clamp(Math.min(consistencyTrend[i], lowestDimension - CONSISTENCY_GAP));
    arr.push(entry);
  }
  return arr;
})();

export const REPOS = [
  { name: 'huggingface/transformers', stars: '138k', apiUsed: 284, apiAligned: 258 },
  { name: 'huggingface/diffusers',    stars: '28k',  apiUsed: 196, apiAligned: 184 },
  { name: 'pytorch/torchvision',      stars: '16k',  apiUsed: 148, apiAligned: 141 },
  { name: 'vllm-project/vllm',        stars: '41k',  apiUsed: 172, apiAligned: 139 },
  { name: 'hpcaitech/ColossalAI',     stars: '39k',  apiUsed: 218, apiAligned: 178 },
  { name: 'facebookresearch/llama',   stars: '56k',  apiUsed: 94,  apiAligned: 88  },
  { name: 'OpenBMB/MiniCPM',          stars: '7k',   apiUsed: 128, apiAligned: 118 },
  { name: 'stanford-crfm/levanter',   stars: '2k',   apiUsed: 112, apiAligned: 97  },
  { name: 'karpathy/nanoGPT',         stars: '39k',  apiUsed: 38,  apiAligned: 38  },
  { name: 'Mozilla-Ocho/llamafile',   stars: '20k',  apiUsed: 76,  apiAligned: 65  },
];
REPOS.forEach(r => { r.rate = r.apiAligned / r.apiUsed; r.missing = r.apiUsed - r.apiAligned; });

export const DTYPE_MATRIX = (() => {
  return DIMENSIONS.map(d => {
    const cells = {};
    DTYPES.forEach((dt, i) => {
      const base = d.key === 'prec' ? 0.56 : d.key === 'mem' ? 0.7 : 0.78;
      const penalty = dt === 'fp8' ? 0.35 : dt === 'complex64' ? 0.25 : dt === 'int8' ? 0.12 : dt === 'bf16' ? 0.05 : 0;
      const r0 = mulberry32(d.key.charCodeAt(0) + i)();
      cells[dt] = Math.max(0.05, Math.min(0.99, base - penalty + (r0 - 0.5) * 0.1));
    });
    return { dim: d, cells };
  });
})();

export const DIFF_FEED = [
  { type:'add', t:'14:32', api:'torch.nn.functional.scaled_dot_product_attention', dim:'func', from:'fixing',   to:'aligned',  usr:'lihua'    },
  { type:'mod', t:'14:18', api:'Tensor.to',                                        dim:'prec', from:'fixing',   to:'reviewed', usr:'zhangsan'  },
  { type:'add', t:'14:02', api:'torch.matmul',                                     dim:'mem',  from:'untested', to:'aligned',  usr:'CI-Bot'   },
  { type:'add', t:'13:55', api:'torch.linalg.svd',                                 dim:'prec', from:'fixing',   to:'reviewed', usr:'wangwei'   },
  { type:'add', t:'13:40', api:'torch.fft.fft2',                                   dim:'mem',  from:'untested', to:'aligned',  usr:'chenyu'    },
  { type:'del', t:'13:21', api:'torch.distributions.Normal',                       dim:'prec', from:'aligned',  to:'fixing',   usr:'zhaogang'  },
  { type:'add', t:'12:11', api:'torch.nn.LayerNorm',                               dim:'det',  from:'untested', to:'aligned',  usr:'liumei'    },
  { type:'add', t:'11:48', api:'torch.bmm',                                        dim:'func', from:'untested', to:'aligned',  usr:'CI-Bot'   },
  { type:'mod', t:'11:22', api:'torch.nn.MultiheadAttention',                      dim:'prec', from:'fixing',   to:'reviewed', usr:'zhangsan'  },
  { type:'del', t:'10:47', api:'torch.cumsum',                                     dim:'det',  from:'aligned',  to:'fixing',   usr:'lihua'     },
  { type:'add', t:'10:11', api:'torch.nn.functional.gelu',                         dim:'prec', from:'fixing',   to:'aligned',  usr:'CI-Bot'   },
  { type:'add', t:'09:47', api:'Tensor.scatter_',                                  dim:'func', from:'untested', to:'aligned',  usr:'chenyu'    },
];

export const L0_CRITICAL = APIS.filter(a => a.level === 'L0').slice(0, 14).map(a => ({
  ...a,
  bias: a.name === 'torch.matmul' || a.name === 'Tensor.to' ? 'aligned' : null,
}));

const weeklyAligned = randomRisingValues(12, randomBetween(8, 12), randomBetween(26, 34));
const weeklyReviewed = randomRisingValues(12, randomBetween(3, 5), randomBetween(10, 14));

export const VELOCITY = Array.from({ length: 12 }, (_, i) => ({
  week: i,
  aligned: Math.round(weeklyAligned[i]),
  fixing: -Math.floor(randomBetween(1, 4)),
  reviewed: Math.round(weeklyReviewed[i]),
}));
