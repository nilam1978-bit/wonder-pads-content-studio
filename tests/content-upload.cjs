const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const s=fs.readFileSync(path.join(root,'ready-content.jsx'),'utf8'),ctx={};vm.createContext(ctx);vm.runInContext(s.slice(s.indexOf('function parseContentUpload'),s.indexOf('function ContentUpload')),ctx);
const sample='# Library name\r\n## Image headline\r\nSmall body.\r\n\r\nCaption:\r\nCaption only.\r\nHashtags: #Example';
let r=ctx.parseContentUpload(sample);assert.equal(r.errors.length,0);assert.equal(r.posts[0].body,'Small body.');assert.equal(r.posts[0].caption,'Caption only.');assert.equal(r.posts[0].hashtags,'#Example');
r=ctx.parseContentUpload('## Headline only\nBody\n## Second\nMore body');assert.equal(r.posts.length,2);assert.equal(r.posts[0].title,'Headline only');assert.equal(r.posts[0].caption,'');
assert(ctx.parseContentUpload('# Missing headline\nBody').errors.length);
assert.equal(ctx.parseContentUpload('').posts.length,0);
const u=fs.readFileSync(path.join(root,'editor-utils.jsx'),'utf8');const cases=u.slice(u.indexOf("    case 'add-content-batch':"),u.indexOf("    case 'add-calendar-entry':"));const reducer=new Function('state','action','switch(action.type){'+cases+'}');const entry={id:'a',uploadKey:'same',importBatchId:'batch'};let state=reducer({calendar:[],projects:[{id:'design'}]},{type:'add-content-batch',entries:[entry,entry]});assert.equal(state.calendar.length,1);state=reducer(state,{type:'add-content-batch',entries:[entry]});assert.equal(state.calendar.length,1);state=reducer(state,{type:'undo-content-batch',batchId:'batch'});assert.equal(state.calendar.length,0);assert.equal(state.projects.length,1);
console.log('PASS: headline/body/caption separation; optional sections; CRLF; missing headings; duplicate skipping; batch undo preserves designs.');

