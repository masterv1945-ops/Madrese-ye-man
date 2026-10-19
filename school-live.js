/*! مدرسهٔ من — لایهٔ زندهٔ مشترک: ابزارها، اعلان‌ها، پیام‌رسان، برنامهٔ هفتگی و جلوه‌ها */
(function (global) {
  'use strict';
  if (global.SchoolLive) return;

  /* ============ ابزارهای کوچک ============ */
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (v) => String(v).replace(/\d/g, (d) => FA[d]);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const uuid = () => (global.crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
  const debounce = (fn, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); }; };
  const throttle = (fn, ms) => { let last = 0; return function () { const n = Date.now(); if (n - last >= ms) { last = n; fn.apply(this, arguments); } }; };
  const ROLE_FA = { manager: 'مدیر', teacher: 'معلم', student: 'دانش‌آموز', parent: 'والد' };
  const faTime = (iso) => fa(new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const DAY_FMT = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long' });
  const SHORT_FMT = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'short' });
  const faDay = (iso) => DAY_FMT.format(new Date(iso));
  const dayKey = (iso) => { const d = new Date(iso); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  function relTime(iso) {
    const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (s < 45) return 'همین الان';
    if (s < 3600) return fa(Math.max(1, Math.round(s / 60))) + ' دقیقه پیش';
    const now = new Date();
    if (dayKey(iso) === dayKey(now.toISOString())) return faTime(iso);
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (dayKey(iso) === dayKey(y.toISOString())) return 'دیروز';
    return SHORT_FMT.format(d);
  }
  function hueOf(str) { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; }
  const colorOf = (str) => 'hsl(' + hueOf(str) + ' 58% 46%)';
  const initials = (name) => { const p = String(name || '؟').trim().split(/\s+/); return (p[0][0] || '؟') + (p[1] ? '\u200c' + p[1][0] : ''); };
  function linkify(text) {
    return esc(text).replace(/(https?:\/\/[^\s<]+)/g, (u) => {
      const clean = u.replace(/[.,;:!?)\]]+$/, ''); const tail = u.slice(clean.length);
      return '<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' + clean + '</a>' + tail;
    }).replace(/\n/g, '<br>');
  }
  const bytes = (n) => (n < 1024 ? fa(n) + ' بایت' : n < 1048576 ? fa(Math.round(n / 1024)) + ' کیلوبایت' : fa((n / 1048576).toFixed(1)) + ' مگابایت');
  const ICON = (name) => ({ bell: '🔔', chat: '💬', check: '✓' }[name] || '');

  function injectCSS(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
  }

  /* ============ تنظیمات کاربر ============ */
  const PREF_KEY = 'schoolpanel.live';
  const prefs = (() => { try { return Object.assign({ sound: true, desktop: false }, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { return { sound: true, desktop: false }; } })();
  const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };

  /* ============ استایل پایه (اعلان‌های شناور، نشان‌ها، مرکز اعلان) ============ */
  injectCSS('sl-base-css', `
.sl-toasts{position:fixed;z-index:99990;top:14px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:10px;width:min(440px,calc(100vw - 24px));pointer-events:none;direction:rtl}
.sl-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:var(--surface,#fff);color:var(--ink,#12313a);border:1px solid var(--line,#dfeaea);box-shadow:var(--shadow-lg,0 18px 44px rgba(8,60,70,.22));cursor:pointer;opacity:0;transform:translateY(-18px) scale(.96);transition:opacity .32s var(--ease,ease),transform .45s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sl-toast.in{opacity:1;transform:none}.sl-toast.out{opacity:0;transform:translateY(-12px) scale(.97)}
.sl-toast-ico{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:21px;background:var(--teal-soft,#e4f6f6)}
.sl-toast-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.sl-toast-txt b{font-size:14px;font-weight:800}
.sl-toast-txt span{font-size:13px;color:var(--muted,#5f7a80);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-toast-x{flex:none;border:0;background:transparent;color:var(--muted,#5f7a80);font-size:20px;line-height:1;width:28px;height:28px;border-radius:50%;cursor:pointer}
.sl-toast-x:hover{background:var(--surface2,#f1f7f7)}
.sl-toast-msg .sl-toast-ico{background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86));color:#fff}
.sl-badge{display:none;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--danger,#ef4444);color:#fff;font:800 11px/20px inherit;text-align:center;box-shadow:0 0 0 3px var(--surface,#fff);animation:slBadgePop .5s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sl-badge.show{display:inline-block}
@keyframes slBadgePop{0%{transform:scale(.3)}100%{transform:scale(1)}}
.sl-notif{direction:rtl;display:flex;flex-direction:column;gap:12px}
.sl-notif-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.sl-notif-bar .grp{display:flex;gap:8px;flex-wrap:wrap}
.sl-chip{border:1px solid var(--line,#dfeaea);background:var(--surface,#fff);color:var(--ink,#12313a);border-radius:999px;padding:8px 14px;font:700 13px inherit;cursor:pointer;transition:transform .2s var(--ease,ease),background .2s,box-shadow .2s}
.sl-chip:hover{transform:translateY(-2px);box-shadow:var(--shadow,0 8px 22px rgba(8,60,70,.12))}.sl-chip.on{background:var(--teal-soft,#e4f6f6);border-color:var(--teal,#08b9b8);color:var(--teal-deep,#087f86)}
.sl-notif-item{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:18px;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);cursor:pointer;position:relative;transition:transform .25s var(--ease,ease),box-shadow .25s,border-color .25s;animation:slItemIn .5s var(--ease,ease) both;animation-delay:calc(var(--i,0)*45ms)}
.sl-notif-item:hover{transform:translateY(-2px);box-shadow:var(--shadow,0 8px 22px rgba(8,60,70,.12));border-color:var(--teal,#08b9b8)}
.sl-notif-item.unread{background:linear-gradient(90deg,var(--teal-soft,#e4f6f6),var(--surface,#fff) 70%)}
.sl-notif-item.unread::after{content:"";position:absolute;top:16px;left:16px;width:10px;height:10px;border-radius:50%;background:var(--teal,#08b9b8);box-shadow:0 0 0 0 rgba(var(--brand-rgb,8,185,184),.5);animation:slPulse 2s infinite}
.sl-notif-ico{flex:none;width:44px;height:44px;border-radius:15px;display:grid;place-items:center;font-size:22px;background:var(--surface2,#f1f7f7)}
.sl-notif-main{flex:1;min-width:0}.sl-notif-main b{display:block;font-size:14.5px;margin-bottom:3px}
.sl-notif-main p{margin:0;font-size:13.5px;color:var(--muted,#5f7a80);line-height:1.8}
.sl-notif-main small{display:block;margin-top:6px;font-size:12px;color:var(--muted,#5f7a80)}
.sl-empty{display:grid;place-items:center;text-align:center;gap:6px;padding:46px 18px;color:var(--muted,#5f7a80)}
.sl-empty .big{font-size:46px;animation:slFloat 4s ease-in-out infinite}
@keyframes slItemIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes slPulse{0%{box-shadow:0 0 0 0 rgba(var(--brand-rgb,8,185,184),.55)}70%{box-shadow:0 0 0 10px rgba(var(--brand-rgb,8,185,184),0)}100%{box-shadow:0 0 0 0 rgba(var(--brand-rgb,8,185,184),0)}}
@keyframes slFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.sl-toast,.sl-notif-item,.sl-badge,.sl-empty .big{animation:none!important;transition:none!important}}
`);

  /* ============ اعلان شناور و صدا ============ */
  function toast(o) {
    o = o || {};
    let host = $('.sl-toasts');
    if (!host) { host = document.createElement('div'); host.className = 'sl-toasts'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    while (host.children.length >= 4) host.lastElementChild.remove();
    const el = document.createElement('div');
    el.className = 'sl-toast sl-toast-' + (o.kind || 'info');
    el.innerHTML = '<span class="sl-toast-ico">' + esc(o.icon || '🔔') + '</span><div class="sl-toast-txt"><b>' + esc(o.title || '') + '</b>' + (o.text ? '<span>' + esc(o.text) + '</span>' : '') + '</div><button type="button" class="sl-toast-x" aria-label="بستن">×</button>';
    host.prepend(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    const kill = () => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 360); };
    let timer = setTimeout(kill, o.ms || 5500);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(kill, 2000); });
    el.addEventListener('click', (e) => { if (e.target.closest('.sl-toast-x')) return kill(); if (o.onClick) o.onClick(); kill(); });
    return kill;
  }
  let actx = null;
  function ping(kind) {
    if (!prefs.sound) return;
    try {
      actx = actx || new (global.AudioContext || global.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(kind === 'msg' ? 880 : 660, t);
      o.frequency.exponentialRampToValueAtTime(kind === 'msg' ? 1320 : 990, t + 0.09);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) { /* ignore */ }
  }
  function desktopNotify(title, body, onClick) {
    if (!('Notification' in global) || Notification.permission !== 'granted' || !prefs.desktop || !document.hidden) return;
    try { const n = new Notification(title, { body, tag: 'school-live', dir: 'rtl', lang: 'fa' }); n.onclick = () => { global.focus(); if (onClick) onClick(); n.close(); }; } catch (e) { /* ignore */ }
  }

  /* ============ هستهٔ زنده: نشست، اشتراک‌ها و نشان‌ها ============ */
  const S = { db: null, me: null, opts: {}, ch: null, presenceCh: null, online: new Set(), ready: false, counts: { chat: 0, notif: 0 } };
  const bus = {};
  const on = (ev, fn) => { (bus[ev] = bus[ev] || []).push(fn); return () => { bus[ev] = (bus[ev] || []).filter((f) => f !== fn); }; };
  const emit = (ev, a) => (bus[ev] || []).slice().forEach((fn) => { try { fn(a); } catch (e) { console.error('[SchoolLive]', ev, e); } });

  function setBadge(kind, n) {
    S.counts[kind] = Math.max(0, n | 0);
    $$('[data-school-badge="' + kind + '"]').forEach((el) => {
      el.textContent = S.counts[kind] > 99 ? fa(99) + '+' : fa(S.counts[kind]);
      el.classList.toggle('show', S.counts[kind] > 0);
      if (S.counts[kind] > 0) el.hidden = false;
    });
    emit('badge', { kind, count: S.counts[kind] });
    const total = S.counts.chat + S.counts.notif;
    const base = document.title.replace(/^\(\d+\)\s*|^\([۰-۹]+\)\s*/, '');
    document.title = total > 0 ? '(' + fa(total) + ') ' + base : base;
  }

  async function refreshNotifCount() {
    if (!S.me) return;
    const r = await S.db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', S.me.id).eq('read', false);
    if (!r.error) setBadge('notif', r.count || 0);
  }

  async function onSession(session) {
    if (!session || (S.me && S.me.id === session.user.id)) return;
    const r = await S.db.from('profiles').select('id,full_name,role').eq('id', session.user.id).maybeSingle();
    if (!r.data) return;
    S.me = r.data; S.ready = true;
    subscribe();
    refreshNotifCount();
    emit('ready', S.me);
  }
  function teardown() {
    S.me = null; S.ready = false; S.online = new Set();
    [S.ch, S.presenceCh].forEach((c) => { if (c) { try { S.db.removeChannel(c); } catch (e) { /* ignore */ } } });
    S.ch = S.presenceCh = null; setBadge('chat', 0); setBadge('notif', 0); emit('signout');
  }

  function subscribe() {
    [S.ch, S.presenceCh].forEach((c) => { if (c) { try { S.db.removeChannel(c); } catch (e) { /* ignore */ } } });
    const me = S.me.id, ch = S.db.channel('school-live-' + me);
    const pc = (event, table, filter, cb) => ch.on('postgres_changes', Object.assign({ event, schema: 'public', table }, filter ? { filter } : {}), cb);
    pc('INSERT', 'chat_messages', null, (p) => emit('msg-insert', p.new));
    pc('UPDATE', 'chat_messages', null, (p) => emit('msg-update', p.new));
    pc('INSERT', 'chat_members', 'user_id=eq.' + me, (p) => emit('member-added', p.new));
    pc('DELETE', 'chat_members', 'user_id=eq.' + me, (p) => emit('member-removed', p.old));
    pc('UPDATE', 'chat_rooms', null, (p) => emit('room-update', p.new));
    pc('DELETE', 'chat_rooms', null, (p) => emit('room-delete', p.old));
    pc('INSERT', 'notifications', 'user_id=eq.' + me, (p) => onNotifInsert(p.new));
    ch.subscribe();
    S.ch = ch;
    // حضور آنلاین
    const pr = S.db.channel('school-presence', { config: { presence: { key: me } } });
    const sync = () => { S.online = new Set(Object.keys(pr.presenceState() || {})); emit('presence', S.online); };
    pr.on('presence', { event: 'sync' }, sync);
    pr.subscribe((st) => { if (st === 'SUBSCRIBED') { try { pr.track({ at: Date.now() }); } catch (e) { /* ignore */ } } });
    S.presenceCh = pr;
  }

  /* ============ مرکز اعلان‌ها ============ */
  const NOTIF_ICON = { exam_score: '📝', report_card: '🎓', circular: '📢', channel: '📣', schedule: '🗓️', chat: '💬' };
  const Notif = { items: [], root: null, filter: 'all' };

  function onNotifInsert(row) {
    Notif.items.unshift(row); setBadge('notif', S.counts.notif + 1);
    if (Notif.root) Notif.render(true);
    if (row.type !== 'channel') {
      toast({ title: row.title, text: row.body, icon: NOTIF_ICON[row.type] || '🔔', onClick: () => go(row.type) });
      ping('notif');
      desktopNotify(row.title, row.body, () => go(row.type));
    }
    try { global.dispatchEvent(new CustomEvent('school:notification', { detail: row })); } catch (e) { /* ignore */ }
    emit('notification', row);
  }
  function go(type) { if (S.opts.navigate) S.opts.navigate(type === 'channel' || type === 'chat' ? 'chat' : type); }

  Notif.load = async function () {
    if (!S.me) return;
    const r = await S.db.from('notifications').select('*').eq('user_id', S.me.id).order('created_at', { ascending: false }).limit(80);
    Notif.items = r.data || []; Notif.render();
  };
  Notif.markRead = async function (id) {
    const it = Notif.items.find((x) => String(x.id) === String(id));
    if (!it || it.read) return;
    it.read = true; setBadge('notif', S.counts.notif - 1); Notif.render();
    await S.db.from('notifications').update({ read: true }).eq('id', it.id).eq('user_id', S.me.id);
  };
  Notif.markAll = async function () {
    Notif.items.forEach((x) => { x.read = true; }); setBadge('notif', 0); Notif.render();
    await S.db.from('notifications').update({ read: true }).eq('user_id', S.me.id).eq('read', false);
  };
  Notif.render = function (fresh) {
    const root = Notif.root; if (!root) return;
    const list = Notif.items.filter((x) => Notif.filter === 'all' || (Notif.filter === 'unread' ? !x.read : true));
    const perm = 'Notification' in global ? Notification.permission : 'denied';
    root.innerHTML =
      '<div class="sl-notif"><div class="sl-notif-bar"><div class="grp">' +
      '<button type="button" class="sl-chip ' + (Notif.filter === 'all' ? 'on' : '') + '" data-f="all">همه</button>' +
      '<button type="button" class="sl-chip ' + (Notif.filter === 'unread' ? 'on' : '') + '" data-f="unread">خوانده‌نشده (' + fa(S.counts.notif) + ')</button></div><div class="grp">' +
      '<button type="button" class="sl-chip" data-act="all">علامت‌گذاری همه</button>' +
      '<button type="button" class="sl-chip ' + (prefs.sound ? 'on' : '') + '" data-act="sound">' + (prefs.sound ? '🔊 صدا روشن' : '🔇 صدا خاموش') + '</button>' +
      (perm !== 'denied' && 'Notification' in global ? '<button type="button" class="sl-chip ' + (prefs.desktop && perm === 'granted' ? 'on' : '') + '" data-act="desktop">' + (prefs.desktop && perm === 'granted' ? '🖥️ اعلان مرورگر روشن' : '🖥️ فعال‌سازی اعلان مرورگر') + '</button>' : '') +
      '</div></div>' +
      (list.length ? list.map((n, i) =>
        '<div class="sl-notif-item ' + (n.read ? '' : 'unread') + '" data-id="' + esc(n.id) + '" data-type="' + esc(n.type || '') + '" style="--i:' + (fresh ? 0 : Math.min(i, 14)) + '"><div class="sl-notif-ico">' + (NOTIF_ICON[n.type] || '🔔') + '</div>' +
        '<div class="sl-notif-main"><b>' + esc(n.title) + '</b><p>' + esc(n.body || '') + '</p><small>' + relTime(n.created_at) + '</small></div></div>').join('')
        : '<div class="sl-empty"><div class="big">🔔</div><b>هنوز اعلانی ندارید</b><span>هر خبر تازه همین‌جا و به‌صورت زنده نشان داده می‌شود.</span></div>') +
      '</div>';
  };
  Notif.mount = function (root) {
    if (!root) return;
    Notif.root = root;
    if (!root.dataset.slBound) {
      root.dataset.slBound = '1';
      root.addEventListener('click', async (e) => {
        const f = e.target.closest('[data-f]'); if (f) { Notif.filter = f.dataset.f; return Notif.render(); }
        const a = e.target.closest('[data-act]');
        if (a) {
          if (a.dataset.act === 'all') return Notif.markAll();
          if (a.dataset.act === 'sound') { prefs.sound = !prefs.sound; savePrefs(); if (prefs.sound) ping('notif'); return Notif.render(); }
          if (a.dataset.act === 'desktop') {
            if (Notification.permission !== 'granted') { const p = await Notification.requestPermission(); prefs.desktop = p === 'granted'; } else prefs.desktop = !prefs.desktop;
            savePrefs(); return Notif.render();
          }
        }
        const it = e.target.closest('.sl-notif-item');
        if (it) { await Notif.markRead(it.dataset.id); go(it.dataset.type); }
      });
    }
    if (S.ready) Notif.load(); else on('ready', Notif.load);
  };

  /* ============ رابط عمومی ============ */
  const API = {
    state: S, prefs, on, emit, util: { fa, esc, $, $$, uuid, debounce, throttle, faTime, faDay, dayKey, relTime, colorOf, initials, linkify, bytes, injectCSS, ROLE_FA, ping, toast, desktopNotify, hueOf },
    toast, ping, setBadge,
    mountNotifications: Notif.mount, notifications: Notif,
    init(opts) {
      S.opts = opts || {}; S.db = S.opts.db;
      if (!S.db) { console.warn('SchoolLive.init: db is required'); return; }
      S.db.auth.getSession().then((r) => { if (r && r.data && r.data.session) onSession(r.data.session); });
      S.db.auth.onAuthStateChange((ev, sess) => { setTimeout(() => { if (sess) onSession(sess); else if (ev === 'SIGNED_OUT') teardown(); }, 0); });
    },
  };
  global.SchoolLive = API;
})(window);

