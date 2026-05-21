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
  { name: 'huggingface/transformers',  stars: '138k', apiUsed: 485, apiAligned: 459 },
  { name: 'langchain-ai/langchain',  stars: '107k', apiUsed: 1, apiAligned: 1 },
  { name: 'comfyanonymous/ComfyUI',  stars: '78k', apiUsed: 287, apiAligned: 266 },
  { name: 'hiyouga/LLaMA-Factory',  stars: '48k', apiUsed: 86, apiAligned: 82 },
  { name: 'microsoft/autogen',  stars: '44k', apiUsed: 2, apiAligned: 2 },
  { name: 'vllm-project/vllm',  stars: '41k', apiUsed: 447, apiAligned: 427 },
  { name: 'hpcaitech/ColossalAI',  stars: '39k', apiUsed: 467, apiAligned: 446 },
  { name: 'unslothai/unsloth',  stars: '38k', apiUsed: 108, apiAligned: 104 },
  { name: 'microsoft/DeepSpeed',  stars: '36k', apiUsed: 386, apiAligned: 377 },
  { name: 'huggingface/accelerate',  stars: '36k', apiUsed: 192, apiAligned: 190 },
  { name: 'Lightning-AI/pytorch-lightning',  stars: '29k', apiUsed: 329, apiAligned: 320 },
  { name: 'huggingface/diffusers',  stars: '28k', apiUsed: 362, apiAligned: 337 },
  { name: 'lucidrains/vit-pytorch',  stars: '21k', apiUsed: 86, apiAligned: 80 },
  { name: 'huggingface/datasets',  stars: '20k', apiUsed: 14, apiAligned: 14 },
  { name: 'onnx/onnx',  stars: '19k', apiUsed: 2, apiAligned: 1 },
  { name: 'huggingface/peft',  stars: '18k', apiUsed: 217, apiAligned: 207 },
  { name: 'pytorch/vision',  stars: '16k', apiUsed: 313, apiAligned: 297 },
  { name: 'sgl-project/sglang',  stars: '14k', apiUsed: 419, apiAligned: 395 },
  { name: 'huggingface/trl',  stars: '13k', apiUsed: 137, apiAligned: 130 },
  { name: 'NVIDIA/Megatron-LM',  stars: '12k', apiUsed: 373, apiAligned: 361 },
  { name: 'modelscope/FunASR',  stars: '11k', apiUsed: 247, apiAligned: 231 },
  { name: 'oumi-ai/oumi',  stars: '9k', apiUsed: 106, apiAligned: 102 },
  { name: 'EleutherAI/lm-evaluation-harness',  stars: '8k', apiUsed: 31, apiAligned: 31 },
  { name: 'pytorch/tensordict',  stars: '8k', apiUsed: 299, apiAligned: 294 },
  { name: 'volcengine/verl',  stars: '8k', apiUsed: 221, apiAligned: 208 },
  { name: 'modelscope/ms-swift',  stars: '7k', apiUsed: 176, apiAligned: 169 },
  { name: 'pytorch/torchtune',  stars: '6k', apiUsed: 272, apiAligned: 265 },
  { name: 'open-compass/opencompass',  stars: '6k', apiUsed: 30, apiAligned: 29 },
  { name: 'OpenRLHF/OpenRLHF',  stars: '6k', apiUsed: 68, apiAligned: 64 },
  { name: 'Vchitect/VBench',  stars: '5k', apiUsed: 299, apiAligned: 278 },
  { name: 'InternLM/xtuner',  stars: '5k', apiUsed: 251, apiAligned: 241 },
  { name: 'modelscope/data-juicer',  stars: '5k', apiUsed: 64, apiAligned: 62 },
  { name: 'hpcaitech/Open-Sora',  stars: '23k', apiUsed: 150, apiAligned: 142 },
  { name: 'alibaba/Pai-Megatron-Patch',  stars: '3k', apiUsed: 182, apiAligned: 172 },
  { name: 'open-compass/VLMEvalKit',  stars: '3k', apiUsed: 125, apiAligned: 117 },
  { name: 'pytorch/torchtitan',  stars: '3k', apiUsed: 209, apiAligned: 204 },
  { name: 'vllm-project/vllm-ascend',  stars: '2k', apiUsed: 136, apiAligned: 129 },
  { name: 'ByteDance-Seed/VeOmni',  stars: '2k', apiUsed: 242, apiAligned: 226 },
  { name: 'kvcache-ai/Mooncake',  stars: '2k', apiUsed: 48, apiAligned: 45 },
  { name: 'huggingface/lighteval',  stars: '2k', apiUsed: 35, apiAligned: 34 },
  { name: 'huggingface/evaluate',  stars: '2k', apiUsed: 10, apiAligned: 10 },
  { name: 'inclusionAI/AReaL',  stars: '1k', apiUsed: 211, apiAligned: 200 },
  { name: 'pytorch/data',  stars: '1k', apiUsed: 105, apiAligned: 102 },
  { name: 'modelscope/Trinity-RFT',  stars: '1k', apiUsed: 72, apiAligned: 70 },
  { name: 'MoonshotAI/checkpoint-engine',  stars: '1k', apiUsed: 21, apiAligned: 20 },
  { name: 'Ascend/MindSpeed-MM',  stars: '—', apiUsed: 275, apiAligned: 258 },
  { name: 'sii-research/siiRL',  stars: '—', apiUsed: 181, apiAligned: 172 },
  { name: 'RLinf/RLinf',  stars: '—', apiUsed: 184, apiAligned: 178 },
  { name: 'Ascend/MindSpeed-LLM',  stars: '—', apiUsed: 183, apiAligned: 173 },
  { name: 'alibaba/ROLL',  stars: '—', apiUsed: 166, apiAligned: 158 },
  { name: 'alibaba/ChatLearn',  stars: '—', apiUsed: 112, apiAligned: 109 },
  { name: 'THUDM/slime',  stars: '—', apiUsed: 101, apiAligned: 100 },
  { name: 'Ascend/MindSpeed-RL',  stars: '—', apiUsed: 96, apiAligned: 90 },
  { name: 'VTOOL-R1/vtool-r1',  stars: '—', apiUsed: 86, apiAligned: 81 },
  { name: 'modelscope/RM-Gallery',  stars: '—', apiUsed: 23, apiAligned: 23 },
  { name: 'pytorch/dynamo',  stars: '—', apiUsed: 14, apiAligned: 13 },
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
  { type:'del', t:'13:21', api:'torch.nn.functional.conv1d',                          dim:'prec', from:'aligned',  to:'fixing',   usr:'zhaogang'  },
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
