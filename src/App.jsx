import { useState, useMemo, useEffect } from 'react';
import { APIS } from './data';
import { HeroSection, DimSection, MatrixSection, TrendSection, RepoSection } from './sections';
import Topbar from './components/Topbar';
import FocusCard from './components/FocusCard';
import TweaksPanel from './components/TweaksPanel';

const TWEAKS_DEFAULTS = { matrixDensity: 'dense', showCudaBaseline: true };

export default function App() {
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState(null);
  const [tweaksOn, setTweaksOn] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULTS);

  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOn(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => {
    setTweaks(t => ({ ...t, [k]: v }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return APIS;
    const q = search.toLowerCase();
    return APIS.filter(a => a.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <>
      <Topbar search={search} setSearch={setSearch} />
      <HeroSection filtered={filtered} />
      <DimSection filtered={filtered} />
      <MatrixSection filtered={filtered} onFocus={setFocus} />
      <TrendSection />
      <RepoSection onFocus={setFocus} />
      <FocusCard focus={focus} onClose={() => setFocus(null)} />
      <TweaksPanel tweaksOn={tweaksOn} tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}