/* پیام‌رسان — بخش ۱: ظاهر، وضعیت، فهرست گفتگوها و رویدادهای زنده */
(function (global) {
  'use strict';
  const L = global.SchoolLive;
  if (!L || L._C) return;
  const U = L.util, S = L.state;
  const { fa, esc, $, $$, debounce, relTime, colorOf, initials, ROLE_FA, injectCSS, ping, toast, desktopNotify } = U;

  U.injectCSS('sl-chat-css', `
.sl-chat{--cc:var(--teal,#08b9b8);--cc2:var(--teal2,#17c3c0);--cd:var(--teal-deep,#087f86);position:relative;display:flex;direction:rtl;height:clamp(520px,calc(100dvh - 190px),900px);background:var(--surface,#fff);color:var(--ink,#12313a);border:1px solid var(--line,#dfeaea);border-radius:28px;overflow:hidden;box-shadow:var(--shadow-lg,0 18px 44px rgba(8,60,70,.16));isolation:isolate;font-family:inherit}
.sl-chat *{box-sizing:border-box}
.sl-chat button{font-family:inherit}
.sl-rooms{width:350px;flex:none;display:flex;flex-direction:column;background:var(--surface,#fff);border-inline-end:1px solid var(--line,#dfeaea);min-height:0}
.sl-rooms-head{padding:16px 16px 10px;display:flex;flex-direction:column;gap:12px;background:linear-gradient(180deg,rgba(var(--brand-rgb,8,185,184),.09),transparent)}
.sl-rooms-title{display:flex;align-items:center;justify-content:space-between;gap:10px}
.sl-rooms-title h3{margin:0;font-size:19px;font-weight:900;letter-spacing:-.2px}
.sl-iconbtn{border:0;width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:19px;cursor:pointer;color:var(--cd);background:var(--teal-soft,#e4f6f6);transition:transform .25s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)),background .2s,box-shadow .2s}
.sl-iconbtn:hover{transform:scale(1.1) rotate(-4deg);box-shadow:0 8px 20px rgba(var(--brand-rgb,8,185,184),.28)}.sl-iconbtn:active{transform:scale(.94)}
.sl-iconbtn.solid{color:#fff;background:linear-gradient(135deg,var(--cc2),var(--cd))}
.sl-search{position:relative}.sl-search input{width:100%;height:44px;border-radius:15px;border:1.5px solid var(--line,#dfeaea);background:var(--surface2,#f1f7f7);color:inherit;padding:0 42px 0 14px;font:600 14px inherit;outline:0;transition:border-color .2s,box-shadow .2s,background .2s}
.sl-search input:focus{border-color:var(--cc);background:var(--surface,#fff);box-shadow:0 0 0 4px rgba(var(--brand-rgb,8,185,184),.16)}
.sl-search i{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-style:normal;opacity:.55}
.sl-filters{display:flex;gap:8px;overflow-x:auto;padding:2px 0 4px;scrollbar-width:none}.sl-filters::-webkit-scrollbar{display:none}
.sl-filters button{flex:none;border:1px solid var(--line,#dfeaea);background:var(--surface,#fff);color:var(--muted,#5f7a80);border-radius:999px;padding:7px 14px;font:800 12.5px inherit;cursor:pointer;transition:all .25s var(--ease,ease)}
.sl-filters button.on{background:linear-gradient(135deg,var(--cc2),var(--cd));color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(var(--brand-rgb,8,185,184),.3)}
.sl-room-list{flex:1;overflow-y:auto;padding:6px 10px 14px;display:flex;flex-direction:column;gap:4px;min-height:0;scrollbar-width:thin}
.sl-room{display:flex;gap:12px;align-items:center;width:100%;text-align:right;padding:11px 12px;border:0;background:transparent;border-radius:18px;cursor:pointer;color:inherit;position:relative;transition:background .2s,transform .25s var(--ease,ease);animation:slItemIn .45s var(--ease,ease) both;animation-delay:calc(var(--i,0)*35ms)}
.sl-room:hover{background:var(--surface2,#f1f7f7);transform:translateX(-3px)}
.sl-room.active{background:var(--teal-soft,#e4f6f6)}
.sl-room.active::before{content:"";position:absolute;right:0;top:20%;bottom:20%;width:4px;border-radius:4px;background:linear-gradient(180deg,var(--cc2),var(--cd))}
.sl-av{position:relative;flex:none;width:50px;height:50px;border-radius:18px;display:grid;place-items:center;color:#fff;font-weight:900;font-size:17px;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));box-shadow:0 8px 18px color-mix(in srgb,var(--c) 40%,transparent)}
.sl-av-room{font-size:23px}
.sl-av .dot{position:absolute;bottom:-2px;left:-2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid var(--surface,#fff);animation:slPulseG 2.4s infinite}
@keyframes slPulseG{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.sl-room-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.sl-room-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.sl-room-top b{font-size:14.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-room-top time{flex:none;font-size:11.5px;color:var(--muted,#5f7a80)}
.sl-room-sub{display:flex;justify-content:space-between;gap:8px;align-items:center}
.sl-prev{font-size:13px;color:var(--muted,#5f7a80);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-prev.typing{color:var(--cc);font-weight:800}
.sl-unread{flex:none;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:linear-gradient(135deg,var(--cc2),var(--cd));color:#fff;font:900 11.5px/22px inherit;text-align:center;animation:slBadgePop .45s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sl-unread.muted{background:var(--muted,#8aa0a5)}
.sl-tag{flex:none;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--surface2,#f1f7f7);color:var(--muted,#5f7a80)}
.sl-conv{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;position:relative;background:radial-gradient(circle at 12% 8%,rgba(var(--brand-rgb,8,185,184),.09),transparent 38%),radial-gradient(circle at 88% 92%,rgba(124,92,255,.07),transparent 40%),var(--bg,#f3f8f8)}
.sl-conv-empty{margin:auto;text-align:center;display:grid;gap:10px;padding:30px;color:var(--muted,#5f7a80)}
.sl-conv-empty .big{font-size:72px;animation:slFloat 4.5s ease-in-out infinite;filter:drop-shadow(0 14px 18px rgba(var(--brand-rgb,8,185,184),.3))}
.sl-conv-empty b{color:var(--ink,#12313a);font-size:18px}
.sl-head{display:flex;align-items:center;gap:12px;padding:12px 16px;background:color-mix(in srgb,var(--surface,#fff) 86%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line,#dfeaea);z-index:3}
.sl-head .sl-av{width:44px;height:44px;border-radius:15px;font-size:15px}
.sl-head-main{flex:1;min-width:0;cursor:pointer}.sl-head-main b{display:block;font-size:15.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-head-main span{font-size:12.5px;color:var(--muted,#5f7a80)}.sl-head-main span.typing{color:var(--cc);font-weight:800}
.sl-back{display:none}
.sl-pinbar{display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--teal-soft,#e4f6f6);border-bottom:1px solid var(--line,#dfeaea);cursor:pointer;font-size:13px;animation:slItemIn .4s both}
.sl-pinbar b{color:var(--cd)}.sl-pinbar span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink,#12313a)}
.sl-msgs{flex:1;min-height:0;overflow-y:auto;padding:16px 18px 10px;display:flex;flex-direction:column;gap:3px;scroll-behavior:smooth;scrollbar-width:thin}
.sl-day{align-self:center;margin:12px 0 8px;padding:5px 14px;border-radius:999px;background:color-mix(in srgb,var(--surface,#fff) 82%,transparent);border:1px solid var(--line,#dfeaea);font-size:12px;font-weight:800;color:var(--muted,#5f7a80);backdrop-filter:blur(8px)}
.sl-more{align-self:center;border:1px solid var(--line,#dfeaea);background:var(--surface,#fff);color:var(--cd);border-radius:999px;padding:7px 16px;font:800 12.5px inherit;cursor:pointer;margin-bottom:8px}
.sl-msg{display:flex;gap:8px;max-width:100%;align-items:flex-end;position:relative;margin-top:8px}
.sl-msg.grouped{margin-top:1px}
.sl-msg.mine{flex-direction:row-reverse;justify-content:flex-start;align-self:flex-start}
.sl-msg.theirs{align-self:flex-end}
.sl-msg .sl-av{width:34px;height:34px;border-radius:12px;font-size:12.5px;box-shadow:none}
.sl-msg.grouped .sl-av{visibility:hidden}.sl-msg.grouped .sl-av *{display:none}
.sl-bubble{position:relative;max-width:min(560px,78vw);min-width:64px;padding:8px 12px 6px;border-radius:20px 20px 6px 20px;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);box-shadow:0 2px 10px rgba(8,60,70,.06);word-wrap:break-word;overflow-wrap:anywhere}
.sl-msg.sl-new .sl-bubble{animation:slMsgIn .5s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)) both;animation-delay:var(--d,0ms)}
.sl-msg.mine .sl-bubble{border-radius:20px 20px 20px 6px;background:linear-gradient(135deg,var(--cc2),var(--cd));color:#fff;border-color:transparent;box-shadow:0 8px 20px rgba(var(--brand-rgb,8,185,184),.28)}
.sl-msg.pending .sl-bubble{opacity:.72}.sl-msg.failed .sl-bubble{box-shadow:0 0 0 2px var(--danger,#ef4444)}
.sl-msg.flash .sl-bubble{animation:slFlash 1.4s ease}
@keyframes slMsgIn{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:none}}
@keyframes slFlash{0%,100%{box-shadow:0 2px 10px rgba(8,60,70,.06)}30%{box-shadow:0 0 0 5px rgba(var(--brand-rgb,8,185,184),.45)}}
.sl-sender{font-size:12.5px;font-weight:900;margin-bottom:2px}
.sl-body{font-size:14.5px;line-height:1.95;white-space:normal}.sl-body a{color:inherit;text-decoration:underline;text-underline-offset:3px;font-weight:700}
.sl-msg.mine .sl-body a{color:#fff}
.sl-del{font-style:italic;opacity:.65;font-size:13.5px}
.sl-reply{display:block;width:100%;text-align:right;border:0;border-right:3px solid var(--cc);background:rgba(var(--brand-rgb,8,185,184),.12);border-radius:10px;padding:5px 10px;margin-bottom:5px;cursor:pointer;color:inherit}
.sl-msg.mine .sl-reply{border-right-color:#fff;background:rgba(255,255,255,.18)}
.sl-reply b{display:block;font-size:12px;color:var(--cd)}.sl-msg.mine .sl-reply b{color:#fff}
.sl-reply span{display:block;font-size:12.5px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
.sl-meta{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:2px;font-size:11px;opacity:.72}
.sl-tick.seen{color:#7de8ff;opacity:1}.sl-msg:not(.mine) .sl-tick.seen{color:var(--cc)}
.sl-pin{margin-inline-start:2px}
.sl-img{display:block;max-width:100%;width:300px;max-height:320px;border-radius:14px;object-fit:cover;background:var(--surface2,#f1f7f7);cursor:zoom-in;margin-bottom:4px;min-height:120px}
.sl-file{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:rgba(var(--brand-rgb,8,185,184),.12);color:inherit;text-decoration:none!important;cursor:pointer;margin-bottom:4px;border:0;width:100%;text-align:right}
.sl-msg.mine .sl-file{background:rgba(255,255,255,.18)}
.sl-file .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--surface,#fff);font-size:20px}
.sl-file b{display:block;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}.sl-file small{opacity:.75;font-size:11.5px}
.sl-voice{display:flex;align-items:center;gap:10px;min-width:210px;padding:4px 2px}
.sl-play{flex:none;width:40px;height:40px;border-radius:50%;border:0;display:grid;place-items:center;font-size:15px;cursor:pointer;background:var(--surface,#fff);color:var(--cd);box-shadow:0 4px 12px rgba(0,0,0,.15)}
.sl-wave{flex:1;display:flex;align-items:center;gap:2px;height:28px;position:relative}
.sl-wave i{flex:1;border-radius:2px;background:currentColor;opacity:.35;height:var(--h,40%);transition:opacity .2s}.sl-wave i.on{opacity:1}
.sl-voice small{font-size:11.5px;opacity:.8;min-width:34px}
.sl-reacts{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
.sl-react{border:1px solid var(--line,#dfeaea);background:var(--surface2,#f1f7f7);color:var(--ink,#12313a);border-radius:999px;padding:2px 9px;font:800 12.5px inherit;cursor:pointer;display:inline-flex;gap:4px;align-items:center;animation:slPop .4s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)) both;transition:transform .2s}
.sl-react:hover{transform:scale(1.12)}.sl-react.mine{background:var(--teal-soft,#e4f6f6);border-color:var(--cc);color:var(--cd)}
.sl-msg.mine .sl-react{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.4);color:#fff}
@keyframes slPop{from{transform:scale(.3)}to{transform:scale(1)}}
.sl-msg-menu{opacity:0;border:0;width:30px;height:30px;border-radius:50%;background:var(--surface,#fff);color:var(--muted,#5f7a80);cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.12);transition:opacity .2s,transform .2s;flex:none;align-self:center}
.sl-msg:hover .sl-msg-menu,.sl-msg-menu:focus{opacity:1}.sl-msg-menu:hover{transform:scale(1.15)}
.sl-typing{align-self:flex-end;display:none;align-items:center;gap:4px;padding:10px 14px;border-radius:18px;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);margin-top:8px}
.sl-typing.show{display:flex;animation:slMsgIn .4s both}
.sl-typing i{width:7px;height:7px;border-radius:50%;background:var(--cc);animation:slBounce 1.1s infinite}.sl-typing i:nth-child(2){animation-delay:.15s}.sl-typing i:nth-child(3){animation-delay:.3s}
@keyframes slBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}
.sl-jump{position:absolute;bottom:92px;left:18px;z-index:4;border:0;min-width:46px;height:46px;border-radius:50%;background:var(--surface,#fff);color:var(--cd);font-size:20px;cursor:pointer;box-shadow:var(--shadow-lg,0 12px 30px rgba(8,60,70,.25));display:none;place-items:center;animation:slPop .4s both}
.sl-jump.show{display:grid}.sl-jump b{position:absolute;top:-6px;right:-4px;min-width:20px;height:20px;border-radius:999px;background:var(--cc);color:#fff;font:900 11px/20px inherit;padding:0 5px;text-align:center}
.sl-bar{padding:8px 16px;background:var(--surface,#fff);border-top:1px solid var(--line,#dfeaea);display:flex;align-items:center;gap:10px;font-size:13px;animation:slItemIn .3s both}
.sl-bar b{color:var(--cd)}.sl-bar span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted,#5f7a80)}
.sl-bar button{border:0;background:transparent;font-size:18px;cursor:pointer;color:var(--muted,#5f7a80)}
.sl-compose{display:flex;align-items:flex-end;gap:8px;padding:10px 12px 12px;background:color-mix(in srgb,var(--surface,#fff) 90%,transparent);backdrop-filter:blur(14px);border-top:1px solid var(--line,#dfeaea);position:relative}
.sl-compose textarea{flex:1;resize:none;min-height:46px;max-height:140px;border-radius:23px;border:1.5px solid var(--line,#dfeaea);background:var(--surface2,#f1f7f7);color:inherit;padding:12px 18px;font:600 14.5px/1.7 inherit;outline:0;transition:border-color .2s,box-shadow .2s,background .2s;direction:rtl}
.sl-compose textarea:focus{border-color:var(--cc);background:var(--surface,#fff);box-shadow:0 0 0 4px rgba(var(--brand-rgb,8,185,184),.15)}
.sl-compose .sl-iconbtn{width:46px;height:46px;border-radius:50%;flex:none}
.sl-send{transform:scale(0);width:0!important;margin-inline-start:-8px;opacity:0;transition:transform .35s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)),width .25s,opacity .2s}
.sl-compose.has-text .sl-send{transform:scale(1);width:46px!important;opacity:1;margin-inline-start:0}
.sl-compose.has-text .sl-mic{display:none}
.sl-locked{padding:16px;text-align:center;color:var(--muted,#5f7a80);font-weight:700;font-size:13.5px;background:var(--surface,#fff);border-top:1px solid var(--line,#dfeaea);display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap}
.sl-rec{flex:1;display:flex;align-items:center;gap:12px;padding:0 16px;height:46px;border-radius:23px;background:rgba(239,68,68,.1);color:var(--danger,#ef4444);font-weight:900}
.sl-rec i{width:12px;height:12px;border-radius:50%;background:var(--danger,#ef4444);animation:slRec 1s infinite}
@keyframes slRec{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.4}}
.sl-pop{position:absolute;z-index:30;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);border-radius:20px;box-shadow:var(--shadow-lg,0 18px 44px rgba(8,60,70,.25));padding:8px;animation:slModalIn .28s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)) both;max-width:calc(100% - 16px)}
.sl-quick{display:flex;gap:4px;padding:4px 6px 8px;border-bottom:1px solid var(--line,#dfeaea);margin-bottom:4px}
.sl-quick button{border:0;background:transparent;font-size:24px;cursor:pointer;border-radius:12px;padding:4px 6px;transition:transform .2s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}.sl-quick button:hover{transform:scale(1.35) translateY(-4px)}
.sl-menu-i{display:flex;gap:10px;align-items:center;width:100%;border:0;background:transparent;color:inherit;text-align:right;padding:9px 12px;border-radius:12px;cursor:pointer;font:700 13.5px inherit}
.sl-menu-i:hover{background:var(--surface2,#f1f7f7)}.sl-menu-i.danger{color:var(--danger,#ef4444)}
.sl-emoji-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;width:min(340px,86vw);max-height:230px;overflow-y:auto;padding:4px}
.sl-emoji-grid button{border:0;background:transparent;font-size:23px;border-radius:10px;padding:5px;cursor:pointer;transition:transform .15s}.sl-emoji-grid button:hover{background:var(--surface2,#f1f7f7);transform:scale(1.25)}
.sl-modal{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:rgba(8,30,36,.46);backdrop-filter:blur(4px);opacity:0;transition:opacity .25s;padding:14px}
.sl-modal.in{opacity:1}
.sl-modal-card{width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--surface,#fff);border-radius:26px;box-shadow:var(--shadow-lg,0 24px 60px rgba(8,60,70,.4));overflow:hidden;animation:slModalIn .4s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)) both}
@keyframes slModalIn{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
.sl-modal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line,#dfeaea);background:linear-gradient(180deg,rgba(var(--brand-rgb,8,185,184),.1),transparent)}
.sl-modal-head h4{margin:0;font-size:17px;font-weight:900}
.sl-modal-body{padding:16px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;min-height:0}
.sl-modal-foot{padding:14px 20px;border-top:1px solid var(--line,#dfeaea);display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.sl-btn{border:0;border-radius:15px;padding:12px 22px;font:900 14px inherit;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--cc2),var(--cd));box-shadow:0 10px 22px rgba(var(--brand-rgb,8,185,184),.3);transition:transform .25s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)),box-shadow .2s}
.sl-btn:hover{transform:translateY(-2px)}.sl-btn:active{transform:scale(.96)}.sl-btn[disabled]{opacity:.5;cursor:not-allowed;transform:none}
.sl-btn.ghost{background:var(--surface2,#f1f7f7);color:var(--ink,#12313a);box-shadow:none}.sl-btn.danger{background:linear-gradient(135deg,#f87171,var(--danger,#ef4444))}
.sl-field{display:flex;flex-direction:column;gap:6px}.sl-field label{font-size:13px;font-weight:800;color:var(--muted,#5f7a80)}
.sl-field input,.sl-field textarea{border-radius:14px;border:1.5px solid var(--line,#dfeaea);background:var(--surface2,#f1f7f7);color:inherit;padding:11px 14px;font:600 14px inherit;outline:0;transition:border-color .2s,box-shadow .2s}
.sl-field input:focus,.sl-field textarea:focus{border-color:var(--cc);box-shadow:0 0 0 4px rgba(var(--brand-rgb,8,185,184),.15);background:var(--surface,#fff)}
.sl-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:18px;background:var(--surface2,#f1f7f7)}
.sl-seg button{border:0;border-radius:14px;padding:11px 8px;background:transparent;font:900 13.5px inherit;color:var(--muted,#5f7a80);cursor:pointer;transition:all .3s var(--ease,ease)}
.sl-seg button.on{background:var(--surface,#fff);color:var(--cd);box-shadow:0 6px 16px rgba(8,60,70,.14)}
.sl-seg small{display:block;font-weight:600;opacity:.8;margin-top:2px}
.sl-swatches{display:flex;gap:8px;flex-wrap:wrap}.sl-swatches button{width:34px;height:34px;border-radius:50%;border:3px solid var(--surface,#fff);box-shadow:0 0 0 1.5px var(--line,#dfeaea);cursor:pointer;background:var(--c);transition:transform .25s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sl-swatches button.on{box-shadow:0 0 0 3px var(--c);transform:scale(1.15)}
.sl-people{display:flex;flex-direction:column;gap:4px;max-height:280px;overflow-y:auto}
.sl-person{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:14px;cursor:pointer;border:0;background:transparent;width:100%;text-align:right;color:inherit;transition:background .15s}
.sl-person:hover{background:var(--surface2,#f1f7f7)}.sl-person.on{background:var(--teal-soft,#e4f6f6)}
.sl-person .sl-av{width:40px;height:40px;border-radius:14px;font-size:14px;box-shadow:none}
.sl-person div{flex:1;min-width:0}.sl-person b{display:block;font-size:14px}.sl-person small{color:var(--muted,#5f7a80);font-size:12px}
.sl-person .chk{flex:none;width:24px;height:24px;border-radius:8px;border:2px solid var(--line,#dfeaea);display:grid;place-items:center;font-size:14px;color:#fff;transition:all .2s}.sl-person.on .chk{background:var(--cc);border-color:var(--cc)}
.sl-chips{display:flex;gap:6px;flex-wrap:wrap}.sl-chips button{border:1px solid var(--line,#dfeaea);background:var(--surface,#fff);color:var(--ink,#12313a);border-radius:999px;padding:6px 12px;font:800 12px inherit;cursor:pointer;transition:all .2s}.sl-chips button.on{background:var(--teal-soft,#e4f6f6);border-color:var(--cc);color:var(--cd)}
.sl-info-hero{display:grid;place-items:center;text-align:center;gap:6px;padding:6px 0 4px}.sl-info-hero .sl-av{width:84px;height:84px;border-radius:28px;font-size:34px}
.sl-info-hero h4{margin:6px 0 0;font-size:19px}.sl-info-hero p{margin:0;color:var(--muted,#5f7a80);font-size:13.5px}
.sl-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px}.sl-row b{font-size:14px}
.sl-switch{position:relative;width:48px;height:28px;border-radius:999px;background:var(--line,#cfe0e0);border:0;cursor:pointer;transition:background .25s;flex:none}
.sl-switch::after{content:"";position:absolute;top:3px;right:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .3s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sl-switch.on{background:var(--cc)}.sl-switch.on::after{transform:translateX(-20px)}
.sl-lightbox{position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.88);display:grid;place-items:center;animation:slItemIn .3s both;cursor:zoom-out}.sl-lightbox img{max-width:94%;max-height:90%;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.sl-search-panel{background:var(--surface,#fff);border-bottom:1px solid var(--line,#dfeaea);padding:10px 14px;display:flex;flex-direction:column;gap:8px;max-height:46%;overflow:hidden;animation:slItemIn .3s both}
.sl-search-panel .res{overflow-y:auto;display:flex;flex-direction:column;gap:2px}
.sl-hit{display:block;width:100%;text-align:right;border:0;background:transparent;color:inherit;padding:8px 10px;border-radius:12px;cursor:pointer}.sl-hit:hover{background:var(--surface2,#f1f7f7)}
.sl-hit b{font-size:12.5px;color:var(--cd)}.sl-hit span{display:block;font-size:13px;color:var(--muted,#5f7a80);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-hit mark{background:rgba(250,204,21,.45);color:inherit;border-radius:4px}
.sl-spin{width:26px;height:26px;border-radius:50%;border:3px solid var(--line,#dfeaea);border-top-color:var(--cc);animation:slSpin .8s linear infinite;margin:30px auto}
@keyframes slSpin{to{transform:rotate(360deg)}}
@media (max-width:820px){
  .sl-chat{height:calc(100dvh - 176px);min-height:480px;border-radius:24px}
  .sl-rooms{width:100%;border:0}
  .sl-conv{position:absolute;inset:0;z-index:5;transform:translateX(-102%);transition:transform .42s var(--ease,cubic-bezier(.22,1,.36,1))}
  .sl-chat.is-conv .sl-conv{transform:none}
  .sl-back{display:grid}
  .sl-bubble{max-width:82vw}
  .sl-msg-menu{opacity:.55}
}
@media (prefers-reduced-motion:reduce){.sl-chat *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`);

  /* ============ وضعیت مشترک ============ */
  const C = (L._C = {
    root: null, rooms: [], byId: new Map(), mod: [], cur: null, filter: 'all', q: '', msgs: [], reacts: new Map(), members: [], replyCache: new Map(),
    hasMore: false, replyTo: null, editing: null, pinned: null, roomCh: null, typing: new Map(), drafts: new Map(), dir: null, urls: new Map(),
    rec: null, stick: true, newBelow: 0, bound: false, loading: false,
  });
  C.roomTitle = (r) => (r.kind === 'direct' ? (r.other && r.other.name) || 'گفتگو' : r.title || 'بدون عنوان');
  C.canPost = (r) => !!r && r.member !== false && (!r.adminsOnly || r.role === 'owner' || r.role === 'admin');
  C.isAdmin = (r) => !!r && (r.role === 'owner' || r.role === 'admin' || (S.me && S.me.role === 'manager' && r.kind !== 'direct'));
  C.isVisible = () => !!(C.root && C.root.offsetParent !== null && !document.hidden);
  C.previewOf = (m) => (m.kind === 'text' ? String(m.body || '').slice(0, 80) : m.kind === 'image' ? '📷 تصویر' : m.kind === 'voice' ? '🎤 پیام صوتی' : '📎 ' + (m.attachment_name || 'فایل'));
  C.isOnline = (uid) => S.online && S.online.has(uid);
  C.avatar = (r) => {
    if (r.kind === 'direct') { const n = C.roomTitle(r); return '<span class="sl-av" style="--c:' + colorOf(n) + '">' + esc(initials(n)) + (r.other && C.isOnline(r.other.id) ? '<span class="dot"></span>' : '') + '</span>'; }
    return '<span class="sl-av sl-av-room" style="--c:' + esc(r.color || '#08b9b8') + '">' + (r.kind === 'channel' ? '📣' : '👥') + '</span>';
  };
  C.personAv = (name) => '<span class="sl-av" style="--c:' + colorOf(name) + '">' + esc(initials(name)) + '</span>';

  C.recount = function () {
    L.setBadge('chat', C.rooms.filter((r) => !r.muted).reduce((a, r) => a + (r.unread || 0), 0));
  };

  /* ============ بارگذاری گفتگوها ============ */
  C.loadRooms = async function () {
    const db = S.db;
    const res = await db.from('chat_members').select('room_id,role,last_read_at,muted,pinned,chat_rooms(id,kind,title,description,color,direct_key,only_admins_post,created_by,created_at,last_message_at,last_message_preview)').eq('user_id', S.me.id);
    if (res.error) throw res.error;
    const rooms = (res.data || []).map((m) => {
      const r = Array.isArray(m.chat_rooms) ? m.chat_rooms[0] : m.chat_rooms; if (!r) return null;
      return { id: r.id, kind: r.kind, title: r.title, desc: r.description, color: r.color, key: r.direct_key, adminsOnly: r.only_admins_post, createdBy: r.created_by, lastAt: r.last_message_at || r.created_at, preview: r.last_message_preview || '', role: m.role, lastRead: m.last_read_at, muted: m.muted, pinned: m.pinned, unread: 0, member: true };
    }).filter(Boolean);
    const dm = rooms.filter((r) => r.kind === 'direct').map((r) => r.id);
    if (dm.length) {
      const o = await db.from('chat_members').select('room_id,user_id,display_name,user_role').in('room_id', dm).neq('user_id', S.me.id);
      (o.data || []).forEach((x) => { const r = rooms.find((q) => q.id === x.room_id); if (r) r.other = { id: x.user_id, name: x.display_name, role: x.user_role }; });
    }
    const un = await db.rpc('chat_unread_counts');
    (un.data || []).forEach((u) => { const r = rooms.find((q) => q.id === u.room_id); if (r) r.unread = Number(u.unread); });
    // وضعیت اتاق باز را حفظ می‌کنیم
    if (C.cur) { const same = rooms.find((r) => r.id === C.cur.id); if (same) same.unread = 0; }
    C.rooms = rooms; C.byId = new Map(rooms.map((r) => [r.id, r]));
    if (C.cur && C.byId.has(C.cur.id)) C.cur = C.byId.get(C.cur.id);
    C.recount();
  };
  C.loadModeration = async function () {
    if (!S.me || S.me.role !== 'manager') return;
    const r = await S.db.from('chat_rooms').select('id,kind,title,description,color,only_admins_post,created_by,created_at,last_message_at,last_message_preview').neq('kind', 'direct').order('created_at', { ascending: false }).limit(200);
    C.mod = (r.data || []).filter((x) => !C.byId.has(x.id)).map((x) => ({ id: x.id, kind: x.kind, title: x.title, desc: x.description, color: x.color, adminsOnly: x.only_admins_post, createdBy: x.created_by, lastAt: x.last_message_at || x.created_at, preview: x.last_message_preview || '', role: null, unread: 0, member: false, muted: false, pinned: false }));
  };
  C.directory = async function (force) {
    if (C.dir && !force) return C.dir;
    const r = await S.db.rpc('chat_directory');
    C.dir = r.data || [];
    return C.dir;
  };

  /* ============ فهرست گفتگوها ============ */
  C.renderRooms = function () {
    const box = $('.sl-room-list', C.root); if (!box) return;
    const q = C.q.trim();
    let list = C.filter === 'mod' ? C.mod.slice() : C.rooms.slice();
    if (C.filter === 'direct' || C.filter === 'group' || C.filter === 'channel') list = list.filter((r) => r.kind === C.filter);
    if (q) list = list.filter((r) => (C.roomTitle(r) + ' ' + (r.preview || '')).includes(q));
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.lastAt) - new Date(a.lastAt));
    box.innerHTML = list.length ? list.map((r, i) => {
      const typing = C.typingNames(r.id).length;
      const tag = r.kind === 'direct' && r.other ? ROLE_FA[r.other.role] : '';
      return '<button type="button" class="sl-room ' + (C.cur && C.cur.id === r.id ? 'active' : '') + '" data-id="' + esc(r.id) + '" style="--i:' + Math.min(i, 12) + '">' + C.avatar(r) +
        '<div class="sl-room-main"><div class="sl-room-top"><b>' + (r.pinned ? '📌 ' : '') + esc(C.roomTitle(r)) + '</b><time>' + (r.lastAt && r.preview ? relTime(r.lastAt) : '') + '</time></div>' +
        '<div class="sl-room-sub"><span class="sl-prev ' + (typing ? 'typing' : '') + '">' + (typing ? 'در حال نوشتن…' : esc(r.preview || (r.kind === 'channel' ? 'کانال' : r.kind === 'group' ? 'گروه' : 'گفتگوی تازه'))) + '</span>' +
        (tag ? '<span class="sl-tag">' + esc(tag) + '</span>' : '') + (r.muted ? '<span title="بی‌صدا">🔕</span>' : '') +
        (r.unread ? '<span class="sl-unread ' + (r.muted ? 'muted' : '') + '">' + (r.unread > 99 ? fa(99) + '+' : fa(r.unread)) + '</span>' : '') + '</div></div></button>';
    }).join('') : '<div class="sl-empty"><div class="big">💬</div><b>' + (q ? 'نتیجه‌ای پیدا نشد' : 'هنوز گفتگویی ندارید') + '</b><span>' + (q ? 'عبارت دیگری را امتحان کنید.' : 'با دکمهٔ + یک گفتگوی تازه شروع کنید.') + '</span></div>';
  };
  C.typingNames = (roomId) => {
    const m = C.typing.get(roomId); if (!m) return [];
    const now = Date.now(); return Array.from(m.values()).filter((t) => now - t.t < 4500).map((t) => t.name);
  };

  /* ============ رویدادهای زنده ============ */
  C.onInsert = async function (m) {
    if (!C.root) return;
    let r = C.byId.get(m.room_id);
    if (!r) { try { await C.loadRooms(); } catch (e) { return; } r = C.byId.get(m.room_id); if (!r) return; }
    r.lastAt = m.created_at; r.preview = C.previewOf(m);
    const mine = m.sender_id === S.me.id;
    const open = C.cur && C.cur.id === r.id;
    if (open) {
      if (!C.msgs.some((x) => String(x.id) === String(m.id))) {
        C.msgs = C.msgs.filter((x) => !(x._tmp && x.sender_id === m.sender_id && x.body === m.body && x.kind === m.kind && !x._failed));
        C.msgs.push(m); C.appendMsg && C.appendMsg(m);
      }
      if (!mine && C.isVisible()) C.markRead && C.markRead(); else if (!mine) { r.unread++; }
    } else if (!mine) { r.unread = (r.unread || 0) + 1; }
    if (!mine && (!open || !C.isVisible()) && !r.muted) {
      toast({ title: C.roomTitle(r), text: (r.kind === 'direct' ? '' : (m.sender_name || '') + ': ') + C.previewOf(m), icon: '💬', kind: 'msg', onClick: () => { if (S.opts.navigate) S.opts.navigate('chat'); C.openRoom(r.id); } });
      ping('msg');
      desktopNotify(C.roomTitle(r), (m.sender_name || '') + ': ' + C.previewOf(m), () => { if (S.opts.navigate) S.opts.navigate('chat'); C.openRoom(r.id); });
    }
    C.recount(); C.renderRooms();
  };
  C.onUpdate = function (m) {
    const r = C.byId.get(m.room_id); if (!r) return;
    if (C.cur && C.cur.id === m.room_id) {
      const i = C.msgs.findIndex((x) => String(x.id) === String(m.id));
      if (i > -1) { C.msgs[i] = Object.assign({}, C.msgs[i], m); C.updateMsgNode && C.updateMsgNode(C.msgs[i]); }
      C.loadPinned && C.loadPinned();
    }
  };
  C.onMemberAdded = async function (row) {
    if (C.byId.has(row.room_id)) return;
    try { await C.loadRooms(); } catch (e) { return; }
    const r = C.byId.get(row.room_id);
    if (r && r.kind !== 'direct' && r.createdBy !== S.me.id) toast({ title: r.kind === 'channel' ? 'به یک کانال اضافه شدید' : 'به یک گروه اضافه شدید', text: C.roomTitle(r), icon: r.kind === 'channel' ? '📣' : '👥', kind: 'msg', onClick: () => { if (S.opts.navigate) S.opts.navigate('chat'); C.openRoom(r.id); } });
    C.renderRooms();
  };
  C.onMemberRemoved = function (old) {
    const i = C.rooms.findIndex((r) => r.id === old.room_id); if (i < 0) return;
    const r = C.rooms[i]; C.rooms.splice(i, 1); C.byId.delete(r.id);
    if (C.cur && C.cur.id === r.id) { C.closeRoom && C.closeRoom(); toast({ title: 'دسترسی شما به «' + C.roomTitle(r) + '» برداشته شد', icon: '🚪' }); }
    C.recount(); C.renderRooms();
  };
  C.onRoomUpdate = function (room) {
    const r = C.byId.get(room.id) || C.mod.find((x) => x.id === room.id); if (!r) return;
    Object.assign(r, { title: room.title, desc: room.description, color: room.color, adminsOnly: room.only_admins_post, lastAt: room.last_message_at || r.lastAt, preview: room.last_message_preview || r.preview });
    if (C.cur && C.cur.id === r.id) { C.renderConvHead && C.renderConvHead(); C.renderComposer && C.renderComposer(); }
    C.renderRooms();
  };
  C.onRoomDelete = function (old) {
    C.mod = C.mod.filter((x) => x.id !== old.id);
    if (C.byId.has(old.id)) C.onMemberRemoved({ room_id: old.id });
  };

  /* ============ سوار کردن روی صفحه ============ */
  C.mount = function (root) {
    if (!root) return;
    C.root = root; root.classList.add('sl-chat'); root.innerHTML =
      '<aside class="sl-rooms"><div class="sl-rooms-head"><div class="sl-rooms-title"><h3>پیام‌ها</h3><div style="display:flex;gap:8px"><button type="button" class="sl-iconbtn solid" data-act="new" aria-label="گفتگوی تازه" title="گفتگوی تازه">＋</button></div></div>' +
      '<div class="sl-search"><input type="search" placeholder="جستجو در گفتگوها" aria-label="جستجو در گفتگوها"><i>🔍</i></div><div class="sl-filters"></div></div><div class="sl-room-list"><div class="sl-spin"></div></div></aside>' +
      '<section class="sl-conv"><div class="sl-conv-empty"><div class="big">💬</div><b>گفتگویی را انتخاب کنید</b><span>یا با دکمهٔ ＋ یک گفتگوی تازه شروع کنید.</span></div></section>';
    C.renderFilters();
    if (!C.bound) {
      C.bound = true;
      L.on('msg-insert', (m) => C.onInsert(m)); L.on('msg-update', (m) => C.onUpdate(m));
      L.on('member-added', (r) => C.onMemberAdded(r)); L.on('member-removed', (r) => C.onMemberRemoved(r));
      L.on('room-update', (r) => C.onRoomUpdate(r)); L.on('room-delete', (r) => C.onRoomDelete(r));
      L.on('presence', () => { C.renderRooms(); C.renderConvHead && C.renderConvHead(); });
      L.on('signout', () => { C.rooms = []; C.byId = new Map(); C.cur = null; C.dir = null; });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && C.cur && C.isVisible()) C.markRead && C.markRead(); });
      setInterval(() => { if (C.root && C.cur) C.renderTypingState && C.renderTypingState(); }, 1500);
    }
    root.addEventListener('click', C.onClick);
    root.addEventListener('input', (e) => { if (e.target.matches('.sl-rooms .sl-search input')) { C.q = e.target.value; C.renderRooms(); } });
    new MutationObserver(() => { if (C.cur && C.isVisible()) { C.markRead && C.markRead(); } }).observe(root.closest('.page,section') || root.parentElement || root, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    const start = async () => {
      try { await C.loadRooms(); await C.loadModeration(); } catch (e) { console.error(e); $('.sl-room-list', root).innerHTML = '<div class="sl-empty"><div class="big">⚠️</div><b>بارگذاری پیام‌ها ناموفق بود</b><span>اینترنت را بررسی کنید و صفحه را دوباره باز کنید.</span></div>'; return; }
      C.renderFilters(); C.renderRooms();
    };
    if (S.ready) start(); else L.on('ready', start);
  };
  C.renderFilters = function () {
    const f = $('.sl-filters', C.root); if (!f) return;
    const tabs = [['all', 'همه'], ['direct', 'مستقیم'], ['group', 'گروه‌ها'], ['channel', 'کانال‌ها']];
    if (S.me && S.me.role === 'manager') tabs.push(['mod', 'نظارت']);
    f.innerHTML = tabs.map((t) => '<button type="button" data-filter="' + t[0] + '" class="' + (C.filter === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('');
  };
  C.onClick = function (e) {
    const t = e.target;
    const fl = t.closest('[data-filter]'); if (fl) { C.filter = fl.dataset.filter; C.renderFilters(); C.renderRooms(); return; }
    const room = t.closest('.sl-room'); if (room) { C.openRoom(room.dataset.id); return; }
    if (t.closest('[data-act="new"]')) { C.newMenu(t.closest('[data-act="new"]')); return; }
    C.onConvClick && C.onConvClick(e);
  };

  L.mountChat = (root) => C.mount(root);
  L.openRoom = (id) => C.openRoom && C.openRoom(id);
})(window);

