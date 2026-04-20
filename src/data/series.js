import { mulberry32 } from './utils';
import { DIMENSIONS, DTYPES } from './constants';
import { APIS } from './apis';
import { overallAlignment, dimRate, apiConsistencyRate } from './metrics';

export const TREND_30D = (() => {
  const arr = [];
  const endRate = overallAlignment(APIS).rate;
  const startRate = Math.max(0.1, endRate - 0.08);
  const dimEndRates = {};
  const dimStartRates = {};
  DIMENSIONS.forEach(d => {
    dimEndRates[d.key] = dimRate(APIS, d.key);
    dimStartRates[d.key] = Math.max(0.1, dimEndRates[d.key] - 0.08);
  });
  const endConsistency = apiConsistencyRate(APIS);
  const startConsistency = Math.max(0.05, endConsistency - 0.10);
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const base = startRate + (endRate - startRate) * (t * t * (3 - 2 * t));
    const noise = (mulberry32(100 + i)() - 0.5) * 0.006;
    const entry = {
      day: i,
      rate:     Math.max(0, Math.min(1, base + noise)),
      weighted: Math.max(0, Math.min(1, base + 0.07 + noise)),
      newlyAligned: Math.floor(3 + mulberry32(200 + i)() * 14),
      newlyFailed:  Math.floor(mulberry32(300 + i)() * 4),
    };
    DIMENSIONS.forEach(d => {
      const dimBase = dimStartRates[d.key] + (dimEndRates[d.key] - dimStartRates[d.key]) * (t * t * (3 - 2 * t));
      const dimNoise = (mulberry32(d.key.charCodeAt(0) * 100 + i)() - 0.5) * 0.006;
      entry[d.key] = Math.max(0, Math.min(1, dimBase + dimNoise));
    });
    const conBase = startConsistency + (endConsistency - startConsistency) * (t * t * (3 - 2 * t));
    const conNoise = (mulberry32(999 + i)() - 0.5) * 0.005;
    entry.apiConsistency = Math.max(0, Math.min(1, conBase + conNoise));
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

export const VELOCITY = Array.from({ length: 12 }, (_, i) => ({
  week:     i,
  aligned:  Math.floor(8 + mulberry32(i + 500)() * 18 + i * 0.8),
  fixing:  -Math.floor(2 + mulberry32(i + 600)() * 5),
  reviewed: Math.floor(3 + mulberry32(i + 700)() * 6),
}));
