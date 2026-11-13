const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../docs/product-spec-config/model.js');
function table(){return {...M.field('parts','产品主要部件','parts_table','table',true),columns:M.productPartsColumns()};}
test('部件清单按中英文逗号和换行生成，保留重复顺序、忽略空项',()=>{
  const f=table();f.columns[0].value=' 顶板，侧板,,\n底板\r\n背板，顶板， ';f.columns[2].value='实木';
  const rows=M.initialTableRows(f);assert.deepEqual(rows.map(r=>r[f.columns[0].key]),['顶板','侧板','底板','背板','顶板']);
  assert(rows.every(r=>r[f.columns[2].key]==='实木'&&r[f.columns[1].key]===''));
});
test('无预设兼容空行；新增行不重复部件清单；普通文本的逗号不拆行',()=>{
  const f=table();assert.equal(M.initialTableRows(f).length,1);f.columns[0].value='A,B';f.columns[2].value='木材,金属';
  const r=M.newTableRow(f.columns);assert.equal(r[f.columns[0].key],'');assert.equal(r[f.columns[2].key],'木材,金属');
  delete f.columns[0].generateRows;assert.equal(M.initialTableRows(f).length,2);
});
test('已有填写与显式空行不被默认值覆盖，返回独立副本',()=>{
  const f=table();f.columns[0].value='A,B';f.rows=[M.blankRow(f.columns)];f.rows[0][f.columns[2].key]='用户填写';
  const rows=M.initialTableRows(f);assert.deepEqual(rows,f.rows);rows[0][f.columns[2].key]='changed';assert.equal(f.rows[0][f.columns[2].key],'用户填写');
  f.rows=[];assert.deepEqual(M.initialTableRows(f),[]);
});
test('模板可保存缺少必填尺寸的预设，配置保留且不保存填报数据',()=>{
  const s=M.seedTemplates(),t=s.templates[0],f=table();f.columns[0].value='A,B';f.columns[2].value='实木';
  assert.deepEqual(M.validate([f]),[]);const next=M.saveSpec(s,{...t,fields:[f]});const saved=next.templates[0].fields[0];
  assert.equal(saved.columns[0].value,'A,B');assert.equal(saved.rows,undefined);
  const copy=M.cloneFields([f])[0];assert.equal(M.initialTableRows(copy).length,2);assert.notEqual(copy.columns[0].key,f.columns[0].key);
  assert(M.validateTableRows(f,M.initialTableRows(f)).some(e=>e.message.includes('尺寸')));
});
test('列默认值校验选项、数字、日期、附件和多选',()=>{
  for(const [type,value,opts] of [['select','木','金属'],['multi','木,纸','木,金属'],['number','abc',''],['date','2026-02-30',''],['attachment','文件.pdf','']]){
    const f=table();Object.assign(f.columns[2],{type,value,options:opts});assert(M.validate([f]).length>0,type);
  }
  const f=table();Object.assign(f.columns[2],{type:'multi',value:'木,金属',options:'木,金属'});assert.deepEqual(M.validate([f]),[]);
});
test('原型脚本可解析，避免静态复制构建漏掉语法错误',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
  for(const file of ['app.js','model.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(__dirname,'../docs/product-spec-config',file),'utf8'),{filename:file}));
});
test('部件列调整名称和顺序后仍按清单生成，非文本列不能生成行',()=>{
  const f=table(),name=f.columns.shift();name.name='组件';name.value='A,B';f.columns.push(name);
  assert.deepEqual(M.initialTableRows(f).map(r=>r[name.key]),['A','B']);
  name.type='number';assert(M.validate([f]).some(e=>e.message.includes('文本控件')));
});