/* پیام‌رسان — بخش ۲: گفتگو، ارسال، پیوست، صدا، واکنش‌ها، جستجو و مدیریت اعضا */
(function (global) {
  'use strict';
  const L = global.SchoolLive, C = L && L._C;
  if (!C || C.openRoom) return;
  const U = L.util, S = L.state;
  const { fa, esc, $, $$, uuid, debounce, throttle, faTime, faDay, dayKey, colorOf, initials, linkify, bytes, ROLE_FA, toast } = U;
  const QUICK = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const EMOJIS = '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 😉 😌 😍 🥰 😘 😗 😋 😛 😜 🤪 😎 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 😶 😐 😑 😬 🙄 😯 😴 🤤 😷 🤒 🤕 🤢 🤮 🤧 😈 👻 💀 🤖 🎃 👍 👎 👏 🙌 👐 🤝 🙏 ✌️ 🤞 👌 🤌 👋 💪 ✍️ ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💞 💯 ✨ ⭐ 🌟 🔥 🎉 🎊 🎈 🎁 🏆 🥇 📚 📖 ✏️ 📝 📌 📎 🔔 ✅ ❌ ❓ ❗ 🌙 ☀️ 🌈 🌹 🌸 🍀 ☕ 🍎'.split(' ');
  const COLORS = ['#08b9b8', '#7c5cff', '#2f80ed', '#22a06b', '#f2994a', '#e5484d', '#d6409f', '#6b7280'];
  const roomKindFa = { direct: 'گفتگو', group: 'گروه', channel: 'کانال' };

  /* ============ ابزارهای نمایشی ============ */
  C.modal = function (html, opts) {
    opts = opts || {};
    const m = document.createElement('div'); m.className = 'sl-modal';
    m.innerHTML = '<div class="sl-modal-card" role="dialog" aria-modal="true">' + html + '</div>';
    C.root.appendChild(m); requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 240); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    m.addEventListener('mousedown', (e) => { if (e.target === m) close(); });
    m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    const first = $('input,textarea', m); if (first && !('ontouchstart' in global)) setTimeout(() => first.focus(), 60);
    return { el: m, close };
  };
  C.closePop = function () { $$('.sl-pop', C.root).forEach((p) => p.remove()); };
  C.pop = function (html, rect, opts) {
    C.closePop();
    const p = document.createElement('div'); p.className = 'sl-pop'; p.innerHTML = html; C.root.appendChild(p);
    const rr = C.root.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    let x = (opts && opts.alignRight ? rect.right : rect.left) - rr.left - (opts && opts.alignRight ? pw : 0);
    let y = (opts && opts.above ? rect.top - rr.top - ph - 8 : rect.bottom - rr.top + 8);
    x = Math.max(8, Math.min(x, rr.width - pw - 8)); y = Math.max(8, Math.min(y, rr.height - ph - 8));
    p.style.left = x + 'px'; p.style.top = y + 'px';
    return p;
  };
  document.addEventListener('mousedown', (e) => { if (C.root && !e.target.closest('.sl-pop') && !e.target.closest('[data-act="emoji"],[data-act="new"],.sl-msg-menu')) C.closePop(); });

  C.signed = async function (paths) {
    const need = paths.filter((p) => { const c = C.urls.get(p); return !c || c.exp < Date.now() + 60000; });
    if (need.length) {
      const r = await S.db.storage.from('chat-files').createSignedUrls(need, 3600);
      (r.data || []).forEach((x) => { if (x.signedUrl) C.urls.set(x.path, { url: x.signedUrl, exp: Date.now() + 3500000 }); });
    }
    return C.urls;
  };
  C.hydrateMedia = async function () {
    const nodes = $$('img.sl-img[data-path]:not([src])', C.root);
    if (!nodes.length) return;
    const urls = await C.signed(Array.from(new Set(nodes.map((n) => n.dataset.path))));
    nodes.forEach((n) => { const c = urls.get(n.dataset.path); if (c) n.src = c.url; });
  };

  /* ============ باز و بسته کردن گفتگو ============ */
  C.saveDraft = function () {
    const ta = $('.sl-compose textarea', C.root);
    if (C.cur && ta && !C.editing) { if (ta.value.trim()) C.drafts.set(C.cur.id, ta.value); else C.drafts.delete(C.cur.id); }
  };
  C.openRoom = async function (id) {
    const r = C.byId.get(id) || C.mod.find((x) => x.id === id);
    if (!r || !C.root) return;
    if (C.cur && C.cur.id === id) { C.root.classList.add('is-conv'); C.markRead(); return; }
    C.saveDraft(); C.unsubscribeRoom();
    C.cur = r; C.msgs = []; C.reacts = new Map(); C.members = []; C.replyCache = new Map(); C.replyTo = null; C.editing = null;
    C.hasMore = false; C.pinned = null; C.stick = true; C.newBelow = 0;
    C.root.classList.add('is-conv');
    C.renderConv(); C.renderRooms();
    $('.sl-msgs', C.root).innerHTML = '<div class="sl-spin"></div>';
    try { await Promise.all([C.loadMessages(), C.loadMembers(), C.loadPinned()]); } catch (e) { console.error(e); }
    if (C.cur !== r) return;
    C.renderMessages(true); C.renderConvHead(); C.renderComposer();
    if (r.member !== false) { C.subscribeRoom(); C.markRead(true); }
    const dr = C.drafts.get(id), ta = $('.sl-compose textarea', C.root);
    if (dr && ta) { ta.value = dr; C.syncCompose(); }
  };
  C.closeRoom = function () {
    C.saveDraft(); C.unsubscribeRoom(); C.cur = null; C.cancelRec(true);
    C.root.classList.remove('is-conv');
    $('.sl-conv', C.root).innerHTML = '<div class="sl-conv-empty"><div class="big">💬</div><b>گفتگویی را انتخاب کنید</b><span>یا با دکمهٔ ＋ یک گفتگوی تازه شروع کنید.</span></div>';
    C.renderRooms();
  };
  C.unsubscribeRoom = function () { if (C.roomCh) { try { S.db.removeChannel(C.roomCh); } catch (e) { /* ignore */ } C.roomCh = null; } };

  C.renderConv = function () {
    $('.sl-conv', C.root).innerHTML =
      '<div class="sl-head"><button type="button" class="sl-iconbtn sl-back" data-act="back" aria-label="بازگشت به گفتگوها">→</button><div class="sl-head-av"></div>' +
      '<div class="sl-head-main" data-act="info"><b></b><span></span></div>' +
      '<button type="button" class="sl-iconbtn" data-act="search" aria-label="جستجو در گفتگو" title="جستجو">🔍</button>' +
      '<button type="button" class="sl-iconbtn" data-act="info" aria-label="اطلاعات گفتگو" title="اطلاعات">ⓘ</button></div>' +
      '<div class="sl-pin-slot"></div><div class="sl-search-slot"></div><div class="sl-msgs" tabindex="0" aria-live="polite"></div>' +
      '<button type="button" class="sl-jump" data-act="jump" aria-label="رفتن به آخرین پیام">⌄<b hidden></b></button><div class="sl-bar-slot"></div><div class="sl-compose-slot"></div>';
    C.renderConvHead(); C.renderComposer();
    const box = $('.sl-msgs', C.root);
    box.addEventListener('scroll', throttle(() => {
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
      C.stick = near; if (near) { C.newBelow = 0; if (C.isVisible()) C.markRead(); }
      const j = $('.sl-jump', C.root); if (j) { j.classList.toggle('show', !near); const b = $('b', j); b.hidden = !C.newBelow; b.textContent = fa(C.newBelow); }
    }, 120));
  };
  C.renderConvHead = function () {
    const r = C.cur, h = $('.sl-head', C.root); if (!r || !h) return;
    $('.sl-head-av', h).innerHTML = C.avatar(r);
    $('.sl-head-main b', h).textContent = C.roomTitle(r);
    const t = C.typingNames(r.id), sp = $('.sl-head-main span', h);
    let sub;
    if (t.length) { sub = (r.kind === 'direct' ? '' : t.join('، ') + ' ') + 'در حال نوشتن…'; sp.className = 'typing'; }
    else {
      sp.className = '';
      if (r.kind === 'direct') sub = r.other ? (C.isOnline(r.other.id) ? '🟢 آنلاین' : ROLE_FA[r.other.role] || '') : '';
      else sub = (r.member === false ? 'نظارت مدیر · ' : '') + roomKindFa[r.kind] + (C.members.length ? ' · ' + fa(C.members.length) + ' عضو' : '');
    }
    sp.textContent = sub;
  };
  C.renderTypingState = function () {
    if (!C.cur) return;
    const t = C.typingNames(C.cur.id), el = $('.sl-typing', C.root);
    if (el) { el.classList.toggle('show', t.length > 0); if (t.length && C.stick) { const b = $('.sl-msgs', C.root); b.scrollTop = b.scrollHeight; } }
    C.renderConvHead();
  };

  /* ============ بارگذاری پیام‌ها ============ */
  C.loadMessages = async function (older) {
    const r = C.cur; if (!r) return;
    let q = S.db.from('chat_messages').select('*').eq('room_id', r.id).order('id', { ascending: false }).limit(40);
    if (older && C.msgs.length) q = q.lt('id', C.msgs.find((m) => !m._tmp).id);
    const res = await q; if (res.error) throw res.error;
    const rows = (res.data || []).slice().reverse();
    C.hasMore = (res.data || []).length === 40;
    const have = new Set(C.msgs.map((m) => String(m.id)));
    C.msgs = rows.filter((m) => !have.has(String(m.id))).concat(C.msgs);
    await Promise.all([C.loadReactionsFor(rows.map((m) => m.id)), C.loadReplyTargets(rows)]);
  };
  C.loadReactionsFor = async function (ids) {
    if (!ids.length) return;
    const res = await S.db.from('chat_reactions').select('message_id,user_id,emoji').in('message_id', ids);
    ids.forEach((id) => C.reacts.set(id, []));
    (res.data || []).forEach((x) => { const a = C.reacts.get(x.message_id) || []; a.push(x); C.reacts.set(x.message_id, a); });
  };
  C.loadReplyTargets = async function (rows) {
    const miss = Array.from(new Set(rows.map((m) => m.reply_to).filter((id) => id && !C.msgs.some((x) => String(x.id) === String(id)) && !C.replyCache.has(id))));
    if (!miss.length) return;
    const res = await S.db.from('chat_messages').select('id,sender_name,body,kind,deleted_at,attachment_name').in('id', miss);
    (res.data || []).forEach((x) => C.replyCache.set(x.id, x));
  };
  C.loadMembers = async function () {
    const r = C.cur; if (!r) return;
    const res = await S.db.from('chat_members').select('user_id,role,display_name,user_role,last_read_at,muted,joined_at').eq('room_id', r.id);
    C.members = res.data || [];
    if (r.kind === 'direct' && !r.other) { const o = C.members.find((x) => x.user_id !== S.me.id); if (o) r.other = { id: o.user_id, name: o.display_name, role: o.user_role }; }
  };
  C.loadPinned = async function () {
    const r = C.cur; if (!r) return;
    const res = await S.db.from('chat_messages').select('id,sender_name,body,kind,attachment_name').eq('room_id', r.id).eq('pinned', true).is('deleted_at', null).order('id', { ascending: false }).limit(1);
    C.pinned = (res.data || [])[0] || null; C.renderPinned();
  };
  C.renderPinned = function () {
    const s = $('.sl-pin-slot', C.root); if (!s) return;
    s.innerHTML = C.pinned ? '<div class="sl-pinbar" data-act="gopin" data-id="' + esc(C.pinned.id) + '"><b>📌 پین‌شده</b><span>' + esc(C.pinned.sender_name + ': ' + C.previewOf(C.pinned)) + '</span></div>' : '';
  };

  /* ============ ساخت پیام ============ */
  C.otherMember = () => C.members.find((x) => x.user_id !== S.me.id);
  C.msgHTML = function (m, prev, isNew, delay) {
    const r = C.cur, mine = m.sender_id === S.me.id;
    const grouped = !!(prev && prev.sender_id === m.sender_id && dayKey(prev.created_at) === dayKey(m.created_at) && new Date(m.created_at) - new Date(prev.created_at) < 300000);
    const group = r.kind !== 'direct';
    let inner = '';
    if (!mine && group && !grouped) inner += '<div class="sl-sender" style="color:' + colorOf(m.sender_name) + '">' + esc(m.sender_name) + '</div>';
    if (m.deleted_at) inner += '<div class="sl-body sl-del">🚫 این پیام حذف شد</div>';
    else {
      if (m.reply_to) {
        const t = C.msgs.find((x) => String(x.id) === String(m.reply_to)) || C.replyCache.get(m.reply_to);
        inner += '<button type="button" class="sl-reply" data-act="goto" data-id="' + esc(m.reply_to) + '"><b>' + esc(t ? t.sender_name : 'پیام') + '</b><span>' + esc(t ? (t.deleted_at ? 'پیام حذف شده' : C.previewOf(t)) : '…') + '</span></button>';
      }
      if (m.kind === 'image') inner += '<img class="sl-img" data-act="zoom" data-path="' + esc(m.attachment_path) + '" alt="تصویر ارسال‌شده" loading="lazy">' + (m.body ? '<div class="sl-body">' + linkify(m.body) + '</div>' : '');
      else if (m.kind === 'voice') {
        const bars = Array.from({ length: 28 }, (_, i) => '<i style="--h:' + (22 + ((i * 37 + String(m.id).length * 13 + (parseInt(String(m.id).replace(/\D/g, ''), 10) || 7)) % 70)) + '%"></i>').join('');
        inner += '<div class="sl-voice" data-path="' + esc(m.attachment_path) + '" data-secs="' + (m.attachment_seconds || 0) + '"><button type="button" class="sl-play" data-act="play" aria-label="پخش پیام صوتی">▶</button><div class="sl-wave">' + bars + '</div><small>' + C.fmtSecs(m.attachment_seconds || 0) + '</small></div>';
      } else if (m.kind === 'file') inner += '<button type="button" class="sl-file" data-act="openfile" data-path="' + esc(m.attachment_path) + '"><span class="ic">📄</span><span><b>' + esc(m.attachment_name || 'فایل') + '</b><small>' + (m.attachment_size ? bytes(m.attachment_size) : 'برای دریافت بزنید') + '</small></span></button>';
      else inner += '<div class="sl-body">' + linkify(m.body || '') + '</div>';
      if (m._uploading) inner += '<div class="sl-body" style="opacity:.8">⏳ در حال ارسال…</div>';
    }
    const other = r.kind === 'direct' ? C.otherMember() : null;
    const seen = other && !m._tmp && Date.parse(other.last_read_at) >= Date.parse(m.created_at);
    const tick = mine ? (m._failed ? '<span class="sl-tick" title="ارسال نشد">⚠️</span>' : m._tmp ? '<span class="sl-tick">🕓</span>' : '<span class="sl-tick ' + (seen ? 'seen' : '') + '">' + (r.kind === 'direct' ? (seen ? '✓✓' : '✓') : '✓') + '</span>') : '';
    const meta = '<div class="sl-meta">' + (m.pinned ? '<span class="sl-pin">📌</span>' : '') + (m.edited_at && !m.deleted_at ? '<span>ویرایش‌شده</span>' : '') + '<span>' + faTime(m.created_at) + '</span>' + tick + '</div>';
    const reacts = C.reacts.get(m.id) || [];
    const grp = {}; reacts.forEach((x) => { (grp[x.emoji] = grp[x.emoji] || []).push(x.user_id); });
    const reactHTML = !m.deleted_at && Object.keys(grp).length ? '<div class="sl-reacts">' + Object.keys(grp).map((e) => '<button type="button" class="sl-react ' + (grp[e].includes(S.me.id) ? 'mine' : '') + '" data-act="react" data-id="' + esc(m.id) + '" data-emoji="' + esc(e) + '">' + esc(e) + ' <span>' + fa(grp[e].length) + '</span></button>').join('') + '</div>' : '';
    const av = !mine && group ? C.personAv(m.sender_name) : '';
    const menu = m._tmp ? (m._failed ? '<button type="button" class="sl-msg-menu" data-act="retry" data-id="' + esc(m.id) + '" aria-label="تلاش دوباره" title="تلاش دوباره">↻</button>' : '') : '<button type="button" class="sl-msg-menu" data-act="menu" data-id="' + esc(m.id) + '" aria-label="گزینه‌های پیام">⋯</button>';
    return '<div class="sl-msg ' + (mine ? 'mine' : 'theirs') + (grouped ? ' grouped' : '') + (m._tmp ? ' pending' : '') + (m._failed ? ' failed' : '') + (isNew ? ' sl-new' : '') + '" data-id="' + esc(m.id) + '"' + (delay != null ? ' style="--d:' + delay + 'ms"' : '') + '>' + av + '<div class="sl-bubble">' + inner + reactHTML + meta + '</div>' + menu + '</div>';
  };
  C.fmtSecs = (s) => fa(Math.floor(s / 60)) + ':' + fa(String(Math.floor(s % 60)).padStart(2, '0'));
  C.sorted = () => C.msgs.slice();

  C.renderMessages = function (toBottom, keepAnchor) {
    const box = $('.sl-msgs', C.root); if (!box) return;
    const prevH = box.scrollHeight, prevTop = box.scrollTop;
    let html = C.hasMore ? '<button type="button" class="sl-more" data-act="older">⬆ پیام‌های قدیمی‌تر</button>' : '';
    let last = '', prev = null;
    const total = C.msgs.length;
    C.msgs.forEach((m, i) => {
      const dk = dayKey(m.created_at);
      if (dk !== last) { html += '<div class="sl-day">' + esc(faDay(m.created_at)) + '</div>'; last = dk; prev = null; }
      html += C.msgHTML(m, prev, toBottom && i >= total - 7, (i - Math.max(0, total - 7)) * 55); prev = m;
    });
    if (!total) html = '<div class="sl-empty"><div class="big">👋</div><b>' + (C.cur.kind === 'channel' ? 'هنوز پیامی در این کانال نیست' : 'گفتگو را شروع کنید') + '</b><span>' + (C.canPost(C.cur) ? 'اولین پیام را بفرستید.' : '') + '</span></div>';
    html += '<div class="sl-typing"><i></i><i></i><i></i></div>';
    box.innerHTML = html;
    C.hydrateMedia(); C.renderPinned();
    if (toBottom) box.scrollTop = box.scrollHeight; else if (keepAnchor) box.scrollTop = prevTop + (box.scrollHeight - prevH); else box.scrollTop = prevTop;
    C.renderTypingState();
  };
  C.appendMsg = function (m, forceScroll) {
    const box = $('.sl-msgs', C.root); if (!box) return;
    const emptyEl = $('.sl-empty', box); if (emptyEl) emptyEl.remove();
    const idx = C.msgs.findIndex((x) => x === m || String(x.id) === String(m.id));
    const prev = idx > 0 ? C.msgs[idx - 1] : null;
    let html = '';
    if (!prev || dayKey(prev.created_at) !== dayKey(m.created_at)) html += '<div class="sl-day">' + esc(faDay(m.created_at)) + '</div>';
    html += C.msgHTML(m, prev && dayKey(prev.created_at) === dayKey(m.created_at) ? prev : null, true);
    const typing = $('.sl-typing', box);
    if (typing) typing.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
    C.hydrateMedia();
    const mine = m.sender_id === S.me.id;
    if (C.stick || forceScroll || mine) { box.scrollTop = box.scrollHeight; } else { C.newBelow++; const j = $('.sl-jump', C.root); if (j) { j.classList.add('show'); const b = $('b', j); b.hidden = false; b.textContent = fa(C.newBelow); } }
  };
  C.updateMsgNode = function (m) {
    const node = $('.sl-msg[data-id="' + String(m.id).replace(/"/g, '') + '"]', C.root); if (!node) return;
    const i = C.msgs.findIndex((x) => String(x.id) === String(m.id));
    const tpl = document.createElement('div'); tpl.innerHTML = C.msgHTML(m, i > 0 ? C.msgs[i - 1] : null, false);
    node.replaceWith(tpl.firstElementChild); C.hydrateMedia();
  };
  C.refreshTicks = function () {
    if (!C.cur || C.cur.kind !== 'direct') return;
    const other = C.otherMember(); if (!other) return;
    C.msgs.forEach((m) => { if (m.sender_id !== S.me.id || m._tmp) return; const t = $('.sl-msg[data-id="' + m.id + '"] .sl-tick', C.root); if (!t) return; const seen = Date.parse(other.last_read_at) >= Date.parse(m.created_at); t.textContent = seen ? '✓✓' : '✓'; t.classList.toggle('seen', seen); });
  };
  C.refreshReactions = async function () {
    if (!C.cur) return;
    const ids = C.msgs.filter((m) => !m._tmp).map((m) => m.id); if (!ids.length) return;
    const before = JSON.stringify(Array.from(C.reacts.entries()));
    await C.loadReactionsFor(ids);
    if (JSON.stringify(Array.from(C.reacts.entries())) === before) return;
    C.msgs.forEach((m) => { if (!m._tmp) C.updateMsgNode(m); });
  };

  /* ============ خواندن، اشتراک اتاق، تایپ ============ */
  let marking = false;
  C.markRead = async function (force) {
    const r = C.cur; if (!r || r.member === false || marking || !S.me) return;
    r.unread = 0; C.recount(); C.renderRooms();
    const last = C.msgs.filter((m) => !m._tmp).slice(-1)[0]; if (!last) return;
    if (!force && r.lastRead && last.created_at <= r.lastRead) return;
    marking = true; r.lastRead = last.created_at;
    try { await S.db.from('chat_members').update({ last_read_at: last.created_at }).eq('room_id', r.id).eq('user_id', S.me.id); } finally { marking = false; }
  };
  C.subscribeRoom = function () {
    const id = C.cur.id, ch = S.db.channel('room-' + id, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'typing' }, (msg) => {
      const p = msg && msg.payload; if (!p || p.uid === S.me.id) return;
      let m = C.typing.get(id); if (!m) C.typing.set(id, (m = new Map()));
      m.set(p.uid, { name: p.name, t: Date.now() }); C.renderTypingState(); C.renderRooms();
      setTimeout(() => { C.renderTypingState(); C.renderRooms(); }, 4700);
    });
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reactions', filter: 'room_id=eq.' + id }, () => C.refreshReactions());
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members', filter: 'room_id=eq.' + id }, () => C.loadMembers().then(() => { C.renderConvHead(); C.refreshTicks(); }));
    ch.subscribe(); C.roomCh = ch;
  };
  C.sendTyping = throttle(() => { if (C.roomCh && S.me) C.roomCh.send({ type: 'broadcast', event: 'typing', payload: { uid: S.me.id, name: S.me.full_name } }); }, 2500);

  /* ============ نوار ارسال ============ */
  C.renderComposer = function () {
    const slot = $('.sl-compose-slot', C.root), r = C.cur; if (!slot || !r) return;
    const old = $('.sl-compose textarea', C.root); const keep = old ? old.value : '';
    if (r.member === false) { slot.innerHTML = '<div class="sl-locked">شما عضو این ' + roomKindFa[r.kind] + ' نیستید (نمایش برای نظارت) <button type="button" class="sl-btn" data-act="joinmod">پیوستن به‌عنوان مدیر</button></div>'; return; }
    if (!C.canPost(r)) { slot.innerHTML = '<div class="sl-locked">🔒 فقط مدیران این ' + roomKindFa[r.kind] + ' می‌توانند پیام بگذارند.</div>'; return; }
    if (C.rec) {
      slot.innerHTML = '<div class="sl-compose"><button type="button" class="sl-iconbtn" data-act="rec-cancel" aria-label="لغو ضبط">🗑</button><div class="sl-rec"><i></i><span class="t">۰:۰۰</span><span style="flex:1"></span><span style="font-weight:700">در حال ضبط…</span></div><button type="button" class="sl-iconbtn solid" data-act="rec-send" aria-label="ارسال پیام صوتی">➤</button></div>';
      return;
    }
    slot.innerHTML = '<div class="sl-compose"><button type="button" class="sl-iconbtn" data-act="emoji" aria-label="ایموجی" title="ایموجی">😊</button>' +
      '<button type="button" class="sl-iconbtn" data-act="attach" aria-label="پیوست فایل یا تصویر" title="پیوست">📎</button>' +
      '<textarea rows="1" placeholder="پیام خود را بنویسید…" aria-label="متن پیام" maxlength="4000"></textarea>' +
      '<button type="button" class="sl-iconbtn sl-mic" data-act="rec-start" aria-label="ضبط پیام صوتی" title="پیام صوتی">🎤</button>' +
      '<button type="button" class="sl-iconbtn solid sl-send" data-act="send" aria-label="ارسال">➤</button>' +
      '<input type="file" class="sl-file-in" hidden multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,audio/*"></div>';
    const ta = $('.sl-compose textarea', C.root);
    if (keep) ta.value = keep;
    ta.addEventListener('input', () => { C.syncCompose(); if (ta.value.trim()) C.sendTyping(); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in global)) { e.preventDefault(); C.sendText(); } if (e.key === 'Escape' && (C.replyTo || C.editing)) C.clearBar(); });
    ta.addEventListener('paste', (e) => { const f = Array.from((e.clipboardData && e.clipboardData.files) || []); if (f.length) { e.preventDefault(); C.sendFiles(f); } });
    $('.sl-file-in', C.root).addEventListener('change', (e) => { C.sendFiles(Array.from(e.target.files)); e.target.value = ''; });
    C.syncCompose(); C.renderBar();
  };
  C.syncCompose = function () {
    const ta = $('.sl-compose textarea', C.root); if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    $('.sl-compose', C.root).classList.toggle('has-text', ta.value.trim().length > 0);
  };
  C.renderBar = function () {
    const slot = $('.sl-bar-slot', C.root); if (!slot) return;
    const t = C.editing ? { icon: '✏️', title: 'ویرایش پیام', text: C.editing.body } : C.replyTo ? { icon: '↩️', title: 'پاسخ به ' + C.replyTo.sender_name, text: C.previewOf(C.replyTo) } : null;
    slot.innerHTML = t ? '<div class="sl-bar">' + t.icon + ' <b>' + esc(t.title) + '</b><span>' + esc(t.text) + '</span><button type="button" data-act="bar-close" aria-label="بستن">✕</button></div>' : '';
  };
  C.clearBar = function () { C.replyTo = null; if (C.editing) { C.editing = null; const ta = $('.sl-compose textarea', C.root); if (ta) { ta.value = ''; C.syncCompose(); } } C.renderBar(); };

  /* ============ ارسال ============ */
  C.sendText = async function () {
    const ta = $('.sl-compose textarea', C.root), r = C.cur; if (!ta || !r) return;
    const body = ta.value.trim(); if (!body) return;
    if (C.editing) return C.saveEdit(body);
    const reply = C.replyTo;
    ta.value = ''; C.syncCompose(); C.drafts.delete(r.id); C.replyTo = null; C.renderBar();
    const tmp = { id: 'tmp-' + uuid(), _tmp: true, room_id: r.id, sender_id: S.me.id, sender_name: S.me.full_name, kind: 'text', body, reply_to: reply ? reply.id : null, created_at: new Date().toISOString() };
    C.msgs.push(tmp); C.appendMsg(tmp, true);
    const res = await S.db.from('chat_messages').insert({ room_id: r.id, sender_id: S.me.id, body, kind: 'text', reply_to: reply ? reply.id : null }).select().single();
    C.finishSend(tmp, res);
  };
  C.finishSend = function (tmp, res) {
    const node = $('.sl-msg[data-id="' + tmp.id + '"]', C.root);
    if (res.error || !res.data) { tmp._failed = true; tmp._uploading = false; C.updateMsgNode(tmp); toast({ title: 'ارسال نشد', text: 'دوباره تلاش کنید.', icon: '⚠️' }); return; }
    const real = res.data, i = C.msgs.indexOf(tmp), dup = C.msgs.some((x) => String(x.id) === String(real.id));
    if (i > -1) { if (dup) C.msgs.splice(i, 1); else C.msgs[i] = real; }
    if (node) { if (dup) node.remove(); else { const t = document.createElement('div'); t.innerHTML = C.msgHTML(real, i > 0 ? C.msgs[i - 1] : null, false); node.replaceWith(t.firstElementChild); C.hydrateMedia(); } }
    C.cur.lastAt = real.created_at; C.cur.preview = C.previewOf(real); C.renderRooms();
  };
  C.retry = async function (id) {
    const m = C.msgs.find((x) => String(x.id) === String(id)); if (!m || !m._failed) return;
    m._failed = false; C.updateMsgNode(m);
    const res = await S.db.from('chat_messages').insert({ room_id: m.room_id, sender_id: S.me.id, body: m.body, kind: 'text', reply_to: m.reply_to }).select().single();
    C.finishSend(m, res);
  };
  C.saveEdit = async function (body) {
    const m = C.editing; C.editing = null; const ta = $('.sl-compose textarea', C.root); ta.value = ''; C.syncCompose(); C.renderBar();
    if (!m || body === m.body) return;
    const old = m.body; m.body = body; m.edited_at = new Date().toISOString(); C.updateMsgNode(m);
    const res = await S.db.from('chat_messages').update({ body }).eq('id', m.id);
    if (res.error) { m.body = old; m.edited_at = null; C.updateMsgNode(m); toast({ title: 'ویرایش انجام نشد', icon: '⚠️' }); }
  };
  C.sendFiles = async function (files) { for (const f of files) await C.sendFile(f); };
  C.shrink = async function (file) {
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 450 * 1024) return file;
      const bmp = await createImageBitmap(file), sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.86));
      return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
    } catch (e) { return file; }
  };
  C.upload = async function (file, ext) {
    const path = C.cur.id + '/' + uuid() + '.' + ext;
    const up = await S.db.storage.from('chat-files').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (up.error) throw up.error;
    return path;
  };
  C.sendFile = async function (file) {
    const r = C.cur; if (!r || !C.canPost(r)) return;
    if (file.size > 10 * 1024 * 1024) return toast({ title: 'حجم فایل بیشتر از ۱۰ مگابایت است', text: file.name, icon: '⚠️' });
    const isImg = /^image\//.test(file.type), f = isImg ? await C.shrink(file) : file;
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
    const tmp = { id: 'tmp-' + uuid(), _tmp: true, _uploading: true, room_id: r.id, sender_id: S.me.id, sender_name: S.me.full_name, kind: isImg ? 'image' : 'file', attachment_path: '', attachment_name: file.name, attachment_size: f.size, created_at: new Date().toISOString() };
    C.msgs.push(tmp); C.appendMsg(tmp, true);
    try {
      const path = await C.upload(f, ext);
      const res = await S.db.from('chat_messages').insert({ room_id: r.id, sender_id: S.me.id, kind: tmp.kind, attachment_path: path, attachment_name: file.name.slice(0, 120), attachment_type: f.type || null, attachment_size: f.size }).select().single();
      tmp._uploading = false; C.finishSend(tmp, res);
    } catch (e) { tmp._failed = true; tmp._uploading = false; C.updateMsgNode(tmp); toast({ title: 'ارسال فایل ناموفق بود', text: 'فرمت یا حجم فایل مجاز نیست.', icon: '⚠️' }); }
  };

  /* ============ پیام صوتی ============ */
  C.startRec = async function () {
    if (!navigator.mediaDevices || !global.MediaRecorder) return toast({ title: 'مرورگر شما از ضبط صدا پشتیبانی نمی‌کند', icon: '🎤' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      C.rec = { rec, stream, chunks, t0: Date.now(), mime: rec.mimeType || mime || 'audio/webm' };
      rec.start(); C.renderComposer();
      C.rec.timer = setInterval(() => { const t = $('.sl-rec .t', C.root); if (t && C.rec) t.textContent = C.fmtSecs((Date.now() - C.rec.t0) / 1000); if (C.rec && Date.now() - C.rec.t0 > 300000) C.stopRec(true); }, 250);
    } catch (e) { toast({ title: 'دسترسی به میکروفون داده نشد', text: 'اجازهٔ میکروفون را در مرورگر فعال کنید.', icon: '🎤' }); }
  };
  C.cancelRec = function (silent) {
    const x = C.rec; if (!x) return; C.rec = null; clearInterval(x.timer);
    try { x.rec.onstop = null; x.rec.stop(); } catch (e) { /* ignore */ } x.stream.getTracks().forEach((t) => t.stop());
    if (!silent) C.renderComposer();
  };
  C.stopRec = function (send) {
    const x = C.rec; if (!x) return;
    if (!send) return C.cancelRec();
    C.rec = null; clearInterval(x.timer);
    x.rec.onstop = async () => {
      x.stream.getTracks().forEach((t) => t.stop());
      const secs = Math.max(1, Math.round((Date.now() - x.t0) / 1000));
      const ext = /mp4/.test(x.mime) ? 'm4a' : /ogg/.test(x.mime) ? 'ogg' : 'webm';
      const file = new File(x.chunks, 'voice.' + ext, { type: x.mime.split(';')[0] });
      const r = C.cur; if (!r) return;
      const tmp = { id: 'tmp-' + uuid(), _tmp: true, _uploading: true, room_id: r.id, sender_id: S.me.id, sender_name: S.me.full_name, kind: 'voice', attachment_path: '', attachment_seconds: secs, created_at: new Date().toISOString() };
      C.msgs.push(tmp); C.appendMsg(tmp, true);
      try {
        const path = await C.upload(file, ext);
        const res = await S.db.from('chat_messages').insert({ room_id: r.id, sender_id: S.me.id, kind: 'voice', attachment_path: path, attachment_name: 'voice.' + ext, attachment_type: file.type, attachment_size: file.size, attachment_seconds: secs }).select().single();
        tmp._uploading = false; C.finishSend(tmp, res);
      } catch (e) { tmp._failed = true; C.updateMsgNode(tmp); toast({ title: 'ارسال پیام صوتی ناموفق بود', icon: '🎤' }); }
    };
    C.renderComposer(); try { x.rec.stop(); } catch (e) { /* ignore */ }
  };
  C.play = async function (btn) {
    const box = btn.closest('.sl-voice'), path = box.dataset.path;
    if (C.audio && C.audio.path === path && !C.audio.el.paused) { C.audio.el.pause(); btn.textContent = '▶'; return; }
    if (C.audio) { C.audio.el.pause(); const pb = $('.sl-play', C.audio.box); if (pb) pb.textContent = '▶'; }
    const urls = await C.signed([path]), c = urls.get(path); if (!c) return;
    const el = new Audio(c.url); C.audio = { el, path, box };
    const bars = $$('.sl-wave i', box);
    el.ontimeupdate = () => { const p = el.duration ? el.currentTime / el.duration : 0; bars.forEach((b, i) => b.classList.toggle('on', i / bars.length < p)); };
    el.onended = () => { btn.textContent = '▶'; bars.forEach((b) => b.classList.remove('on')); };
    btn.textContent = '❚❚'; el.play().catch(() => { btn.textContent = '▶'; });
  };

  /* ============ منوی پیام و عملیات ============ */
  C.msgMenu = function (id, btn) {
    const m = C.msgs.find((x) => String(x.id) === String(id)); if (!m || m.deleted_at) return;
    const r = C.cur, mine = m.sender_id === S.me.id, admin = C.isAdmin(r), member = r.member !== false;
    const items = [];
    if (member && C.canPost(r)) items.push(['reply', '↩️', 'پاسخ']);
    if (m.kind === 'text') items.push(['copy', '📋', 'رونوشت متن']);
    if (mine && m.kind === 'text' && member) items.push(['edit', '✏️', 'ویرایش']);
    if (member && (admin || r.kind === 'direct')) items.push(['pin', '📌', m.pinned ? 'برداشتن پین' : 'پین کردن']);
    items.push(['info', 'ℹ️', 'اطلاعات پیام']);
    if (mine || admin) items.push(['delete', '🗑️', 'حذف پیام', true]);
    const html = (member ? '<div class="sl-quick">' + QUICK.map((e) => '<button type="button" data-act="react" data-id="' + esc(m.id) + '" data-emoji="' + e + '" aria-label="واکنش ' + e + '">' + e + '</button>').join('') + '</div>' : '') +
      items.map((i) => '<button type="button" class="sl-menu-i ' + (i[3] ? 'danger' : '') + '" data-act="m-' + i[0] + '" data-id="' + esc(m.id) + '"><span>' + i[1] + '</span>' + i[2] + '</button>').join('');
    C.pop(html, btn.getBoundingClientRect(), { alignRight: !!btn.closest('.sl-msg.mine') });
  };
  C.toggleReaction = async function (mid, emoji) {
    const m = C.msgs.find((x) => String(x.id) === String(mid)); if (!m || m._tmp || C.cur.member === false) return;
    const arr = (C.reacts.get(m.id) || []).slice(), i = arr.findIndex((x) => x.user_id === S.me.id && x.emoji === emoji);
    if (i > -1) { arr.splice(i, 1); C.reacts.set(m.id, arr); C.updateMsgNode(m); await S.db.from('chat_reactions').delete().eq('message_id', m.id).eq('user_id', S.me.id).eq('emoji', emoji); }
    else { arr.push({ message_id: m.id, user_id: S.me.id, emoji }); C.reacts.set(m.id, arr); C.updateMsgNode(m); const res = await S.db.from('chat_reactions').insert({ message_id: m.id, user_id: S.me.id, emoji }); if (res.error) { C.refreshReactions(); } }
  };
  C.deleteMsg = function (id) {
    const m = C.msgs.find((x) => String(x.id) === String(id)); if (!m) return;
    const md = C.modal('<div class="sl-modal-head"><h4>حذف پیام</h4></div><div class="sl-modal-body"><p style="margin:0;line-height:2">این پیام برای همهٔ اعضا حذف می‌شود و قابل بازگشت نیست.</p></div><div class="sl-modal-foot"><button type="button" class="sl-btn ghost" data-close>انصراف</button><button type="button" class="sl-btn danger" data-go>حذف</button></div>');
    $('[data-go]', md.el).addEventListener('click', async () => {
      md.close(); const res = await S.db.from('chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', m.id);
      if (res.error) return toast({ title: 'حذف انجام نشد', icon: '⚠️' });
      m.deleted_at = new Date().toISOString(); m.body = null; m.pinned = false; C.updateMsgNode(m); C.loadPinned();
      if (m.attachment_path) S.db.storage.from('chat-files').remove([m.attachment_path]);
    });
  };
  C.msgInfo = function (id) {
    const m = C.msgs.find((x) => String(x.id) === String(id)); if (!m) return;
    const readers = C.members.filter((x) => x.user_id !== m.sender_id && Date.parse(x.last_read_at) >= Date.parse(m.created_at));
    C.modal('<div class="sl-modal-head"><h4>اطلاعات پیام</h4><button type="button" class="sl-iconbtn" data-close aria-label="بستن">✕</button></div><div class="sl-modal-body">' +
      '<div class="sl-row"><span>فرستنده</span><b>' + esc(m.sender_name) + '</b></div><div class="sl-row"><span>زمان</span><b>' + esc(faDay(m.created_at) + ' · ' + faTime(m.created_at)) + '</b></div>' +
      '<div><b>دیده‌شده توسط (' + fa(readers.length) + ')</b><div class="sl-people" style="margin-top:8px">' + (readers.length ? readers.map((p) => '<div class="sl-person">' + C.personAv(p.display_name) + '<div><b>' + esc(p.display_name) + '</b><small>' + esc(ROLE_FA[p.user_role] || '') + '</small></div></div>').join('') : '<span style="color:var(--muted)">هنوز کسی ندیده است.</span>') + '</div></div></div>');
  };
  C.jumpTo = async function (id) {
    const find = () => $('.sl-msg[data-id="' + String(id) + '"]', C.root);
    let n = find(), guard = 0;
    while (!n && C.hasMore && guard++ < 12) { await C.loadMessages(true); C.renderMessages(false, true); n = find(); }
    if (!n) return toast({ title: 'پیام پیدا نشد', icon: 'ℹ️' });
    n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash');
  };

  /* ============ جستجو در گفتگو ============ */
  C.toggleSearch = function () {
    const slot = $('.sl-search-slot', C.root); if (!slot) return;
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = '<div class="sl-search-panel"><div class="sl-search"><input type="search" placeholder="جستجو در پیام‌های این گفتگو…" aria-label="جستجوی پیام"><i>🔍</i></div><div class="res"></div></div>';
    const inp = $('input', slot); inp.focus();
    const run = debounce(async () => {
      const q = inp.value.trim(), res = $('.res', slot);
      if (q.length < 2) { res.innerHTML = ''; return; }
      const esq = q.replace(/[\\%_]/g, (c) => '\\' + c);
      const r = await S.db.from('chat_messages').select('id,sender_name,body,created_at').eq('room_id', C.cur.id).is('deleted_at', null).ilike('body', '%' + esq + '%').order('id', { ascending: false }).limit(30);
      const rows = r.data || [];
      res.innerHTML = rows.length ? rows.map((x) => '<button type="button" class="sl-hit" data-act="hit" data-id="' + esc(x.id) + '"><b>' + esc(x.sender_name) + ' · ' + esc(faDay(x.created_at)) + '</b><span>' + esc(String(x.body)).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>') + '</span></button>').join('') : '<div class="sl-empty" style="padding:16px">چیزی پیدا نشد.</div>';
    }, 280);
    inp.addEventListener('input', run);
  };

  /* ============ منو و پنجره‌های ایجاد گفتگو ============ */
  C.newMenu = function (btn) {
    const staff = S.me && (S.me.role === 'manager' || S.me.role === 'teacher');
    C.pop('<button type="button" class="sl-menu-i" data-act="n-direct"><span>💬</span>گفتگوی تازه</button>' +
      (staff ? '<button type="button" class="sl-menu-i" data-act="n-group"><span>👥</span>گروه جدید</button><button type="button" class="sl-menu-i" data-act="n-channel"><span>📣</span>کانال جدید</button>' : ''), btn.getBoundingClientRect(), { alignRight: true });
  };
  C.newDirect = async function () {
    const md = C.modal('<div class="sl-modal-head"><h4>گفتگوی تازه</h4><button type="button" class="sl-iconbtn" data-close aria-label="بستن">✕</button></div><div class="sl-modal-body"><div class="sl-search"><input type="search" placeholder="جستجوی نام…" aria-label="جستجوی افراد"><i>🔍</i></div><div class="sl-people"><div class="sl-spin"></div></div></div>');
    const list = $('.sl-people', md.el), inp = $('input', md.el);
    let dir = [];
    try { dir = await C.directory(true) || []; }
    catch (err) { list.innerHTML = '<div class="sl-empty" style="padding:20px">بارگذاری فهرست افراد ناموفق بود. پنجره را ببند و دوباره تلاش کن.</div>'; console.error('chat directory load failed', err); return; }
    if (!md.el.isConnected) return;
    const draw = () => {
      const q = inp.value.trim().toLocaleLowerCase();
      const rows = dir.filter((d) => !q || String(d.full_name || '').toLocaleLowerCase().includes(q));
      list.innerHTML = rows.length ? rows.map((d) => '<button type="button" class="sl-person" data-uid="' + esc(d.user_id) + '">' + C.personAv(d.full_name) + '<div><b>' + esc(d.full_name) + '</b><small>' + esc(ROLE_FA[d.role] || '') + (d.class_name ? ' · ' + esc(d.grade + ' ' + d.class_name) : '') + '</small></div></button>').join('') : '<div class="sl-empty" style="padding:20px">کسی پیدا نشد.</div>';
    };
    draw(); inp.addEventListener('input', draw);
    let choosing = false;
    list.addEventListener('click', async (e) => {
      const p = e.target.closest('.sl-person[data-uid]');
      if (!p || choosing) return;
      choosing = true; p.disabled = true; p.setAttribute('aria-busy', 'true');
      try { md.close(); await C.startDirect(p.dataset.uid); }
      catch (err) { console.error('start direct chat failed', err); toast({ title: 'باز کردن گفتگو ناموفق بود', text: 'اتصال را بررسی کن و دوباره تلاش کن.', icon: '⚠️' }); }
    });
  };
  C.startDirect = async function (uid) {
    if (!uid || !S.me || uid === S.me.id) return;
    const key = [S.me.id, uid].sort().join(':');
    let room = C.rooms.find((r) => r.key === key);
    if (!room) {
      const id = uuid();
      const res = await S.db.from('chat_rooms').insert({ id, kind: 'direct', direct_key: key });
      if (res.error && res.error.code !== '23505') return toast({ title: 'شروع گفتگو ممکن نشد', text: 'اجازهٔ پیام دادن به این فرد را ندارید.', icon: '⚠️' });
      await C.loadRooms(); room = C.rooms.find((r) => r.key === key);
    }
    C.filter = 'all'; C.renderFilters(); C.renderRooms();
    if (room) C.openRoom(room.id);
  };
  C.newGroup = async function (kind) {
    const isCh = kind === 'channel';
    let sel = new Set(), color = COLORS[isCh ? 0 : 1], chosenKind = kind;
    const md = C.modal('<div class="sl-modal-head"><h4>' + (isCh ? 'کانال جدید' : 'گروه جدید') + '</h4><button type="button" class="sl-iconbtn" data-close aria-label="بستن">✕</button></div><div class="sl-modal-body">' +
      '<div class="sl-seg"><button type="button" data-kind="group" class="' + (isCh ? '' : 'on') + '">👥 گروه<small>همه می‌توانند پیام بدهند</small></button><button type="button" data-kind="channel" class="' + (isCh ? 'on' : '') + '">📣 کانال<small>فقط مدیران پیام می‌گذارند</small></button></div>' +
      '<div class="sl-field"><label for="slg-title">نام</label><input id="slg-title" maxlength="80" placeholder="مثلاً: کلاس نهم، اطلاعیه‌های مدرسه"></div>' +
      '<div class="sl-field"><label for="slg-desc">توضیح (اختیاری)</label><textarea id="slg-desc" rows="2" maxlength="300"></textarea></div>' +
      '<div class="sl-field"><label>رنگ</label><div class="sl-swatches">' + COLORS.map((c) => '<button type="button" data-color="' + c + '" style="--c:' + c + '" class="' + (c === color ? 'on' : '') + '" aria-label="رنگ"></button>').join('') + '</div></div>' +
      '<div class="sl-field"><label>اعضا — انتخاب سریع</label><div class="sl-chips"></div></div>' +
      '<div class="sl-search"><input class="sl-find" type="search" placeholder="جستجو و انتخاب افراد…" aria-label="جستجوی افراد"><i>🔍</i></div><div class="sl-people"><div class="sl-spin"></div></div><small class="sl-count" style="color:var(--muted)"></small></div>' +
      '<div class="sl-modal-foot"><button type="button" class="sl-btn ghost" data-close>انصراف</button><button type="button" class="sl-btn" data-go>ساخت</button></div>');
    const el = md.el, dir = await C.directory(true), list = $('.sl-people', el), find = $('.sl-find', el), chips = $('.sl-chips', el);
    const groups = [];
    const T = dir.filter((d) => d.role === 'teacher' || d.role === 'manager'), St = dir.filter((d) => d.role === 'student'), Pa = dir.filter((d) => d.role === 'parent');
    if (T.length) groups.push(['همهٔ معلمان و مدیران', T]); if (St.length) groups.push(['همهٔ دانش‌آموزان', St]); if (Pa.length) groups.push(['همهٔ والدین', Pa]);
    Array.from(new Set(St.map((d) => d.grade + '|' + d.class_name))).forEach((k) => { const [g, c] = k.split('|'); groups.push(['دانش‌آموزان ' + g + ' ' + c, St.filter((d) => d.grade === g && d.class_name === c)]); const pp = Pa.filter((d) => d.grade === g && d.class_name === c); if (pp.length) groups.push(['والدین ' + g + ' ' + c, pp]); });
    const drawChips = () => { chips.innerHTML = groups.map((g, i) => '<button type="button" data-g="' + i + '" class="' + (g[1].every((d) => sel.has(d.user_id)) ? 'on' : '') + '">' + esc(g[0]) + ' (' + fa(g[1].length) + ')</button>').join('') || '<span style="color:var(--muted);font-size:13px">فهرست افراد خالی است.</span>'; };
    const draw = () => {
      const q = find.value.trim();
      list.innerHTML = dir.filter((d) => !q || d.full_name.includes(q)).map((d) => '<button type="button" class="sl-person ' + (sel.has(d.user_id) ? 'on' : '') + '" data-uid="' + esc(d.user_id) + '">' + C.personAv(d.full_name) + '<div><b>' + esc(d.full_name) + '</b><small>' + esc(ROLE_FA[d.role] || '') + (d.class_name ? ' · ' + esc(d.grade + ' ' + d.class_name) : '') + '</small></div><span class="chk">✓</span></button>').join('') || '<div class="sl-empty" style="padding:18px">کسی پیدا نشد.</div>';
      $('.sl-count', el).textContent = fa(sel.size) + ' نفر انتخاب شده';
    };
    drawChips(); draw(); find.addEventListener('input', draw);
    el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-kind]'); if (k) { chosenKind = k.dataset.kind; $$('[data-kind]', el).forEach((b) => b.classList.toggle('on', b === k)); return; }
      const c = e.target.closest('[data-color]'); if (c) { color = c.dataset.color; $$('[data-color]', el).forEach((b) => b.classList.toggle('on', b === c)); return; }
      const g = e.target.closest('[data-g]'); if (g) { const grp = groups[+g.dataset.g][1], all = grp.every((d) => sel.has(d.user_id)); grp.forEach((d) => (all ? sel.delete(d.user_id) : sel.add(d.user_id))); drawChips(); draw(); return; }
      const p = e.target.closest('.sl-person[data-uid]'); if (p) { const id = p.dataset.uid; sel.has(id) ? sel.delete(id) : sel.add(id); drawChips(); draw(); }
    });
    $('[data-go]', el).addEventListener('click', async (e) => {
      const title = $('#slg-title', el).value.trim(); if (!title) { $('#slg-title', el).focus(); return toast({ title: 'نام ' + (chosenKind === 'channel' ? 'کانال' : 'گروه') + ' را وارد کنید', icon: '✏️' }); }
      const btn = e.target; btn.disabled = true; btn.textContent = 'در حال ساخت…';
      const id = uuid();
      const res = await S.db.from('chat_rooms').insert({ id, kind: chosenKind, title, description: $('#slg-desc', el).value.trim() || null, color });
      if (res.error) { btn.disabled = false; btn.textContent = 'ساخت'; return toast({ title: 'ساخت انجام نشد', text: res.error.message, icon: '⚠️' }); }
      const ids = Array.from(sel);
      for (let i = 0; i < ids.length; i += 100) {
        const rr = await S.db.from('chat_members').insert(ids.slice(i, i + 100).map((u) => ({ room_id: id, user_id: u, role: 'member' })));
        if (rr.error) toast({ title: 'افزودن بعضی اعضا ممکن نشد', text: rr.error.message, icon: '⚠️' });
      }
      md.close(); await C.loadRooms(); C.filter = 'all'; C.renderFilters(); C.renderRooms(); C.openRoom(id);
      toast({ title: (chosenKind === 'channel' ? 'کانال' : 'گروه') + ' ساخته شد', text: title, icon: '🎉' });
    });
  };

  /* ============ اطلاعات گفتگو و مدیریت اعضا ============ */
  C.info = async function () {
    const r = C.cur; if (!r) return;
    await C.loadMembers();
    const me = C.members.find((x) => x.user_id === S.me.id), admin = C.isAdmin(r), isOwner = (me && me.role === 'owner') || (S.me.role === 'manager' && r.kind !== 'direct');
    const roleChip = (x) => (x.role === 'owner' ? '<span class="sl-tag">سازنده</span>' : x.role === 'admin' ? '<span class="sl-tag">مدیر</span>' : '');
    const memberRows = C.members.slice().sort((a, b) => ({ owner: 0, admin: 1, member: 2 }[a.role] - { owner: 0, admin: 1, member: 2 }[b.role]) || a.display_name.localeCompare(b.display_name, 'fa')).map((x) =>
      '<div class="sl-person" style="cursor:default">' + C.personAv(x.display_name) + '<div><b>' + esc(x.display_name) + (x.user_id === S.me.id ? ' (شما)' : '') + '</b><small>' + esc(ROLE_FA[x.user_role] || '') + '</small></div>' + roleChip(x) +
      (admin && r.kind !== 'direct' && x.user_id !== S.me.id && x.role !== 'owner' ? '<button type="button" class="sl-iconbtn" style="width:34px;height:34px" data-act="mem-role" data-uid="' + esc(x.user_id) + '" data-role="' + (x.role === 'admin' ? 'member' : 'admin') + '" title="' + (x.role === 'admin' ? 'تنزل به عضو' : 'ارتقا به مدیر') + '">' + (x.role === 'admin' ? '⬇' : '⭐') + '</button><button type="button" class="sl-iconbtn" style="width:34px;height:34px;color:var(--danger)" data-act="mem-del" data-uid="' + esc(x.user_id) + '" title="حذف از ' + roomKindFa[r.kind] + '">✕</button>' : '') + '</div>').join('');
    const md = C.modal('<div class="sl-modal-head"><h4>اطلاعات ' + roomKindFa[r.kind] + '</h4><button type="button" class="sl-iconbtn" data-close aria-label="بستن">✕</button></div><div class="sl-modal-body">' +
      '<div class="sl-info-hero">' + C.avatar(r) + '<h4>' + esc(C.roomTitle(r)) + '</h4><p>' + (r.kind === 'direct' ? esc(r.other ? ROLE_FA[r.other.role] || '' : '') : esc(r.desc || roomKindFa[r.kind] + ' · ' + fa(C.members.length) + ' عضو')) + '</p></div>' +
      (admin && r.kind !== 'direct' && r.member !== false ? '<div class="sl-field"><label>نام</label><input class="i-title" maxlength="80" value="' + esc(r.title) + '"></div><div class="sl-field"><label>توضیح</label><textarea class="i-desc" rows="2" maxlength="300">' + esc(r.desc || '') + '</textarea></div><button type="button" class="sl-btn" data-act="i-save" style="align-self:flex-start">ذخیرهٔ تغییرات</button>' : '') +
      (r.member !== false ? '<div class="sl-row"><b>🔕 بی‌صدا کردن اعلان‌ها</b><button type="button" class="sl-switch ' + (r.muted ? 'on' : '') + '" data-act="i-mute" role="switch" aria-checked="' + !!r.muted + '" aria-label="بی‌صدا"></button></div><div class="sl-row"><b>📌 سنجاق در بالای فهرست</b><button type="button" class="sl-switch ' + (r.pinned ? 'on' : '') + '" data-act="i-pin" role="switch" aria-checked="' + !!r.pinned + '" aria-label="سنجاق"></button></div>' : '') +
      (admin && r.kind === 'group' ? '<div class="sl-row"><b>🔒 فقط مدیران پیام بگذارند</b><button type="button" class="sl-switch ' + (r.adminsOnly ? 'on' : '') + '" data-act="i-only" role="switch" aria-checked="' + !!r.adminsOnly + '" aria-label="فقط مدیران"></button></div>' : '') +
      (r.kind !== 'direct' ? '<div style="display:flex;justify-content:space-between;align-items:center"><b>اعضا (' + fa(C.members.length) + ')</b>' + (admin ? '<button type="button" class="sl-btn" style="padding:8px 16px" data-act="mem-add">＋ افزودن</button>' : '') + '</div>' : '') +
      (r.kind !== 'direct' ? '<div class="sl-people">' + memberRows + '</div>' : '') +
      '</div><div class="sl-modal-foot">' + (r.kind !== 'direct' && r.member !== false ? '<button type="button" class="sl-btn ghost" data-act="i-leave">خروج از ' + roomKindFa[r.kind] + '</button>' : '') + (isOwner && r.kind !== 'direct' ? '<button type="button" class="sl-btn danger" data-act="i-delete">حذف ' + roomKindFa[r.kind] + '</button>' : '') + '</div>');
    md.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, db = S.db;
      if (act === 'i-save') { const title = $('.i-title', md.el).value.trim(); if (!title) return; const res = await db.from('chat_rooms').update({ title, description: $('.i-desc', md.el).value.trim() || null }).eq('id', r.id); if (res.error) return toast({ title: 'ذخیره نشد', icon: '⚠️' }); r.title = title; r.desc = $('.i-desc', md.el).value.trim() || null; C.renderConvHead(); C.renderRooms(); toast({ title: 'ذخیره شد', icon: '✅' }); }
      if (act === 'i-mute') { r.muted = !r.muted; b.classList.toggle('on', r.muted); await db.from('chat_members').update({ muted: r.muted }).eq('room_id', r.id).eq('user_id', S.me.id); C.recount(); C.renderRooms(); }
      if (act === 'i-pin') { r.pinned = !r.pinned; b.classList.toggle('on', r.pinned); await db.from('chat_members').update({ pinned: r.pinned }).eq('room_id', r.id).eq('user_id', S.me.id); C.renderRooms(); }
      if (act === 'i-only') { r.adminsOnly = !r.adminsOnly; b.classList.toggle('on', r.adminsOnly); await db.from('chat_rooms').update({ only_admins_post: r.adminsOnly }).eq('id', r.id); C.renderComposer(); }
      if (act === 'mem-role') { await db.from('chat_members').update({ role: b.dataset.role }).eq('room_id', r.id).eq('user_id', b.dataset.uid); md.close(); await C.info(); }
      if (act === 'mem-del') { await db.from('chat_members').delete().eq('room_id', r.id).eq('user_id', b.dataset.uid); md.close(); await C.info(); C.renderConvHead(); }
      if (act === 'mem-add') { md.close(); C.addMembers(); }
      if (act === 'i-leave') { md.close(); const res = await db.from('chat_members').delete().eq('room_id', r.id).eq('user_id', S.me.id); if (res.error) return toast({ title: 'خروج ممکن نشد', icon: '⚠️' }); C.closeRoom(); await C.loadRooms(); C.renderRooms(); }
      if (act === 'i-delete') { md.close(); const sure = C.modal('<div class="sl-modal-head"><h4>حذف ' + roomKindFa[r.kind] + '</h4></div><div class="sl-modal-body"><p style="margin:0;line-height:2">«' + esc(r.title) + '» و همهٔ پیام‌هایش برای همیشه حذف می‌شود.</p></div><div class="sl-modal-foot"><button type="button" class="sl-btn ghost" data-close>انصراف</button><button type="button" class="sl-btn danger" data-go>حذف برای همیشه</button></div>'); $('[data-go]', sure.el).addEventListener('click', async () => { sure.close(); const res = await db.from('chat_rooms').delete().eq('id', r.id); if (res.error) return toast({ title: 'حذف ممکن نشد', icon: '⚠️' }); C.closeRoom(); await C.loadRooms(); await C.loadModeration(); C.renderRooms(); }); }
    });
  };
  C.addMembers = async function () {
    const r = C.cur; const have = new Set(C.members.map((m) => m.user_id)); const sel = new Set();
    const md = C.modal('<div class="sl-modal-head"><h4>افزودن عضو</h4><button type="button" class="sl-iconbtn" data-close aria-label="بستن">✕</button></div><div class="sl-modal-body"><div class="sl-search"><input type="search" placeholder="جستجوی نام…" aria-label="جستجو"><i>🔍</i></div><div class="sl-people"><div class="sl-spin"></div></div></div><div class="sl-modal-foot"><button type="button" class="sl-btn" data-go>افزودن</button></div>');
    const dir = (await C.directory(true)).filter((d) => !have.has(d.user_id)), list = $('.sl-people', md.el), inp = $('input', md.el);
    const draw = () => { const q = inp.value.trim(); list.innerHTML = dir.filter((d) => !q || d.full_name.includes(q)).map((d) => '<button type="button" class="sl-person ' + (sel.has(d.user_id) ? 'on' : '') + '" data-uid="' + esc(d.user_id) + '">' + C.personAv(d.full_name) + '<div><b>' + esc(d.full_name) + '</b><small>' + esc(ROLE_FA[d.role] || '') + (d.class_name ? ' · ' + esc(d.grade + ' ' + d.class_name) : '') + '</small></div><span class="chk">✓</span></button>').join('') || '<div class="sl-empty" style="padding:18px">کسی برای افزودن نیست.</div>'; };
    draw(); inp.addEventListener('input', draw);
    list.addEventListener('click', (e) => { const p = e.target.closest('.sl-person'); if (!p) return; const id = p.dataset.uid; sel.has(id) ? sel.delete(id) : sel.add(id); draw(); });
    $('[data-go]', md.el).addEventListener('click', async () => {
      if (!sel.size) return; const ids = Array.from(sel);
      for (let i = 0; i < ids.length; i += 100) { const rr = await S.db.from('chat_members').insert(ids.slice(i, i + 100).map((u) => ({ room_id: r.id, user_id: u, role: 'member' }))); if (rr.error) toast({ title: 'افزودن بعضی اعضا ممکن نشد', text: rr.error.message, icon: '⚠️' }); }
      md.close(); await C.loadMembers(); C.renderConvHead(); toast({ title: fa(ids.length) + ' عضو اضافه شد', icon: '✅' });
    });
  };
  C.joinMod = async function () {
    const r = C.cur; if (!r) return;
    const res = await S.db.from('chat_members').insert({ room_id: r.id, user_id: S.me.id, role: 'admin' });
    if (res.error) return toast({ title: 'پیوستن ممکن نشد', icon: '⚠️' });
    await C.loadRooms(); C.mod = C.mod.filter((x) => x.id !== r.id); C.cur = null; C.renderRooms(); C.openRoom(r.id);
  };

  /* ============ کلیک‌ها در بخش گفتگو ============ */
  C.onConvClick = function (e) {
    const t = e.target, b = t.closest('[data-act]'); if (!b) { if (!t.closest('.sl-pop')) C.closePop(); return; }
    const act = b.dataset.act, id = b.dataset.id;
    switch (act) {
      case 'back': C.closeRoom(); break;
      case 'info': C.info(); break;
      case 'search': C.toggleSearch(); break;
      case 'send': C.sendText(); break;
      case 'attach': $('.sl-file-in', C.root).click(); break;
      case 'emoji': { const p = C.pop('<div class="sl-emoji-grid">' + EMOJIS.map((x) => '<button type="button" data-act="emoji-pick" data-e="' + x + '">' + x + '</button>').join('') + '</div>', b.getBoundingClientRect(), { above: true }); void p; break; }
      case 'emoji-pick': { const ta = $('.sl-compose textarea', C.root); if (ta) { const s = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, s) + b.dataset.e + ta.value.slice(ta.selectionEnd || s); ta.focus(); ta.setSelectionRange(s + b.dataset.e.length, s + b.dataset.e.length); C.syncCompose(); } break; }
      case 'rec-start': C.startRec(); break;
      case 'rec-cancel': C.cancelRec(); break;
      case 'rec-send': C.stopRec(true); break;
      case 'bar-close': C.clearBar(); break;
      case 'menu': C.msgMenu(id, b); break;
      case 'retry': C.retry(id); break;
      case 'react': C.closePop(); C.toggleReaction(id, b.dataset.emoji); break;
      case 'm-reply': { C.closePop(); const m = C.msgs.find((x) => String(x.id) === String(id)); if (m) { C.editing = null; C.replyTo = m; C.renderBar(); const ta = $('.sl-compose textarea', C.root); if (ta) ta.focus(); } break; }
      case 'm-copy': { C.closePop(); const m = C.msgs.find((x) => String(x.id) === String(id)); if (m && navigator.clipboard) navigator.clipboard.writeText(m.body || '').then(() => toast({ title: 'کپی شد', icon: '📋', ms: 1800 })); break; }
      case 'm-edit': { C.closePop(); const m = C.msgs.find((x) => String(x.id) === String(id)); if (m) { C.replyTo = null; C.editing = m; C.renderBar(); const ta = $('.sl-compose textarea', C.root); if (ta) { ta.value = m.body; C.syncCompose(); ta.focus(); } } break; }
      case 'm-pin': { C.closePop(); const m = C.msgs.find((x) => String(x.id) === String(id)); if (m) { const v = !m.pinned; m.pinned = v; C.updateMsgNode(m); S.db.from('chat_messages').update({ pinned: v }).eq('id', m.id).then((res) => { if (res.error) { m.pinned = !v; C.updateMsgNode(m); toast({ title: 'اجازهٔ پین کردن ندارید', icon: '⚠️' }); } else C.loadPinned(); }); } break; }
      case 'm-delete': C.closePop(); C.deleteMsg(id); break;
      case 'm-info': C.closePop(); C.msgInfo(id); break;
      case 'goto': case 'hit': case 'gopin': { if (act === 'hit') { const s = $('.sl-search-slot', C.root); s.innerHTML = ''; } C.jumpTo(id); break; }
      case 'older': { const box = $('.sl-msgs', C.root); b.textContent = '…'; C.loadMessages(true).then(() => C.renderMessages(false, true)); void box; break; }
      case 'jump': { const box = $('.sl-msgs', C.root); box.scrollTop = box.scrollHeight; C.newBelow = 0; break; }
      case 'zoom': { const lb = document.createElement('div'); lb.className = 'sl-lightbox'; lb.innerHTML = '<img alt="تصویر" src="' + esc(b.src) + '">'; lb.addEventListener('click', () => lb.remove()); C.root.appendChild(lb); break; }
      case 'play': C.play(b); break;
      case 'openfile': C.signed([b.dataset.path]).then((u) => { const c = u.get(b.dataset.path); if (c) window.open(c.url, '_blank', 'noopener'); }); break;
      case 'joinmod': C.joinMod(); break;
      case 'n-direct': C.closePop(); C.newDirect(); break;
      case 'n-group': C.closePop(); C.newGroup('group'); break;
      case 'n-channel': C.closePop(); C.newGroup('channel'); break;
      default: break;
    }
  };
})(window);

