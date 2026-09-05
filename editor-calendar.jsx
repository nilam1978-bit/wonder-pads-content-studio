// Content Calendar — schedule generated captions to specific dates.
// Month grid view + day detail + inline add/edit.
const { useState: calS, useMemo: calM, useRef: calR } = React;

function CalToast() {
  const [msg, setMsg] = calS(null);
  const show = (t) => { setMsg(t); setTimeout(() => setMsg(null), 1800); };
  const Toast = msg ? (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'white', padding: '10px 16px',
      borderRadius: 999, fontSize: 13, boxShadow: 'var(--shadow-lg)', zIndex: 10000,
    }}>{msg}</div>
  ) : null;
  return { show, Toast };
}

const CAL_PLATFORM_ICON = {
  'instagram-caption':  'instagram',
  'instagram-carousel': 'carousel',
  'tiktok-hook':        'tiktok',
  'tiktok_hook':        'tiktok',
  'tiktok_script':      'tiktok',
  'facebook-post':      'facebook',
  'facebook_post':      'facebook',
  'youtube-shorts':     'youtube',
  'story-frames':       'story',
  'story_frames':       'story',
  'website-blurb':      'website',
  'website_blurb':      'website',
  'reel-hook':          'sparkles',
  'announcement':       'sparkles',
  'instagram_caption':  'instagram',
  'carousel':           'carousel',
  'manual':             'edit',
};

// Nice human labels for calendar entries.
const CAL_PLATFORM_LABEL = {
  'instagram-caption':  'Instagram caption',
  'instagram_caption':  'Instagram caption',
  'instagram-carousel': 'Instagram carousel',
  'carousel':           'Carousel',
  'tiktok-hook':        'TikTok',
  'tiktok_hook':        'TikTok hook',
  'tiktok_script':      'TikTok script',
  'facebook-post':      'Facebook post',
  'facebook_post':      'Facebook post',
  'youtube-shorts':     'YouTube Shorts',
  'story-frames':       'Story frames',
  'story_frames':       'Story frames',
  'website-blurb':      'Website blurb',
  'website_blurb':      'Website blurb',
  'reel-hook':          'Reel hook',
  'announcement':       'Announcement',
  'manual':             'Post',
};

function fmtCalDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function isSameDay(ts, d) {
  const a = new Date(ts), b = new Date(d);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

function CalendarScreen() {
  const { state, dispatch } = useStore();
  const { show: toast, Toast } = CalToast();
  const isMobile = useIsMobile();

  const [monthCursor, setMonthCursor] = calS(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = calS(() => startOfDay(new Date()));
  const [showAdd, setShowAdd] = calS(false);
  const [showDaySheet, setShowDaySheet] = calS(false);

  const calendar = state.calendar || [];

  // Build 42-day month grid (6 weeks) starting on Sunday.
  const days = calM(() => {
    const first = new Date(monthCursor);
    const startDay = first.getDay(); // 0..6
    const start = new Date(first);
    start.setDate(first.getDate() - startDay);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [monthCursor]);

  const entriesForDay = (d) => calendar
    .filter(e => isSameDay(e.ts, d))
    .sort((a, b) => a.ts - b.ts);

  const monthLabel = monthCursor.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const goPrev = () => setMonthCursor(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNext = () => setMonthCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setMonthCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDay(startOfDay(t));
  };

  const removeEntry = (id) => {
    if (confirm('Remove this entry from the calendar?')) {
      dispatch({ type: 'remove-calendar-entry', id });
      toast('removed');
    }
  };
  const togglePosted = (entry) => {
    dispatch({
      type: 'update-calendar-entry',
      id: entry.id,
      patch: { status: entry.status === 'posted' ? 'queued' : 'posted' },
    });
  };

  const selectedEntries = entriesForDay(selectedDay);
  const todayTs = startOfDay(new Date()).getTime();
  const isPastDay = selectedDay.getTime() < todayTs;

  return (
    <div style={{
      height: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--pink-100) 0%, #FBF5F9 400px)', overflow: 'hidden',
    }}>
      {Toast}

      {/* Top bar */}
      <div className="safe-top" style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,.7)',
        backdropFilter: 'blur(8px)', flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'set-view', view: 'home' })}
          style={{ padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
          <Icon name="arrow_left" size={16} /> <span className="desktop-only" style={{ fontSize: 13 }}>Home</span>
        </button>
        <div style={{ height: 20, width: 1, background: 'var(--line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--pink-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink-600)',
          }}>
            <Icon name="history" size={16} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>Calendar</div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>content queue</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={goToday} className="btn btn-tonal"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Today
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: month grid */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Month header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h1 style={{
                  margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400,
                  fontSize: 32, color: 'var(--ink)', lineHeight: 1,
                }}>
                  {monthLabel}
                </h1>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                  {calendar.filter(e => {
                    const d = new Date(e.ts);
                    return d.getMonth() === monthCursor.getMonth() && d.getFullYear() === monthCursor.getFullYear();
                  }).length} entries this month
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={goPrev} className="icon-btn compact"><Icon name="chevron_r" size={14} style={{ transform: 'rotate(180deg)' }} /></button>
                <button onClick={goNext} className="icon-btn compact"><Icon name="chevron_r" size={14} /></button>
              </div>
            </div>

            {/* Day-of-week header */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6,
            }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase',
                  color: 'var(--ink-3)', textAlign: 'center', padding: '4px 0',
                }}>{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {days.map((d, i) => {
                const inMonth = d.getMonth() === monthCursor.getMonth();
                const isToday = isSameDay(d.getTime(), new Date());
                const isSelected = isSameDay(d.getTime(), selectedDay);
                const dayEntries = entriesForDay(d);
                return (
                  <button key={i} onClick={() => { setSelectedDay(startOfDay(d)); if (isMobile) setShowDaySheet(true); }}
                    style={{
                      aspectRatio: '1', minHeight: 64, borderRadius: 12,
                      background: isSelected ? 'var(--ink)' : (inMonth ? 'white' : 'transparent'),
                      color: isSelected ? 'white' : (inMonth ? 'var(--ink)' : 'var(--ink-3)'),
                      border: `1px solid ${isSelected ? 'var(--ink)' : (isToday ? 'var(--pink-400)' : 'var(--line)')}`,
                      padding: '6px 8px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', gap: 3,
                      transition: 'all .1s',
                    }}>
                    <div style={{
                      fontSize: 13, fontWeight: isToday ? 700 : 500,
                      color: isSelected ? 'white' : (isToday ? 'var(--pink-500)' : 'inherit'),
                    }}>{d.getDate()}</div>
                    {dayEntries.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 'auto' }}>
                        {dayEntries.slice(0, 4).map(e => (
                          <div key={e.id} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: e.status === 'posted'
                              ? (isSelected ? 'rgba(255,255,255,.5)' : 'var(--ink-3)')
                              : (isSelected ? 'var(--pink-300)' : 'var(--pink-500)'),
                          }} />
                        ))}
                        {dayEntries.length > 4 && (
                          <span style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,.7)' : 'var(--ink-3)' }}>
                            +{dayEntries.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: day detail — sidebar on desktop, bottom sheet on mobile */}
        {!isMobile && (
          <div style={{
            width: 380, flexShrink: 0, background: 'white',
            borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column',
          }}>
            <DayDetailContent
              selectedDay={selectedDay}
              isPastDay={isPastDay}
              selectedEntries={selectedEntries}
              onAdd={() => setShowAdd(true)}
              onTogglePosted={togglePosted}
              onRemove={removeEntry}
            />
          </div>
        )}
      </div>

      {/* Mobile: day detail as a bottom sheet */}
      {isMobile && showDaySheet && (
        <div onClick={() => setShowDaySheet(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(42,31,42,0.35)',
            zIndex: 9000, display: 'flex', alignItems: 'flex-end',
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: 'white', width: '100%', maxHeight: '85vh',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
            }}>
            {/* Grab handle */}
            <div style={{
              padding: '10px 0 0', display: 'flex', justifyContent: 'center',
            }}>
              <div style={{ width: 40, height: 4, background: 'var(--line-2)', borderRadius: 2 }} />
            </div>
            <DayDetailContent
              selectedDay={selectedDay}
              isPastDay={isPastDay}
              selectedEntries={selectedEntries}
              onAdd={() => setShowAdd(true)}
              onTogglePosted={togglePosted}
              onRemove={removeEntry}
              onClose={() => setShowDaySheet(false)}
            />
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddToCalendarModal
          initialDate={selectedDay}
          onClose={() => setShowAdd(false)}
          onSave={(entry) => {
            dispatch({ type: 'add-calendar-entry', entry });
            toast('added to calendar');
            setShowAdd(false);
          }} />
      )}
    </div>
  );
}

// Extracted so desktop sidebar + mobile bottom-sheet render the same content.
function DayDetailContent({ selectedDay, isPastDay, selectedEntries, onAdd, onTogglePosted, onRemove, onClose }) {
  return (
    <>
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
              {isSameDay(selectedDay.getTime(), new Date()) ? 'Today' : (isPastDay ? 'Past' : 'Upcoming')}
            </div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>
              {fmtCalDate(selectedDay)}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="icon-btn compact"
              style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        <button onClick={onAdd}
          style={{
            marginTop: 12, width: '100%', padding: '10px 14px',
            background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <Icon name="plus" size={12} /> Add to this day
        </button>
      </div>
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, maxHeight: '60vh' }}>
        {selectedEntries.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            <div style={{ fontSize: 24, color: 'var(--pink-300)', marginBottom: 8 }}>✿</div>
            Nothing scheduled.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {selectedEntries.map(e => (
              <CalEntryCard key={e.id} entry={e}
                onTogglePosted={() => onTogglePosted(e)}
                onRemove={() => onRemove(e.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CalEntryCard({ entry, onTogglePosted, onRemove }) {
  const posted = entry.status === 'posted';
  const label = CAL_PLATFORM_LABEL[entry.platform] || entry.platform || 'Post';
  const icon = CAL_PLATFORM_ICON[entry.platform] || 'edit';
  const time = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{
      background: posted ? 'var(--pink-50)' : 'white',
      border: `1px solid ${posted ? 'var(--line)' : 'var(--line)'}`,
      borderRadius: 12, padding: 12,
      opacity: posted ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'var(--pink-50)', color: 'var(--pink-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={icon} size={12} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink)',
            textDecoration: posted ? 'line-through' : 'none',
          }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{time}</div>
        </div>
        <button onClick={onTogglePosted} title={posted ? 'Mark as queued' : 'Mark as posted'}
          className="icon-btn compact"
          style={{ color: posted ? 'var(--pink-500)' : 'var(--ink-3)' }}>
          <Icon name={posted ? 'refresh' : 'check'} size={12} />
        </button>
        <button onClick={onRemove} className="icon-btn compact"
          style={{ color: 'var(--ink-3)' }}>
          <Icon name="trash" size={12} />
        </button>
      </div>
      <div style={{
        fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden',
      }}>{entry.text}</div>
      {entry.note && (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic', marginTop: 6 }}>
          {entry.note}
        </div>
      )}
    </div>
  );
}

function AddToCalendarModal({ initialDate, initialEntry = null, onClose, onSave }) {
  const [platform, setPlatform] = calS(initialEntry?.platform || 'instagram-caption');
  const [text, setText]     = calS(initialEntry?.text || '');
  const [note, setNote]     = calS(initialEntry?.note || '');
  const [dateStr, setDateStr] = calS(() => {
    const d = initialEntry?.ts ? new Date(initialEntry.ts) : (initialDate || new Date());
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [timeStr, setTimeStr] = calS(() => {
    const d = initialEntry?.ts ? new Date(initialEntry.ts) : new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  });

  const commit = () => {
    if (!text.trim()) return;
    const [y, m, day] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const ts = new Date(y, m - 1, day, hh || 9, mm || 0).getTime();
    onSave({ ts, platform, text: text.trim(), note: note.trim() || undefined });
  };

  const platformOpts = [
    'instagram-caption', 'instagram-carousel', 'tiktok-hook',
    'facebook-post', 'story-frames', 'youtube-shorts', 'website-blurb', 'manual',
  ];

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42,31,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000, padding: 20, backdropFilter: 'blur(6px)',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--cream)', borderRadius: 24, maxWidth: 560, width: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Add to calendar</div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, color: 'var(--ink)' }}>Schedule a post</div>
          </div>
          <button onClick={onClose} className="icon-btn compact"
            style={{ color: 'var(--ink-3)' }}>
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Date + time */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Date</div>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: 10,
                  background: 'white', border: '1px solid var(--line)',
                  borderRadius: 10, fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
                }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Time</div>
              <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: 10,
                  background: 'white', border: '1px solid var(--line)',
                  borderRadius: 10, fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
                }} />
            </div>
          </div>
          {/* Platform */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Platform</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {platformOpts.map(p => {
                const active = p === platform;
                return (
                  <button key={p} onClick={() => setPlatform(p)}
                    style={{
                      background: active ? 'var(--ink)' : 'white',
                      color: active ? 'white' : 'var(--ink-2)',
                      border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                      padding: '6px 12px', borderRadius: 999, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                    <Icon name={CAL_PLATFORM_ICON[p] || 'edit'} size={11} /> {CAL_PLATFORM_LABEL[p] || p}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Text */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Post text</div>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="paste your caption here…"
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box', padding: 12,
                background: 'white', border: '1px solid var(--line)',
                borderRadius: 10, fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
                lineHeight: 1.5, resize: 'vertical', outline: 'none',
              }} />
          </div>
          {/* Note */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· optional</span></div>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. tag @wonderpads, use carousel v2"
              style={{
                width: '100%', boxSizing: 'border-box', padding: 10,
                background: 'white', border: '1px solid var(--line)',
                borderRadius: 10, fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
              }} />
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="btn btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={commit} disabled={!text.trim()}
            style={{
              padding: '8px 20px', background: 'var(--ink)', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              opacity: text.trim() ? 1 : 0.5, fontFamily: 'inherit',
            }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarScreen, AddToCalendarModal, CalEntryCard, CAL_PLATFORM_ICON, CAL_PLATFORM_LABEL });
