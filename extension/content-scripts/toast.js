(function () {
  const ICONS = { leetcode_accepted: '⚡', github_commit: '📦', job_application: '💼' };
  const COLORS = { leetcode_accepted: '#818cf8', github_commit: '#4ade80', job_application: '#fbbf24' };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'show_toast') return;

    const { activityType, title, coins } = message;
    const icon = ICONS[activityType] || '🪙';
    const accent = COLORS[activityType] || '#818cf8';

    const existing = document.getElementById('pi-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pi-toast';
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="
          width:38px;height:38px;border-radius:10px;
          background:${accent}22;border:1px solid ${accent}44;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;flex-shrink:0
        ">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:#64748b;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Coins Earned</div>
          <div style="font-weight:700;font-size:13px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
        </div>
        <div style="
          font-size:15px;font-weight:800;color:#fbbf24;
          background:#1c1a0e;border:1px solid #3d3200;
          border-radius:999px;padding:3px 10px;white-space:nowrap;flex-shrink:0
        ">+${coins} 🪙</div>
      </div>
      <div style="
        position:absolute;bottom:0;left:0;height:2px;border-radius:0 0 14px 14px;
        background:${accent};width:100%;
        animation:pi-shrink 4s linear forwards
      "></div>
      <style>
        @keyframes pi-shrink { from { width:100% } to { width:0% } }
      </style>
    `;

    Object.assign(toast.style, {
      position: 'fixed',
      top: '-120px',
      right: '20px',
      zIndex: '2147483647',
      background: '#111827',
      border: '1px solid #1e293b',
      borderRadius: '14px',
      padding: '12px 14px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      transition: 'top 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)',
      minWidth: '260px',
      maxWidth: '320px',
      overflow: 'hidden',
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      toast.style.top = '20px';
    }));

    setTimeout(() => {
      toast.style.transition = 'top 0.3s ease-in, opacity 0.3s ease-in';
      toast.style.opacity = '0';
      toast.style.top = '-120px';
      setTimeout(() => toast.remove(), 350);
    }, 4200);
  });
})();
