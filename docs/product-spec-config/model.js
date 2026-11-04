(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpecModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MODULES=[{id:'basic',name:'基础信息',icon:'file',description:'定义产品身份、型号与基础规格信息'},{id:'parts',name:'产品结构',icon:'layers',description:'维护核心组件、材料及供应商信息'},{id:'performance',name:'产品性能',icon:'activity',description:'定义额定参数、性能指标与测试要求'},{id:'safety',name:'安规重要零件',icon:'shield',description:'维护安规关键零件信息'},{id:'label',name:'产品标贴',icon:'tag',description:'维护标贴内容、位置、材质与警示信息'},{id:'package',name:'产品包装',icon:'box',description:'维护包装方式、包材与包装标识'},{id:'cert',name:'认证信息',icon:'check',description:'维护认证证书、无法上传原因与认证说明'}];
  const TYPES={text:'文本填写框',textarea:'多行文本框',number:'数字填写框',select:'下拉单选框',multi:'下拉多选框',date:'日期选择器',attachment:'上传附件',image:'上传图片',anyfill:'任填组合',table:'明细表格'};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const options=v=>[...new Set(String(v||'').split(/[,，\n;；]/).map(s=>s.trim()).filter(Boolean))];
  function field(module,name,key,type='text',required=false,value='',opts=''){return{id:uid(),module,name,key,type,required,value,options:opts};}
  const ATTACHMENT_MAX_BYTES=90*1024*1024;
  const IMAGE_MAX_BYTES=20*1024*1024;
  const IMAGE_ACCEPT='.jpg,.jpeg,.png,.JPG,.JPEG,.PNG';
  const ANYFILL_PLACEHOLDER='请输入暂无法上传原因或上传证书';
  const imageLimit=value=>{const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=20?n:0;};
  const ATTACHMENT_ACCEPT='.xls,.xlsx,.doc,.docx,.pdf';
  function validateAttachment(file){
    if(!file||!Number.isFinite(file.size)||file.size<0)return '无法识别文件大小，请重新选择文件';
    if(!/\.(xls|xlsx|doc|docx|pdf)$/i.test(String(file.name||'')))return '仅支持 Excel / Word / PDF 文件（.xls、.xlsx、.doc、.docx、.pdf）';
    if(file.size>ATTACHMENT_MAX_BYTES)return '单个附件不能超过 90 MB';
    return '';
  }

  function validateImageFile(file){
    if(!file||!Number.isFinite(file.size)||file.size<0)return '无法识别文件大小，请重新选择文件';
    if(!/\.(jpe?g|png)$/i.test(String(file.name||'')))return '只能上传 jpg、jpeg、png 文件';
    if(file.size>IMAGE_MAX_BYTES)return '单张图片不能超过 20 MB';
    return '';
  }
  function validateImageSelection(files,maxCount){
    const list=Array.from(files||[]);
    const limit=imageLimit(maxCount);
    if(!limit)return '请设置 1–20 的图片数量上限';
    if(list.length>limit)return '最多上传 '+limit+' 张图片';
    for(const file of list){const error=validateImageFile(file);if(error)return error;}
    return '';
  }
  function validateAnyFill(field,values){
    const list=(Array.isArray(values)&&values.length?values:['']).map(value=>String(value??'').trim());
    const filled=list.filter(Boolean);
    if(!field?.required)return {ok:true,message:''};
    if(field.anyOnePasses!==false)return filled.length?{ok:true,message:'已填写一项，可通过必填校验'}:{ok:false,message:'请至少填写一项'};
    if(!list.length||list.some(value=>!value))return {ok:false,message:'请填写全部内容'};
    return {ok:true,message:'已填写全部内容'};
  }
  function newField(fields,module){
    const stem='field_'+uid().replace(/[^a-zA-Z0-9_]/g,'');let key=stem,index=1;
    const keys=new Set(fields.map(f=>String(f.key).toLowerCase()));
    while(keys.has(key.toLowerCase()))key=stem+'_'+index++;
    return field(module,'',key);
  }
  function newColumn(columns,name=''){const stem='col_'+uid().replace(/[^a-zA-Z0-9_]/g,'');let key=stem,index=1;const keys=new Set(columns.map(c=>String(c.key).toLowerCase()));while(keys.has(key.toLowerCase()))key=stem+'_'+index++;return{id:uid(),name,key,type:'text',required:false,options:'',value:''};}
  function productPartsColumns(){const columns=[];const defs=[['部件名称','text',true],['部件尺寸(cm)','text',true],['材质','text',true],['规格/壁厚','text',true],['表面处理','text',true],['备注','textarea',false]];for(const [name,type,required] of defs){const column=newColumn(columns,name);column.type=type;column.required=required;columns.push(column);}return columns;}
  function blankRow(columns){return Object.fromEntries(columns.map(c=>[c.key,'']));}
  function rowEmpty(columns,row){return columns.every(c=>!String(row?.[c.key]??'').trim());}
  function validateColumn(column,fail){if(!column.name?.trim())fail('列名称不能为空');if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(column.key||'')))fail('列标识无效');if(!Object.hasOwn(TYPES,column.type)||['table','image','anyfill'].includes(column.type))fail('列控件类型无效');if(['select','multi'].includes(column.type)&&!options(column.options).length)fail('请填写可选值');if(column.type==='attachment'&&String(column.value??'').trim())fail('上传附件不支持设置默认文件');}
  function validateTableRows(field,rows){const errors=[],columns=field.columns||[];if(!Array.isArray(rows)||!rows.length){if(field.required)errors.push({id:field.id,row:0,message:'明细表格至少填写一行'});return errors;}rows.forEach((row,rowIndex)=>{if(rowEmpty(columns,row)){if(field.required)errors.push({id:field.id,row:rowIndex,message:'不能保存全空行'});return;}columns.forEach(column=>{const value=String(row?.[column.key]??'').trim();const fail=message=>errors.push({id:field.id,row:rowIndex,columnKey:column.key,message:column.name+'：'+message});if(column.required&&!value)fail('请填写'+column.name);if(value&&['select','multi'].includes(column.type)){const opts=options(column.options),selected=column.type==='multi'?options(value):[value];if(selected.some(x=>!opts.includes(x)))fail('填写值必须属于可选值');}if(value&&column.type==='number'&&!Number.isFinite(Number(value)))fail('请输入有效数字');if(value&&column.type==='date'){const date=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)fail('请输入有效日期');}});});return errors;}
  function base(){return[
    field('basic','产品名称','product_name','text',true),field('basic','产品型号','product_model','text',true),
    field('basic','产品颜色','product_color','select',true,'白色','白色,黑色,灰色'),field('basic','销售区域','sales_region','multi',false,'欧洲','欧洲,北美,日本,中国'),
    field('basic','产品净重（kg）','net_weight','number',false),field('basic','产品尺寸（mm）','product_size','text',false),
    field('parts','电机型号','motor_model','text',true),field('parts','机身材质','body_material','select',true,'ABS','ABS,PC,不锈钢'),
    field('parts','电池容量（mAh）','battery_capacity','number',false),field('parts','主要部件说明','parts_description','textarea'),
    field('performance','额定功率（W）','rated_power','number',true),field('performance','额定电压（V）','rated_voltage','select',true,'220','110,220,240'),
    field('performance','噪声（dB）','noise_level','number'),field('performance','性能测试要求','test_requirements','textarea'),
    field('safety','电源线规格','power_cord','text',true),field('safety','认证要求','certification','multi',true,'CE','CE,CB,UL,ETL,CCC'),field('safety','安规零件供应商','safety_supplier','text',true)
  ];}
  function validate(fields){
    const errors=[],keys=new Set();
    if(!fields.length)return[{message:'请至少配置一个字段',module:'basic'}];
    for(const f of fields){const fail=message=>errors.push({id:f.id,module:f.module,message});
      if(!f.name.trim())fail('字段名称不能为空');
      if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key.trim()))fail('字段标识需以字母开头，仅含字母、数字和下划线');
      const k=f.key.trim().toLowerCase();if(keys.has(k))fail('字段标识重复，请使用唯一标识');keys.add(k);
      if(!MODULES.some(m=>m.id===f.module))fail('字段所属模块无效');
      if(!Object.hasOwn(TYPES,f.type))fail('控件类型无效');
      if(f.type==='table'){if(!Array.isArray(f.columns)||!f.columns.length)fail('明细表格至少配置一列');const keys=new Set();for(const column of f.columns||[]){validateColumn(column,fail);const key=String(column.key||'').toLowerCase();if(keys.has(key))fail('列标识重复');keys.add(key);}if(Array.isArray(f.rows))errors.push(...validateTableRows(f,f.rows));}
      if(['select','multi'].includes(f.type)){const opts=options(f.options);if(!opts.length)fail('请填写可选值');const selected=f.type==='multi'?options(f.value):String(f.value??'').trim()?[String(f.value??'').trim()]:[];if(selected.some(x=>!opts.includes(x)))fail('默认值必须属于可选值');}
      if(f.type==='attachment'&&String(f.value??'').trim())fail('上传附件不支持设置默认文件');
      if(f.type==='image'){if(!imageLimit(f.maxCount))fail('图片数量上限需为 1–20 的整数');if(String(f.value??'').trim())fail('上传图片不支持设置默认文件');}
      if(f.type==='anyfill'&&String(f.placeholder||'').length>80)fail('填写提示不能超过 80 个字符');
      if(f.type==='number'&&String(f.value??'').trim()&&!Number.isFinite(Number(f.value)))fail('请输入有效的数字默认值');
      if(f.type==='date'&&f.value){const value=String(f.value),date=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)fail('日期默认值需为有效的 YYYY-MM-DD 日期');}
    }return errors;
  }
  function createVersion(child,source,number,name){number=number.trim().toUpperCase();name=name.trim();if(!/^V\d+\.\d+$/.test(number))throw Error('版本号格式应为 V1.0');if(child.versions.some(v=>v.number.toUpperCase()===number))throw Error('版本号已存在，请使用新版本号');if(!name)throw Error('请输入版本名称');return{id:uid(),number,name,status:'draft',fields:clone(source),updated:'2026-11-02 14:30',author:'林晓',source:'复制模板'};}
  function publish(child,version){if(!child.versions.includes(version))throw Error('版本归属无效');if(child.versions.some(v=>v.id!==version.id&&v.number.trim().toUpperCase()===version.number.trim().toUpperCase()))throw Error('版本号重复');if(version.status==='published')throw Error('已发布版本不可直接修改');const errors=validate(version.fields);if(errors.length)throw Error(errors[0].message);version.status='published';if(!child.defaultVersionId)child.defaultVersionId=version.id;}
  const published=child=>child.versions.filter(v=>v.status==='published');
  function setDefault(child,id){if(!published(child).some(v=>v.id===id))throw Error('只能将已发布版本设为默认');child.defaultVersionId=id;}
  function nextChildCode(group){
    const prefix=group.code+'-';
    const numbers=group.children.map(c=>c.code.startsWith(prefix)?Number(c.code.slice(prefix.length)):0).filter(Number.isFinite);
    return prefix+String(Math.max(0,...numbers)+1).padStart(3,'0');
  }
  function createChild(group,name,updated){
    name=name.trim();
    if(!name)throw Error('请输入二级品线名称');
    if(name.length>40)throw Error('品线名称不能超过40个字符');
    if(group.children.some(c=>c.name.trim().toLowerCase()===name.toLowerCase()))throw Error('该一级品线下已存在同名二级品线');
    const child={id:uid(),name,code:nextChildCode(group),author:'林晓',updated,versions:[],defaultVersionId:null};
    const version=createVersion(child,group.template,'V1.0','继承默认模板');
    version.source='一级默认模板（自动继承）';version.updated=updated;
    child.versions.push(version);
    return child;
  }
  function seed(){
    const rows=[['home','家用电器','PL-001','吸尘器','洗地机','空气净化器','电风扇'],['kitchen','厨房电器','PL-002','空气炸锅','咖啡机','电热水壶'],['care','个护健康','PL-003','电动牙刷','电吹风'],['outdoor','户外园艺','PL-004','高压清洗机','割草机']];
    return{schema:1,groups:rows.map(([id,name,code,...names],gi)=>{const template=base();return{id,name,code,template,updated:'2026-11-02 10:24',children:names.map((n,i)=>{const empty=gi===3&&i===1;const first={id:`${id}-${i}-v1`,number:'V1.0',name:'通用标准版',status:'published',fields:clone(template),updated:'2026-10-28 16:32',author:'陈悦',source:'一级默认模板'};const second={...clone(first),id:`${id}-${i}-v2`,number:'V1.1',name:'海外销售版',updated:'2026-10-30 11:08',author:'林晓'};second.fields.push(field('basic','包装语言','package_language','select',true,'英语','英语,德语,法语,日语'));const draft={...clone(second),id:`${id}-${i}-draft`,number:'V2.0',name:'新品升级版',status:'draft',updated:'2026-11-02 10:24'};return{id:`${id}-${i}`,name:n,code:`${code}-${String(i+1).padStart(3,'0')}`,author:i%2?'陈悦':'林晓',updated:'2026-11-02 10:24',versions:empty?[]:i===0?[first,second,draft]:[first],defaultVersionId:empty?null:first.id};})};})};
  }

  // Schema 2 separates template ownership from secondary-line associations.
  const defaultActor='演示用户';
  const timestamp=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  function groupOf(data,id){const g=data.groups.find(g=>g.id===id);if(!g)throw Error('一级品线不存在');return g;}
  function specOf(data,id){const t=data.templates.find(t=>t.id===id);if(!t)throw Error('规格书不存在');return t;}
  function lineOf(data,id){for(const g of data.groups){const c=g.children.find(c=>c.id===id);if(c)return{group:g,line:c};}throw Error('二级品线不存在');}
  function ownedSpec(data,groupId,id){const t=specOf(data,id);if(t.groupId!==groupId)throw Error('只能选择同一一级品线下的规格书');return t;}
  function assertLinks(data,ids,primary){if(!Array.isArray(ids)||!ids.length)throw Error('每个二级品线至少关联一个规格书');for(const id of ids)specOf(data,id);if(typeof primary!=='string'||!ids.includes(primary))throw Error('必须在已关联规格书中选择一个主模板');}
  function touch(object,actor,at){object.updater=actor;object.updatedAt=at;}
  function normalizeRemark(value){
    const remark=String(value??'').trim();
    if(remark.length>200)throw Error('备注不能超过200个字符');
    return remark;
  }
  function saveSpec(data,input,actor=defaultActor,at=timestamp()){
    const name=String(input.name||'').trim();if(!name)throw Error('请输入规格书名称');if(name.length>60)throw Error('规格书名称不能超过60个字符');
    const old=data.templates.find(t=>t.id===input.id);
    const remark=input.remark===undefined?String(old?.remark||'').trim():normalizeRemark(input.remark);
    if(data.templates.some(t=>t.id!==input.id&&t.name.trim().toLowerCase()===name.toLowerCase()))throw Error('已存在同名规格书');
    const errors=validate(input.fields||[]);if(errors.length)throw Error(errors[0].message);
    const next=clone(data);const t={...(old||{}),id:old?.id||input.id||uid(),name,remark,groupId:null,fields:clone(input.fields),creator:old?.creator||actor,createdAt:old?.createdAt||at,updater:actor,updatedAt:at};
    t.fields.forEach(f=>{f.name=f.name.trim();f.key=f.key.trim();if(f.type==='table'){f.columns=(f.columns||[]).map(c=>({...c,name:c.name.trim(),key:c.key.trim()}));delete f.rows;delete f.entries;}});
    const index=next.templates.findIndex(v=>v.id===t.id);if(index<0)next.templates.push(t);else next.templates[index]=t;return next;
  }
  function configureLine(data,lineId,templateIds,primaryTemplateId,actor=defaultActor,at=timestamp()){
    lineOf(data,lineId);assertLinks(data,templateIds,primaryTemplateId);
    const next=clone(data),{line}=lineOf(next,lineId);line.templateIds=[...new Set(templateIds)];line.primaryTemplateId=primaryTemplateId;touch(line,actor,at);return next;
  }
  function setGroupDefault(data,groupId,templateId,actor=defaultActor,at=timestamp()){
    groupOf(data,groupId);specOf(data,templateId);const next=clone(data),g=groupOf(next,groupId);g.defaultTemplateId=templateId;touch(g,actor,at);return next;
  }
  function specLines(data,templateId){specOf(data,templateId);return data.groups.flatMap(g=>g.children.filter(c=>c.templateIds.includes(templateId)).map(c=>({id:c.id,name:c.name,groupId:g.id,groupName:g.name,primary:c.primaryTemplateId===templateId})));}
  function setSpecLines(){throw Error('一期请在品线管理中关联规格书');}
  function retiredSetSpecLines(data,templateId,selectedIds,primaryChoices={},actor=defaultActor,at=timestamp()){
    const t=specOf(data,templateId),g=groupOf(data,t.groupId),selected=new Set(selectedIds);
    for(const id of selected){if(lineOf(data,id).group.id!==g.id)throw Error('只能关联所属一级品线下的二级品线');}
    for(const [id,value] of Object.entries(primaryChoices)){
      if(typeof value!=='boolean')throw Error('是否主模板只能选择是或否');
      if(!selected.has(id))throw Error('请先勾选关联品线，再设置是否主模板');
    }
    const next=clone(data),ng=groupOf(next,g.id);
    for(const c of ng.children){
      const had=c.templateIds.includes(templateId),add=selected.has(c.id);
      const ids=add?[...new Set([...c.templateIds,templateId])]:c.templateIds.filter(id=>id!==templateId);
      const isPrimary=add&&(Object.hasOwn(primaryChoices,c.id)?primaryChoices[c.id]:had&&c.primaryTemplateId===templateId);
      let primary=c.primaryTemplateId;
      if(isPrimary)primary=templateId;
      else if(primary===templateId){
        if(!ids.length)throw Error(c.name+'：至少保留一个规格书关联');
        throw Error(c.name+'：当前规格书是主模板，请先在品线管理中设置其他主模板，再取消关联或选择否');
      }
      if(had===add&&primary===c.primaryTemplateId)continue;
      assertLinks(next,ng,ids,primary);
      c.templateIds=ids;c.primaryTemplateId=primary;touch(c,actor,at);
    }
    return next;
  }
  function initializationReport(data){const result={pending:[],ready:[],blocked:[]};for(const g of data.groups){for(const c of g.children){try{
    if(!c.templateIds.length){if(!g.defaultTemplateId)throw Error('一级品线尚未设置默认模板');specOf(data,g.defaultTemplateId);result.pending.push({id:c.id,name:c.name,groupName:g.name});}
    else{assertLinks(data,c.templateIds,c.primaryTemplateId);result.ready.push({id:c.id,name:c.name});}
    }catch(e){result.blocked.push({id:c.id,name:c.name,groupName:g.name,message:e.message});}}}return result;}
  function initializeLinks(data,actor='初始化',at=timestamp()){
    const report=initializationReport(data);if(report.blocked.length)throw Error(report.blocked.map(x=>x.groupName+' / '+x.name+'：'+x.message).join('；'));
    const next=clone(data);for(const id of report.pending.map(c=>c.id)){const {group,line}=lineOf(next,id);line.templateIds=[group.defaultTemplateId];line.primaryTemplateId=group.defaultTemplateId;touch(line,actor,at);}return next;
  }
  function createLine(data,groupId,name,actor=defaultActor,at=timestamp()){
    const g=groupOf(data,groupId);name=String(name||'').trim();if(!name)throw Error('请输入二级品线名称');if(name.length>40)throw Error('品线名称不能超过40个字符');if(g.children.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw Error('同一级品线下已存在同名品线');
    if(!g.defaultTemplateId)throw Error('请先设置一级品线默认模板');specOf(data,g.defaultTemplateId);
    const next=clone(data);groupOf(next,groupId).children.push({id:uid(),name,code:nextChildCode(g),templateIds:[g.defaultTemplateId],primaryTemplateId:g.defaultTemplateId,creator:actor,updater:actor,updatedAt:at});return next;
  }
  function spuSelection(data,lineId,templateId){const {group,line}=lineOf(data,lineId);assertLinks(data,line.templateIds,line.primaryTemplateId);const id=templateId||line.primaryTemplateId;if(!line.templateIds.includes(id))throw Error('只能选择该二级品线已关联的规格书');return{templates:line.templateIds.map(id=>clone(specOf(data,id))),selected:clone(specOf(data,id)),primaryTemplateId:line.primaryTemplateId};}
  function validShape(data){return data&&data.schema===2&&Array.isArray(data.groups)&&Array.isArray(data.templates)&&data.groups.every(g=>g&&typeof g.id==='string'&&Array.isArray(g.children)&&g.children.every(c=>c&&Array.isArray(c.templateIds)))&&data.templates.every(t=>t&&typeof t.id==='string'&&typeof t.name==='string'&&Array.isArray(t.fields));}
  function upgradeTemplates(old){
    if(validShape(old))return clone(old);
    if(!old||old.schema!==1||!Array.isArray(old.groups))throw Error('保存的数据格式不支持，请保留原数据后联系维护人员');
    const next={schema:2,groups:[],templates:[],migration:{from:1,notice:'已保留旧模板与不同字段配置；二级主模板按一级原模板初始化。旧浏览器数据未覆盖。'}};
    for(const g of old.groups){if(!Array.isArray(g.template)||!Array.isArray(g.children))throw Error('旧数据不完整，未覆盖原数据');
      const defaultId='legacy-default-'+g.id;const group={id:g.id,name:g.name,code:g.code,defaultTemplateId:defaultId,updater:'演示用户',updatedAt:g.updated||timestamp(),children:g.children.map(c=>({id:c.id,name:c.name,code:c.code,templateIds:[defaultId],primaryTemplateId:defaultId,creator:c.author||defaultActor,updater:c.author||defaultActor,updatedAt:c.updated||timestamp()}))};next.groups.push(group);
      const normalized=fields=>JSON.stringify(fields.map(({id,...rest})=>rest));const signatures=new Set([normalized(g.template)]);
      next.templates.push({id:defaultId,groupId:g.id,name:g.name+'通用规格书（原模板）',fields:clone(g.template),creator:defaultActor,updater:defaultActor,createdAt:g.updated||timestamp(),updatedAt:g.updated||timestamp(),origin:'legacy-default'});
      for(const c of g.children){for(const v of c.versions||[]){const sig=normalized(v.fields);if(signatures.has(sig))continue;signatures.add(sig);let name=c.name+' · '+v.name;let index=2;while(next.templates.some(t=>t.groupId===g.id&&t.name===name))name=c.name+' · '+v.name+'（'+index+++'）';next.templates.push({id:uid(),groupId:g.id,name,fields:clone(v.fields),creator:v.author||defaultActor,updater:v.author||defaultActor,createdAt:v.updated||timestamp(),updatedAt:v.updated||timestamp(),origin:'legacy-preserved'});}}
    }
    return next;
  }
  function seedTemplates(){
    const old=seed();for(const g of old.groups)for(const c of g.children)c.versions=[];
    let data=upgradeTemplates(old);delete data.migration;
    data=saveSpec(data,{groupId:'home',name:'家电海外销售规格书',remark:'适用于家用电器出口销售，覆盖欧洲、北美等市场',fields:[...base(),field('basic','包装语言','package_language','select',true,'英语','英语,德语,法语')]},defaultActor,'2026-11-03 09:00');
    data=saveSpec(data,{groupId:'home',name:'清洁电器规格书',remark:'适用于吸尘器、洗地机等清洁类产品',fields:[...base(),field('performance','吸力（Pa）','suction','number',true)]},defaultActor,'2026-11-03 09:20');
    data=saveSpec(data,{groupId:'kitchen',name:'食品接触类规格书',remark:'适用于厨房电器中与食品接触的产品',fields:[...base(),field('safety','食品接触认证','food_contact','text',true)]},defaultActor,'2026-11-03 09:40');
    return data;
  }

  function cloneFields(sourceFields){
    if(!Array.isArray(sourceFields))throw Error('字段配置无效');
    const fields=[];
    for(const source of clone(sourceFields)){
      if(!source||typeof source!=='object')throw Error('字段配置无效');
      const module=source.module||'basic';
      const fresh=newField(fields,module);
      const next={...source,id:fresh.id,key:fresh.key,module};
      delete next.rows;
      if(next.type==='table'){
        const columns=[];
        for(const column of Array.isArray(source.columns)?source.columns:[]){
          if(!column||typeof column!=='object')throw Error('表格列配置无效');
          const freshColumn=newColumn(columns,column.name||'');
          columns.push({...column,id:freshColumn.id,key:freshColumn.key});
        }
        next.columns=columns;
      }else delete next.columns;
      fields.push(next);
    }
    return fields;
  }
  function copiedSpecName(sourceName,currentName,existingNames=[]){
    const current=String(currentName??'').trim();
    if(current)return current;
    const taken=new Set((existingNames||[]).map(name=>String(name??'').trim().toLowerCase()));
    const raw=(String(sourceName??'').trim()||'规格书')+'副本';
    for(let index=1;index<1000;index++){
      const suffix=index===1?'':String(index);
      const name=(raw.slice(0,Math.max(1,60-suffix.length))+suffix).slice(0,60);
      if(!taken.has(name.toLowerCase()))return name;
    }
    throw Error('无法生成不重复的规格书名称');
  }

  return{MODULES,TYPES,ATTACHMENT_MAX_BYTES,ATTACHMENT_ACCEPT,IMAGE_MAX_BYTES,IMAGE_ACCEPT,ANYFILL_PLACEHOLDER,imageLimit,validateAttachment,validateImageFile,validateImageSelection,validateAnyFill,newField,newColumn,productPartsColumns,blankRow,validateTableRows,clone,cloneFields,copiedSpecName,uid,options,field,validate,createVersion,publish,published,setDefault,nextChildCode,createChild,seed,baseFields:base,saveSpec,configureLine,setGroupDefault,specLines,setSpecLines,initializationReport,initializeLinks,createLine,spuSelection,upgradeTemplates,seedTemplates};
});