/* برنامهٔ هفتگی: جدول متحرک، نمایش زندهٔ زنگ فعلی و نمایش‌های دانش‌آموز، معلم، والد و مدیر */
(function (global) {
  'use strict';
  const L = global.SchoolLive;
  if (!L || L.schedule) return;
  const U = L.util, S = L.state;
  const { fa, esc, $, $$, injectCSS, hueOf, toast } = U;

  const DAYS = { 1: 'شنبه', 2: 'یکشنبه', 3: 'دوشنبه', 4: 'سه‌شنبه', 5: 'چهارشنبه', 6: 'پنجشنبه' };
  const JS2P = { 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6, 5: 0 };
  const PALETTE = [['#14b8b6', '#087f86'], ['#8b6cff', '#5a3fd6'], ['#3b8cf5', '#1f5fc4'], ['#2cb27a', '#15794f'], ['#f5a04e', '#d97514'], ['#ef5b60', '#c12a30'], ['#e052ab', '#a82a7d'], ['#6c7dff', '#4856d9']];
  const pal = (s) => PALETTE[hueOf(s || '') % PALETTE.length];
  const toMin = (t) => { const p = String(t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const hm = (t) => fa(String(t || '').slice(0, 5));

  injectCSS('sls-css', `
.sls{direction:rtl;display:flex;flex-direction:column;gap:16px;color:var(--ink,#12313a)}
.sls-hero{position:relative;overflow:hidden;border-radius:28px;padding:22px 22px 20px;color:#fff;background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86) 70%,#0a5f6a);box-shadow:0 20px 44px rgba(var(--brand-rgb,8,185,184),.32)}
.sls-hero::before,.sls-hero::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.14);animation:slsOrb 9s ease-in-out infinite}
.sls-hero::before{width:190px;height:190px;left:-50px;top:-70px}.sls-hero::after{width:130px;height:130px;right:-30px;bottom:-50px;animation-delay:-4s;background:rgba(255,255,255,.1)}
@keyframes slsOrb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,12px) scale(1.15)}}
.sls-hero>*{position:relative;z-index:1}
.sls-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sls-top h3{margin:0;font-size:21px;font-weight:900;color:#fff}
.sls-hero .sls-now b,.sls-hero .sls-now span{color:#fff}.sls-cell b,.sls-cell small{color:#fff}.sls-lesson .tx b{color:var(--ink,#12313a)}
.sls-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.2);backdrop-filter:blur(6px);font:800 12.5px inherit}
.sls-now{margin-top:14px;display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:20px;background:rgba(255,255,255,.17);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.25)}
.sls-now .ic{flex:none;width:50px;height:50px;border-radius:17px;display:grid;place-items:center;font-size:25px;background:rgba(255,255,255,.22);animation:slFloat 3.6s ease-in-out infinite}
.sls-now b{display:block;font-size:16px;font-weight:900}.sls-now span{font-size:13.5px;opacity:.92}
.sls-bar{height:7px;border-radius:7px;background:rgba(255,255,255,.25);margin-top:9px;overflow:hidden}.sls-bar i{display:block;height:100%;width:var(--p,0%);border-radius:7px;background:#fff;transition:width 1s var(--ease,ease)}
.sls-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none}.sls-tabs::-webkit-scrollbar{display:none}
.sls-tab{flex:none;min-width:74px;border:1px solid var(--line,#dfeaea);background:var(--surface,#fff);color:var(--ink,#12313a);border-radius:20px;padding:10px 14px 9px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;transition:transform .3s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)),box-shadow .25s,background .25s}
.sls-tab b{font-size:14px;font-weight:900}.sls-tab small{font-size:11px;color:var(--muted,#5f7a80);font-weight:700}
.sls-tab:hover{transform:translateY(-3px)}.sls-tab.on{background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86));color:#fff;border-color:transparent;box-shadow:0 12px 26px rgba(var(--brand-rgb,8,185,184),.34);transform:translateY(-2px)}
.sls-tab.on small{color:rgba(255,255,255,.85)}.sls-tab.today::after{content:"امروز";font-size:10px;font-weight:900;color:var(--teal-deep,#087f86);background:var(--teal-soft,#e4f6f6);border-radius:999px;padding:1px 8px}.sls-tab.on.today::after{background:rgba(255,255,255,.25);color:#fff}
.sls-list{display:flex;flex-direction:column;gap:10px}
.sls-lesson{position:relative;display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:22px;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);overflow:hidden;animation:slItemIn .55s var(--ease,ease) both;animation-delay:calc(var(--i,0)*70ms);transition:transform .3s var(--ease,ease),box-shadow .3s}
.sls-lesson::before{content:"";position:absolute;right:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,var(--a),var(--b))}
.sls-lesson:hover{transform:translateX(-4px);box-shadow:var(--shadow,0 8px 22px rgba(8,60,70,.12))}
.sls-lesson .tm{flex:none;width:62px;text-align:center;font-weight:900;line-height:1.5}.sls-lesson .tm small{display:block;color:var(--muted,#5f7a80);font-weight:700;font-size:12px}
.sls-lesson .ic{flex:none;width:48px;height:48px;border-radius:16px;display:grid;place-items:center;color:#fff;font-weight:900;font-size:17px;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 8px 18px color-mix(in srgb,var(--a) 40%,transparent)}
.sls-lesson .tx{flex:1;min-width:0}.sls-lesson .tx b{display:block;font-size:15.5px;font-weight:900}.sls-lesson .tx span{font-size:13px;color:var(--muted,#5f7a80)}
.sls-lesson.cur{box-shadow:0 0 0 2.5px var(--a),0 16px 34px color-mix(in srgb,var(--a) 34%,transparent);animation:slItemIn .55s var(--ease,ease) both,slsGlow 2.4s ease-in-out infinite}
.sls-lesson.cur .tx b::after{content:"الان";margin-inline-start:8px;font-size:11px;font-weight:900;color:#fff;background:var(--a);border-radius:999px;padding:2px 9px;vertical-align:middle}
.sls-lesson.dim{opacity:.5;filter:saturate(.6)}
@keyframes slsGlow{0%,100%{box-shadow:0 0 0 2.5px var(--a),0 12px 26px color-mix(in srgb,var(--a) 26%,transparent)}50%{box-shadow:0 0 0 4px var(--a),0 18px 38px color-mix(in srgb,var(--a) 40%,transparent)}}
.sls-grid{display:none;overflow:auto;border-radius:26px;background:var(--surface,#fff);border:1px solid var(--line,#dfeaea);box-shadow:var(--shadow,0 8px 22px rgba(8,60,70,.12))}
.sls-grid table{width:100%;border-collapse:separate;border-spacing:8px;min-width:720px}
.sls-grid th{padding:10px 6px;font-size:14px;font-weight:900;border-radius:14px;background:var(--surface2,#f1f7f7);position:sticky;top:0}
.sls-grid th.today{background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86));color:#fff;box-shadow:0 10px 22px rgba(var(--brand-rgb,8,185,184),.32)}
.sls-grid th.pr{width:92px;font-size:12px;color:var(--muted,#5f7a80)}.sls-grid th.pr b{display:block;font-size:15px;color:var(--ink,#12313a)}
.sls-grid td{vertical-align:top;padding:0;height:78px}
.sls-cell{height:100%;padding:10px 12px;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 8px 16px color-mix(in srgb,var(--a) 32%,transparent);animation:slPop .55s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1)) both;animation-delay:calc(var(--i,0)*28ms);transition:transform .25s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1));position:relative}
.sls-cell:hover{transform:translateY(-4px) scale(1.04);z-index:2}.sls-cell b{display:block;font-size:14px;font-weight:900;line-height:1.5}.sls-cell small{display:block;opacity:.9;font-size:11.5px;line-height:1.5}
.sls-cell.cur{animation:slPop .55s both,slsRing 2.2s ease-in-out infinite}.sls-cell.dim{opacity:.38;filter:saturate(.5)}
.sls-cell.cur::after{content:"الان";position:absolute;top:6px;left:8px;font-size:10px;font-weight:900;background:#fff;color:var(--b);border-radius:999px;padding:1px 8px}
@keyframes slsRing{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--a) 70%,transparent),0 8px 16px color-mix(in srgb,var(--a) 32%,transparent)}50%{box-shadow:0 0 0 7px color-mix(in srgb,var(--a) 0%,transparent),0 8px 16px color-mix(in srgb,var(--a) 32%,transparent)}}
.sls-empty-cell{height:100%;border-radius:16px;border:2px dashed var(--line,#dfeaea);display:grid;place-items:center;color:var(--muted,#9bb0b5);font-size:12px}
.sls-sel{display:flex;gap:8px;flex-wrap:wrap}
.sls-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.sls-btn{border:0;border-radius:15px;padding:11px 20px;font:900 14px inherit;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86));box-shadow:0 10px 22px rgba(var(--brand-rgb,8,185,184),.3);transition:transform .25s var(--sfx-spring,cubic-bezier(.34,1.56,.64,1))}
.sls-btn:hover{transform:translateY(-2px)}.sls-btn:active{transform:scale(.96)}.sls-btn[disabled]{opacity:.55;cursor:wait}
.sls-note{padding:40px 18px;text-align:center;color:var(--muted,#5f7a80);border-radius:24px;background:var(--surface,#fff);border:1px dashed var(--line,#dfeaea)}.sls-note .big{font-size:46px;display:block;animation:slFloat 4s ease-in-out infinite}
@media (min-width:860px){.sls-grid{display:block}.sls-tabs,.sls-list{display:none}}
@media (prefers-reduced-motion:reduce){.sls *{animation:none!important;transition:none!important}}
`);

  function liveInfo(rows) {
    const now = new Date(), dn = JS2P[now.getDay()], mins = now.getHours() * 60 + now.getMinutes();
    const today = rows.filter((r) => r.day_number === dn).sort((a, b) => a.period - b.period);
    const cur = today.find((r) => toMin(r.start_time) <= mins && mins < toMin(r.end_time));
    const next = today.find((r) => toMin(r.start_time) > mins);
    let upcoming = null;
    if (!cur && !next) { for (let k = 1; k <= 7 && !upcoming; k++) { const d = ((dn || 0) + k - 1) % 6 + 1; const l = rows.filter((r) => r.day_number === d).sort((a, b) => a.period - b.period)[0]; if (l) upcoming = l; } }
    return { dn, mins, today, cur, next, upcoming };
  }
  function nowCard(rows) {
    const i = liveInfo(rows); let icon = '🗓️', title = '', sub = '', pct = null;
    if (!rows.length) return '';
    if (i.cur) { const total = toMin(i.cur.end_time) - toMin(i.cur.start_time), left = toMin(i.cur.end_time) - i.mins; icon = '🔔'; title = 'الان: ' + i.cur.subject; sub = fa(left) + ' دقیقه تا پایان زنگ' + (i.cur.teacher_name ? ' · ' + i.cur.teacher_name : ''); pct = Math.round(((total - left) / total) * 100); }
    else if (i.next) { const d = toMin(i.next.start_time) - i.mins; icon = '⏰'; title = 'زنگ بعدی: ' + i.next.subject; sub = (d >= 60 ? fa(Math.floor(d / 60)) + ' ساعت و ' + fa(d % 60) + ' دقیقه' : fa(d) + ' دقیقه') + ' دیگر · ساعت ' + hm(i.next.start_time); }
    else if (i.today.length) { icon = '🎉'; title = 'زنگ‌های امروز تمام شد'; sub = i.upcoming ? 'کلاس بعدی: ' + DAYS[i.upcoming.day_number] + ' · ' + i.upcoming.subject : 'خسته نباشید!'; }
    else { icon = '😴'; title = 'امروز کلاس ندارید'; sub = i.upcoming ? 'شروع بعدی: ' + DAYS[i.upcoming.day_number] + ' · ' + i.upcoming.subject + ' ساعت ' + hm(i.upcoming.start_time) : ''; }
    return '<div class="sls-now"><div class="ic">' + icon + '</div><div style="flex:1;min-width:0"><b>' + esc(title) + '</b><span>' + esc(sub) + '</span>' + (pct != null ? '<div class="sls-bar" style="--p:' + pct + '%"><i></i></div>' : '') + '</div></div>';
  }

  /* ============ نمایش اصلی ============ */
  function render(root, rows, opts) {
    opts = opts || {}; rows = (rows || []).slice();
    if (root._slsTimer) clearInterval(root._slsTimer);
    root.classList.add('sls');
    if (!rows.length) { root.innerHTML = '<div class="sls-note"><span class="big">🗓️</span><b>' + esc(opts.emptyTitle || 'هنوز برنامه‌ای ثبت نشده') + '</b><div>' + esc(opts.emptyText || 'وقتی مدیر مدرسه برنامه را ثبت کند همین‌جا نمایش داده می‌شود.') + '</div></div>'; return; }
    const today = liveInfo(rows).dn;
    const days = Object.keys(DAYS).map(Number).filter((d) => rows.some((r) => r.day_number === d));
    let sel = root._slsDay && days.includes(root._slsDay) ? root._slsDay : (days.includes(today) ? today : (days.find((d) => d > today) || days[0]));
    const periods = Array.from(new Set(rows.map((r) => r.period))).sort((a, b) => a - b);
    const mine = (r) => (opts.mine ? opts.mine(r) : true);
    const colLabel = (r) => (opts.label ? opts.label(r) : r.teacher_name || '');
    const lessonHTML = (r, i, live) => { const [a, b] = pal(r.subject), cur = live.cur && live.cur.id === r.id; return '<div class="sls-lesson ' + (cur ? 'cur ' : '') + (mine(r) ? '' : 'dim') + '" style="--a:' + a + ';--b:' + b + ';--i:' + i + '"><div class="tm">' + hm(r.start_time) + '<small>' + hm(r.end_time) + '</small></div><div class="ic">' + fa(r.period) + '</div><div class="tx"><b>' + esc(r.subject) + '</b><span>' + esc(colLabel(r)) + '</span></div></div>'; };
    const draw = () => {
      const live = liveInfo(rows);
      const head = '<div class="sls-hero"><div class="sls-top"><h3>' + esc(opts.title || 'برنامهٔ هفتگی') + '</h3>' + (opts.subtitle ? '<span class="sls-chip">' + esc(opts.subtitle) + '</span>' : '') + '</div>' + nowCard(rows) + '</div>';
      const tabs = '<div class="sls-tabs" role="tablist">' + days.map((d) => '<button type="button" role="tab" aria-selected="' + (d === sel) + '" class="sls-tab ' + (d === sel ? 'on ' : '') + (d === today ? 'today' : '') + '" data-day="' + d + '"><b>' + DAYS[d] + '</b><small>' + fa(rows.filter((r) => r.day_number === d).length) + ' زنگ</small></button>').join('') + '</div>';
      const list = '<div class="sls-list">' + rows.filter((r) => r.day_number === sel).sort((a, b) => a.period - b.period).map((r, i) => lessonHTML(r, i, live)).join('') + '</div>';
      let n = 0;
      const grid = '<div class="sls-grid"><table><thead><tr><th class="pr">زنگ</th>' + days.map((d) => '<th class="' + (d === today ? 'today' : '') + '">' + DAYS[d] + '</th>').join('') + '</tr></thead><tbody>' + periods.map((p) => {
        const any = rows.find((r) => r.period === p);
        return '<tr><th class="pr"><b>' + fa(p) + '</b>' + hm(any && any.start_time) + '<br>' + hm(any && any.end_time) + '</th>' + days.map((d) => {
          const r = rows.find((x) => x.day_number === d && x.period === p);
          if (!r) return '<td><div class="sls-empty-cell">—</div></td>';
          const [a, b] = pal(r.subject), cur = live.cur && live.cur.id === r.id;
          return '<td><div class="sls-cell ' + (cur ? 'cur ' : '') + (mine(r) ? '' : 'dim') + '" style="--a:' + a + ';--b:' + b + ';--i:' + (n++) + '"><b>' + esc(r.subject) + '</b><small>' + esc(colLabel(r)) + '</small></div></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
      root.innerHTML = head + tabs + list + grid;
    };
    draw();
    root.onclick = (e) => { const t = e.target.closest('.sls-tab'); if (t) { sel = +t.dataset.day; root._slsDay = sel; draw(); } };
    root._slsTimer = setInterval(() => { if (root.isConnected) { const sc = root.scrollTop; draw(); root.scrollTop = sc; } else clearInterval(root._slsTimer); }, 60000);
  }

  /* ============ دریافت داده ============ */
  async function fetchClass(db, grade, cls) {
    const r = await db.from('school_timetable').select('*').eq('grade', grade).eq('class_name', cls).order('day_number').order('period');
    return r.error ? [] : (r.data || []);
  }
  const whenReady = (fn) => { if (S.ready) fn(); else L.on('ready', fn); };
  const loading = (root) => { root.classList.add('sls'); root.innerHTML = '<div class="sls-note"><span class="big">⏳</span>در حال بارگذاری برنامه…</div>'; };

  function mountStudent(root) {
    if (!root) return; loading(root);
    const load = async () => {
      const r = await S.db.from('students').select('grade,class_name').eq('user_id', S.me.id).maybeSingle();
      if (!r.data) return render(root, [], { emptyTitle: 'کلاس شما مشخص نشده', emptyText: 'از مدیر مدرسه بخواهید کلاس شما را ثبت کند.' });
      const rows = await fetchClass(S.db, r.data.grade, r.data.class_name);
      render(root, rows, { title: 'برنامهٔ هفتگی من', subtitle: r.data.grade + ' · ' + r.data.class_name });
    };
    whenReady(load); root._reload = load;
  }
  function mountTeacher(root) {
    if (!root) return; loading(root);
    const load = async () => {
      const t = await S.db.from('teachers').select('id,subject').eq('user_id', S.me.id).maybeSingle();
      if (!t.data) return render(root, [], { emptyTitle: 'حساب معلم پیدا نشد', emptyText: '' });
      const as = await S.db.from('teacher_assignments').select('subject,grade,class_name').eq('teacher_id', t.data.id);
      const assigns = as.data || [];
      const all = [];
      for (const a of assigns.filter((x, i, arr) => arr.findIndex((y) => y.grade === x.grade && y.class_name === x.class_name) === i)) {
        (await fetchClass(S.db, a.grade, a.class_name)).forEach((r) => all.push(Object.assign({}, r, { _class: a.grade + ' ' + a.class_name })));
      }
      const myName = (S.me.full_name || '').trim();
      const isMine = (r) => (r.teacher_name && r.teacher_name.trim() === myName) || assigns.some((a) => a.grade === r.grade && a.class_name === r.class_name && a.subject === r.subject && !r.teacher_name);
      const mineRows = all.filter(isMine);
      const classes = Array.from(new Set(all.map((r) => r._class)));
      let view = 'mine';
      const draw = () => {
        const rows = view === 'mine' ? mineRows : all.filter((r) => r._class === view);
        root.innerHTML = '<div class="sls-sel" id="slsSel" style="margin-bottom:6px"><button type="button" class="sl-chip ' + (view === 'mine' ? 'on' : '') + '" data-v="mine">درس‌های من</button>' + classes.map((c) => '<button type="button" class="sl-chip ' + (view === c ? 'on' : '') + '" data-v="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div><div id="slsBody"></div>';
        render($('#slsBody', root), rows, { title: view === 'mine' ? 'برنامهٔ تدریس من' : 'برنامهٔ ' + view, subtitle: view === 'mine' ? fa(mineRows.length) + ' زنگ در هفته' : '', label: (r) => (view === 'mine' ? r._class : r.teacher_name || ''), mine: view === 'mine' ? () => true : isMine, emptyTitle: 'برنامه‌ای ثبت نشده', emptyText: 'مدیر مدرسه هنوز برنامهٔ این کلاس را ثبت نکرده است.' });
      };
      root.onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) { view = b.dataset.v; draw(); } };
      draw();
    };
    whenReady(load); root._reload = load;
  }
  function mountParent(root) {
    if (!root) return; loading(root);
    const load = async () => {
      const ps = await S.db.from('parent_students').select('student_id').eq('parent_user_id', S.me.id);
      const ids = (ps.data || []).map((x) => x.student_id);
      if (!ids.length) return render(root, [], { emptyTitle: 'فرزندی به حساب شما وصل نیست', emptyText: 'از مدیر مدرسه بخواهید فرزند شما را به این حساب متصل کند.' });
      const st = await S.db.from('students').select('id,user_id,grade,class_name,profiles(full_name)').in('id', ids);
      const kids = (st.data || []).map((s) => ({ name: (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles || {}).full_name || 'فرزند', grade: s.grade, cls: s.class_name }));
      let cur = 0; const cache = {};
      const draw = async () => {
        const k = kids[cur]; const key = k.grade + '|' + k.cls;
        cache[key] = cache[key] || await fetchClass(S.db, k.grade, k.cls);
        root.innerHTML = (kids.length > 1 ? '<div class="sls-sel" style="margin-bottom:6px">' + kids.map((x, i) => '<button type="button" class="sl-chip ' + (i === cur ? 'on' : '') + '" data-k="' + i + '">' + esc(x.name) + '</button>').join('') + '</div>' : '') + '<div id="slsBody"></div>';
        render($('#slsBody', root), cache[key], { title: 'برنامهٔ هفتگی ' + k.name, subtitle: k.grade + ' · ' + k.cls });
      };
      root.onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) { cur = +b.dataset.k; draw(); } };
      draw();
    };
    whenReady(load); root._reload = load;
  }

  /* مدیر: پیش‌نمایش برنامهٔ هر کلاس و «ارسال برنامه به کلاس» */
  async function notifyClass(db, grade, cls, title, body, type) {
    const st = await db.from('students').select('id,user_id').eq('grade', grade).eq('class_name', cls);
    const students = st.data || [];
    const par = students.length ? await db.from('parent_students').select('parent_user_id').in('student_id', students.map((s) => s.id)) : { data: [] };
    const tch = await db.from('teacher_assignments').select('teachers(user_id)').eq('grade', grade).eq('class_name', cls);
    const ids = new Set(students.map((s) => s.user_id));
    (par.data || []).forEach((p) => ids.add(p.parent_user_id));
    (tch.data || []).forEach((t) => { const x = Array.isArray(t.teachers) ? t.teachers[0] : t.teachers; if (x && x.user_id) ids.add(x.user_id); });
    const rows = Array.from(ids).filter(Boolean).map((u) => ({ user_id: u, title, body, type: type || 'schedule' }));
    for (let i = 0; i < rows.length; i += 100) { const r = await db.from('notifications').insert(rows.slice(i, i + 100)); if (r.error) throw r.error; }
    return rows.length;
  }
  function mountManager(root, opts) {
    if (!root) return; opts = opts || {};
    const gradeEl = () => document.getElementById(opts.gradeId || 'scheduleGrade'), classEl = () => document.getElementById(opts.classId || 'scheduleClass');
    const load = async () => {
      const g = gradeEl() && gradeEl().value, c = classEl() && classEl().value;
      if (!g || !c) { root.classList.add('sls'); root.innerHTML = '<div class="sls-note"><span class="big">🗓️</span>برای دیدن پیش‌نمایش، پایه و کلاس را انتخاب کنید.</div>'; return; }
      const rows = await fetchClass(S.db, g, c);
      root.innerHTML = '<div class="sls-actions" style="margin-bottom:8px"><button type="button" class="sls-btn" id="slsNotify">📣 ارسال برنامه به دانش‌آموزان، والدین و معلمان این کلاس</button></div><div id="slsBody"></div>';
      render($('#slsBody', root), rows, { title: 'پیش‌نمایش برنامه', subtitle: g + ' · ' + c, emptyTitle: 'برنامه‌ای برای این کلاس ثبت نشده', emptyText: 'با فرم بالا زنگ‌ها را اضافه کنید.' });
      $('#slsNotify', root).onclick = async (e) => {
        if (!rows.length) return toast({ title: 'اول برنامه را ثبت کنید', icon: 'ℹ️' });
        const btn = e.currentTarget; btn.disabled = true;
        try { const n = await notifyClass(S.db, g, c, 'برنامهٔ هفتگی کلاس ' + c, 'برنامهٔ هفتگی کلاس ' + g + ' ' + c + ' ثبت یا به‌روزرسانی شد؛ از بخش «برنامه هفتگی» ببینید.'); toast({ title: 'برنامه ارسال شد', text: fa(n) + ' نفر مطلع شدند', icon: '📣' }); }
        catch (err) { toast({ title: 'ارسال انجام نشد', text: String(err.message || err), icon: '⚠️' }); }
        btn.disabled = false;
      };
    };
    root._reload = load; whenReady(load);
    ['change'].forEach((ev) => { [gradeEl(), classEl()].forEach((el) => el && el.addEventListener(ev, () => setTimeout(load, 120))); });
    return load;
  }

  L.schedule = { render, fetchClass, mountStudent, mountTeacher, mountParent, mountManager, notifyClass, DAYS };
  global.SchoolSchedule = L.schedule;
})(window);

/* جلوه‌های بصری مشترک: زمینهٔ شفقی، کارت خوش‌آمد، شمارندهٔ متحرک، موج لمس و کاغذرنگی */
(function (global) {
  'use strict';
  const L = global.SchoolLive;
  if (!L || L.fx) return;
  const U = L.util, { fa, esc, $, $$, injectCSS, faDay } = U;
  document.documentElement.classList.add('slfx');

  injectCSS('slfx-css', `
html.slfx body{isolation:isolate}
html.slfx body::before{content:"";position:fixed;inset:-25%;z-index:-1;pointer-events:none;background:radial-gradient(38% 38% at 18% 22%,rgba(var(--brand-rgb,8,185,184),.2),transparent 70%),radial-gradient(34% 34% at 82% 28%,rgba(124,92,255,.14),transparent 70%),radial-gradient(40% 40% at 62% 88%,rgba(47,128,237,.13),transparent 70%);animation:slfxAurora 22s ease-in-out infinite alternate}
@keyframes slfxAurora{0%{transform:translate3d(0,0,0) rotate(0) scale(1)}50%{transform:translate3d(3%,-2%,0) rotate(4deg) scale(1.08)}100%{transform:translate3d(-3%,3%,0) rotate(-3deg) scale(1.02)}}
html.slfx :where(.card,.panel,.tile,.listrow,.circular-card,.cardx){transition:transform .4s var(--ease,cubic-bezier(.22,1,.36,1)),box-shadow .4s var(--ease,ease),border-color .3s}
html.slfx :where(.cards .card,.panel,.listrow):hover{transform:translateY(-4px);box-shadow:var(--shadow-lg,0 18px 44px rgba(8,60,70,.18))}
html.slfx :where(.cards .card){position:relative;overflow:hidden}
html.slfx :where(.cards .card)::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(120%);transition:transform .9s var(--ease,ease);pointer-events:none}
html.slfx :where(.cards .card):hover::after{transform:translateX(-120%)}
html.slfx .card-value{font-variant-numeric:tabular-nums;background:linear-gradient(135deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
html.slfx :where(button,.menu-btn){-webkit-tap-highlight-color:transparent}
html.slfx :where(button,a,input,select,textarea):focus-visible{outline:3px solid rgba(var(--brand-rgb,8,185,184),.45);outline-offset:2px}
.slfx-host{position:relative!important;overflow:hidden!important}
.slfx-rp{position:absolute;border-radius:50%;pointer-events:none;background:rgba(var(--brand-rgb,8,185,184),.3);transform:scale(0);animation:slfxRp .65s ease-out forwards}
@keyframes slfxRp{to{transform:scale(1);opacity:0}}
.slfx-hero{position:relative;overflow:hidden;border-radius:30px;padding:26px 26px 22px;margin-bottom:20px;color:#fff;background:linear-gradient(130deg,var(--teal2,#17c3c0),var(--teal-deep,#087f86) 62%,#0a4f66);box-shadow:0 22px 48px rgba(var(--brand-rgb,8,185,184),.34);animation:slItemIn .7s var(--ease,ease) both}
html.slfx .slfx-hero,html.slfx .slfx-hero h2,html.slfx .slfx-hero small,html.slfx .slfx-hero p{color:#fff}
.slfx-hero small{display:block;font-size:14px;opacity:.9;font-weight:700}.slfx-hero h2{margin:4px 0 6px;font-size:clamp(22px,4vw,32px);font-weight:900;line-height:1.4}.slfx-hero p{margin:0;opacity:.88;font-size:14px}
.slfx-hero .o{position:absolute;border-radius:50%;background:rgba(255,255,255,.14);animation:slsOrb 10s ease-in-out infinite}
.slfx-hero .o1{width:220px;height:220px;left:-70px;top:-90px}.slfx-hero .o2{width:150px;height:150px;left:34%;bottom:-80px;animation-delay:-3s;background:rgba(255,255,255,.09)}.slfx-hero .o3{width:90px;height:90px;right:-20px;top:20px;animation-delay:-6s}
.slfx-hero .em{position:absolute;left:22px;bottom:14px;font-size:64px;opacity:.9;animation:slFloat 4s ease-in-out infinite;filter:drop-shadow(0 10px 14px rgba(0,0,0,.25))}
.slfx-confetti{position:fixed;inset:0;z-index:99995;pointer-events:none}
.slfx-skel{border-radius:14px;background:linear-gradient(90deg,var(--surface2,#f1f7f7) 25%,var(--line,#e3eeee) 50%,var(--surface2,#f1f7f7) 75%);background-size:200% 100%;animation:slfxSk 1.3s infinite}
@keyframes slfxSk{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){html.slfx body::before,.slfx-hero .o,.slfx-hero .em{animation:none}.slfx-rp{display:none}}
`);

  /* موج لمس روی دکمه‌ها */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button,.tile,.menu-btn,.sl-chip,.sls-tab'); if (!b || b.disabled || b.closest('.sl-compose textarea')) return;
    if (global.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span');
    s.className = 'slfx-rp'; s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    const had = b.classList.contains('slfx-host'); b.classList.add('slfx-host'); b.appendChild(s);
    setTimeout(() => { s.remove(); if (!had) b.classList.remove('slfx-host'); }, 680);
  }, { passive: true });

  /* شمارندهٔ متحرک برای عددهای داشبورد */
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  function countUp(el) {
    if (el._anim) return;
    const raw = el.textContent.trim(), n = parseInt(raw.replace(/[۰-۹]/g, (d) => FA.indexOf(d)), 10);
    if (isNaN(n) || n < 1 || el._last === raw) return;
    const persian = /[۰-۹]/.test(raw), t0 = performance.now(), dur = 1000; el._anim = true;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - p, 3))); el.textContent = persian ? fa(v) : String(v); if (p < 1) requestAnimationFrame(step); else { el._anim = false; el._last = el.textContent; } };
    requestAnimationFrame(step);
  }
  new MutationObserver((ms) => ms.forEach((m) => { const el = m.target.nodeType === 3 ? m.target.parentElement : m.target; if (el && el.classList && el.classList.contains('card-value')) countUp(el); })).observe(document.documentElement, { childList: true, characterData: true, subtree: true });

  /* کارت خوش‌آمد بالای داشبورد */
  const greet = () => { const h = new Date().getHours(); return h < 5 ? 'شب بخیر' : h < 12 ? 'صبح بخیر' : h < 17 ? 'ظهر بخیر' : h < 20 ? 'عصر بخیر' : 'شب بخیر'; };
  const emoji = () => { const h = new Date().getHours(); return h < 5 ? '🌙' : h < 12 ? '☀️' : h < 17 ? '🌤️' : h < 20 ? '🌇' : '🌙'; };
  function hero(target, opts) {
    if (!target || $('.slfx-hero', target)) return;
    opts = opts || {};
    const make = () => {
      if ($('.slfx-hero', target)) return;
      const me = L.state.me, d = document.createElement('div'); d.className = 'slfx-hero';
      d.innerHTML = '<span class="o o1"></span><span class="o o2"></span><span class="o o3"></span><div class="em">' + emoji() + '</div><small>' + greet() + '</small><h2>' + esc((me && me.full_name) || 'خوش آمدید') + '</h2><p>' + esc(opts.sub || faDay(new Date().toISOString())) + '</p>';
      target.insertBefore(d, target.firstChild);
    };
    if (L.state.ready) make(); else L.on('ready', make);
  }

  /* کاغذرنگی جشن */
  function celebrate() {
    if (global.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const cv = document.createElement('canvas'); cv.className = 'slfx-confetti'; cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
    const g = cv.getContext('2d'), cols = ['#17c3c0', '#8b6cff', '#f5a04e', '#ef5b60', '#3b8cf5', '#2cb27a', '#ffd166'];
    const P = Array.from({ length: 90 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 5, r: Math.random() * 6 + 3, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 }));
    const t0 = performance.now();
    (function f(t) { const k = (t - t0) / 1700; g.clearRect(0, 0, cv.width, cv.height); P.forEach((p) => { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.globalAlpha = Math.max(0, 1 - k); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); }); if (k < 1) requestAnimationFrame(f); else cv.remove(); })(t0);
  }

  L.fx = { hero, celebrate, countUp };
  global.SchoolFx = L.fx;
})(window);


