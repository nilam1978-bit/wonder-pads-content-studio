const BULK_CREATE_LIMIT = 50;

function parseBulkTable(input) {
  const text = input.replace(/^\uFEFF/, '');
  if (!text.trim()) throw new Error('Paste a table or choose a CSV file first.');
  if (text.length > 500000) throw new Error('Use a table smaller than 500 KB.');
  const delimiter = text.split(/\r?\n/).find(line => line.trim())?.includes('\t') ? '\t' : ',';
  const records = [];
  let row = [], value = '', quoted = false, closed = false;
  const cell = () => { row.push(value); value = ''; closed = false; };
  const record = () => { cell(); if (row.some(item => item.trim())) records.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else value += ch;
    } else if (ch === delimiter) cell();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record();
    } else if (closed) {
      if (ch !== ' ') throw new Error('Check the text after a closing quote.');
    } else if (ch === '"' && !value) quoted = true;
    else value += ch;
  }
  if (quoted) throw new Error('A quoted cell is missing its closing quote.');
  record();
  const headers = (records.shift() || []).map(label => label.trim());
  if (!headers.length || headers.some(label => !label) ||
      new Set(headers.map(label => label.toLowerCase())).size !== headers.length) {
    throw new Error('Give every column a unique heading in the first row.');
  }
  if (!records.length || records.length > BULK_CREATE_LIMIT) {
    throw new Error('Add between 1 and ' + BULK_CREATE_LIMIT + ' data rows.');
  }
  const badRow = records.findIndex(row => row.length !== headers.length);
  if (badRow >= 0) throw new Error('Data row ' + (badRow + 1) + ' has a different number of cells than the header.');
  return { headers, rows: records };
}

function bulkFilledPages(canvases, mapping, row) {
  return canvases.map(canvas => ({
    ...canvas,
    elements: canvas.elements.map(el => {
      if (el.type !== 'text' || el.hidden || el.locked || !Object.hasOwn(mapping, el.id)) return el;
      const filled = { ...el, text: row[mapping[el.id]] };
      return { ...filled, h: textLayout(filled).height };
    }),
  }));
}

function BulkCreateDialog({ project, onClose, onCreate }) {
  const dialog = React.useRef(null);
  const [input, setInput] = React.useState('');
  const [table, setTable] = React.useState(null);
  const [mapping, setMapping] = React.useState({});
  const [rowIndex, setRowIndex] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [error, setError] = React.useState('');
  React.useEffect(() => { dialog.current.showModal(); }, []);
  const fields = project.canvases.flatMap((page, index) => page.elements
    .filter(el => el.type === 'text' && !el.hidden && !el.locked)
    .map(el => ({ id: el.id, label: 'Slide ' + (index + 1) + ' · ' + ((el.text || '').trim().replace(/\s+/g, ' ').slice(0, 64) || 'Empty text') })));
  const mapped = Object.keys(mapping).length > 0;
  const preview = table && mapped ? bulkFilledPages(project.canvases, mapping, table.rows[rowIndex])[pageIndex] : null;
  const overflow = preview?.elements.some(el => Object.hasOwn(mapping, el.id) &&
    (el.x < 0 || el.y < 0 || el.x + el.w > preview.w || el.y + el.h > preview.h));

  function loadTable(value) {
    setInput(value);
    setError('');
    try {
      setTable(parseBulkTable(value));
      setMapping({});
      setRowIndex(0);
      setPageIndex(0);
    } catch (err) {
      setTable(null);
      setError(err.message);
    }
  }

  function create() {
    const timestamp = now();
    const copies = table.rows.map((row, index) => {
      const canvases = structuredClone(bulkFilledPages(project.canvases, mapping, row)).map(page => ({
        ...page, id: uid(), elements: page.elements.map(el => ({ ...el, id: uid() })),
      }));
      const { sourceText, sourceDraft, generatedSourceText, carouselSettings, ...design } = project;
      return {
        ...design, id: uid(), name: project.name + ' · ' + (index + 1),
        createdAt: timestamp, updatedAt: timestamp, thumbnail: null,
        finished: false, finishedAt: null, contentEntryId: null, aiError: '',
        canvases, activeCanvasId: canvases[0].id,
      };
    });
    onCreate(copies);
  }

  return <dialog ref={dialog} className="studio-resize-dialog studio-bulk-dialog" aria-labelledby="studio-bulk-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id="studio-bulk-title">Bulk create</h2>
    {!fields.length ? <p>Add an unlocked text box to this design before bulk creating.</p> : !table ? <>
      <p>Paste from a spreadsheet or upload a CSV. Use column headings in the first row. Each data row creates an editable copy.</p>
      <label>Spreadsheet data<textarea value={input} onChange={e => setInput(e.target.value)} rows={5} placeholder={'Question,Answer\nHow do I wash my pads?,Rinse in cold water first.'} /></label>
      <label>Upload CSV<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 500000) { setError('Use a table smaller than 500 KB.'); return; }
        try { loadTable(await file.text()); } catch { setError('Could not read this file.'); }
      }} /></label>
      {error && <p role="alert">{error}</p>}
      <button className="simple-action" onClick={() => loadTable(input)}>Map columns</button>
    </> : <>
      <p>Choose a column for each text box you want to fill. Unmapped text stays as it is.</p>
      <div className="studio-bulk-fields">{fields.map(field => <label key={field.id}>{field.label}
        <select value={mapping[field.id] ?? ''} onChange={e => {
          const column = e.target.value;
          setMapping(previous => {
            const next = { ...previous };
            if (column === '') delete next[field.id];
            else next[field.id] = Number(column);
            return next;
          });
        }}>
          <option value="">Keep template text</option>
          {table.headers.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
      </label>)}</div>
      {preview && <>
        <div className="studio-bulk-fields">
          <label>Preview row<select value={rowIndex} onChange={e => setRowIndex(Number(e.target.value))}>
            {table.rows.map((_, index) => <option key={index} value={index}>Row {index + 1}</option>)}
          </select></label>
          {project.canvases.length > 1 && <label>Preview slide<select value={pageIndex} onChange={e => setPageIndex(Number(e.target.value))}>
            {project.canvases.map((page, index) => <option key={page.id} value={index}>Slide {index + 1}</option>)}
          </select></label>}
        </div>
        <div className="studio-resize-preview"><MiniPreview canvas={preview} maxW={Math.min(320, window.innerWidth - 76)} maxH={320} /></div>
        {overflow && <p role="status">Some mapped text extends beyond this slide. Check it before posting.</p>}
      </>}
      <div className="studio-resize-actions">
        <button className="simple-action simple-secondary" onClick={() => setTable(null)}>Edit data</button>
        <button className="simple-action" disabled={!mapped} onClick={create}>Create {table.rows.length} {table.rows.length === 1 ? 'design' : 'designs'}</button>
      </div>
    </>}
    <div className="studio-resize-actions"><button className="simple-action simple-secondary" onClick={onClose}>Cancel</button></div>
  </dialog>;
}
