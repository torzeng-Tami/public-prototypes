const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../docs/product-spec-config/model.js');
const names=['部件名称','部件尺寸(cm)','材质','规格/壁厚','表面处理','备注'];
test('product parts preset creates six configurable columns with internal keys hidden from the template contract',()=>{
  const cols=M.productPartsColumns();
  assert.deepEqual(cols.map(c=>c.name),names);
  assert.deepEqual(cols.map(c=>c.required),[true,true,true,true,true,false]);
  assert.equal(cols.at(-1).type,'textarea');
  assert.equal(new Set(cols.map(c=>c.key.toLowerCase())).size,6);
  assert(cols.every(c=>/^[A-Za-z][A-Za-z0-9_]*$/.test(c.key)));
  assert.equal(M.TYPES.table,'明细表格');
});
test('table field requires at least one column and unique generated column keys',()=>{
  const f=M.field('parts','产品主要部件','parts_table','table',true);
  f.columns=[];
  assert(M.validate([f]).some(e=>e.message.includes('至少配置一列')));
  f.columns=M.productPartsColumns();
  const extra=M.newColumn(f.columns,'备注');
  extra.name='补充说明';
  f.columns.push(extra);
  assert.deepEqual(M.validate([f]),[]);
  assert.equal(new Set(f.columns.map(c=>c.key.toLowerCase())).size,7);
});
test('required table rejects zero rows and all-blank rows but accepts a partially filled row',()=>{
  const f=M.field('parts','产品主要部件','parts_table','table',true);
  f.columns=M.productPartsColumns();
  assert(M.validateTableRows(f,[]).some(e=>e.message.includes('至少')));
  assert(M.validateTableRows(f,[{}]).some(e=>e.row===0));
  const ok=[Object.fromEntries(f.columns.map(c=>[c.key,c.required?'示例':'' ]))];
  assert.deepEqual(M.validateTableRows(f,ok),[]);
});
test('table validation locates the exact row and required or invalid column',()=>{
  const f=M.field('parts','产品主要部件','parts_table','table',false);
  f.columns=M.productPartsColumns();
  f.columns[2].type='select'; f.columns[2].options='木板,金属';
  const errors=M.validateTableRows(f,[{[f.columns[0].key]:'底座',[f.columns[2].key]:'塑料'}]);
  assert(errors.some(e=>e.row===0&&e.columnKey===f.columns[1].key&&e.message.includes('部件尺寸')));
  assert(errors.some(e=>e.row===0&&e.columnKey===f.columns[2].key&&e.message.includes('可选值')));
});
test('saving a specification keeps table columns and does not persist sample part rows',()=>{
  const s=M.seedTemplates(),t=s.templates[0],table=M.field('parts','产品主要部件','parts_table','table',true);
  table.columns=M.productPartsColumns();
  table.rows=[Object.fromEntries(table.columns.map(c=>[c.key,c.required?'示例':'' ]))];
  const next=M.saveSpec(s,{...t,fields:[...t.fields,table]},'测试用户','2026-11-03 18:00');
  const saved=next.templates.find(x=>x.id===t.id).fields.at(-1);
  assert.equal(saved.columns.length,6);
  assert.equal(saved.rows,undefined);
  assert.equal(s.templates[0].fields.at(-1).type!=='table',true);
});