/* Mobile stability and responsive layout patch */
(function(){
  if (document.getElementById('school-live-mobile-fix')) return;
  const style = document.createElement('style'); style.id = 'school-live-mobile-fix';
  style.textContent = `
    *,*::before,*::after{box-sizing:border-box}
    .sl-modal{padding:env(safe-area-inset-top,8px) 10px env(safe-area-inset-bottom,8px);overflow-y:auto;-webkit-overflow-scrolling:touch}
    .sl-modal-card{width:min(560px,100%);max-height:min(88dvh,760px);max-height:min(88vh,760px);border-radius:20px}
    .sl-modal-body,.sl-people{min-height:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    .sl-person{width:100%;min-height:58px;touch-action:manipulation;cursor:pointer;text-align:right}
    .sl-person:disabled{opacity:.65;pointer-events:none}
    .sl-search input{min-width:0;width:100%;font-size:16px}
    .sl-people button,.sl-modal button{touch-action:manipulation}
    @media(max-width:700px){
      .sl-modal{align-items:flex-end;padding:8px 8px env(safe-area-inset-bottom,8px)}
      .sl-modal-card{width:100%;max-width:none;max-height:90vh;max-height:90dvh;border-radius:22px 22px 14px 14px}
      .sl-modal-head,.sl-modal-foot{padding:12px 14px;gap:8px}
      .sl-modal-body{padding:12px 14px;overflow-y:auto}
      .sl-people{max-height:55vh;max-height:55dvh;overflow-y:auto}
      .sl-person{padding:10px 8px;gap:10px}
      .sl-person b{overflow-wrap:anywhere}
      .sl-modal-foot .sl-btn{min-height:44px}
      .sl-compose textarea{font-size:16px}
      .sl-msgs{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
      .sl-root,.sl-chat,.sl-layout{min-width:0;max-width:100%}
    }
  `;
  document.head.appendChild(style);
})();
