const LEVELS = [
  { key: 'L0', label: 'L0', hint: '关键' },
  { key: 'L1', label: 'L1', hint: '重要' },
  { key: 'L2', label: 'L2', hint: '一般' },
];

export default function LevelFilter({ levels, onToggle, counts = {} }) {
  return (
    <div className="level-filter" role="group" aria-label="API 等级筛选">
      {LEVELS.map(lv => {
        const active = levels.has(lv.key);
        return (
          <button
            key={lv.key}
            type="button"
            className={active ? 'active' : ''}
            aria-pressed={active}
            onClick={() => onToggle(lv.key)}
            title={`${lv.label} · ${lv.hint}`}
          >
            <span>{lv.label}</span>
            <b>{(counts[lv.key] || 0).toLocaleString()}</b>
          </button>
        );
      })}
    </div>
  );
}
