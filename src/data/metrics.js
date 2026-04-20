import { DIMENSIONS } from './constants';

export function tally(apis, dimKey) {
  const t = { aligned: 0, reviewed: 0, fixing: 0, unsupported: 0, untested: 0 };
  apis.forEach(a => t[a.dims[dimKey]]++);
  return t;
}

export function overallAlignment(apis) {
  let aligned = 0, total = 0;
  apis.forEach(a =>
    DIMENSIONS.forEach(d => {
      total++;
      if (a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed') aligned++;
    })
  );
  return { aligned, total, rate: total ? aligned / total : 0 };
}

export function dimRate(apis, dimKey) {
  const t = tally(apis, dimKey);
  const aligned = t.aligned + t.reviewed;
  const total = t.aligned + t.reviewed + t.fixing + t.unsupported + t.untested;
  return total ? aligned / total : 0;
}

export function apiConsistencyRate(apis) {
  let aligned = 0;
  apis.forEach(a => {
    if (DIMENSIONS.every(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed')) aligned++;
  });
  return apis.length ? aligned / apis.length : 0;
}

export function weightedAlignment(apis) {
  let w = 0, wa = 0;
  apis.forEach(a => {
    const allAligned = DIMENSIONS.every(d => {
      const s = a.dims[d.key];
      return s === 'aligned' || s === 'reviewed';
    });
    w += a.freq;
    if (allAligned) wa += a.freq;
  });
  return { rate: w ? wa / w : 0, total: w, aligned: wa };
}

export function moduleRate(apis, modKey) {
  const list = apis.filter(a => a.module === modKey);
  let a = 0, t = 0, w = 0, wa = 0;
  list.forEach(x => {
    DIMENSIONS.forEach(d => {
      t++;
      if (x.dims[d.key] === 'aligned' || x.dims[d.key] === 'reviewed') a++;
    });
    const allOk = DIMENSIONS.every(d => x.dims[d.key] === 'aligned' || x.dims[d.key] === 'reviewed');
    w += x.freq;
    if (allOk) wa += x.freq;
  });
  return { count: list.length, a, t, rate: t ? a / t : 0, wrate: w ? wa / w : 0 };
}
