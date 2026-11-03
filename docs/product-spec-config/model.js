(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpecModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MODULES=[{id:'basic',name:'基础信息',icon:'file',description:'定义产品身份、型号与基础规格信息'},{id:'parts',name:'产品主要部件',icon:'layers',description:'维护核心组件、材料及供应商信息'},{id:'performance',name:'产品性能',icon:'activity',description:'定义额定参数、性能指标与测试要求'},{id:'safety',name:'安规重要零件',icon:'shield',description:'维护安规关键零件及认证信息'}];
  const TYPES={text:'文本填写框',textarea:'多行文本框',number:'数字填写框',select:'下拉单选框',multi:'下拉多选框',date:'日期选择器'};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const options=v=>[...new Set(String(v||'').split(/[,，\n;；]/).map(s=>s.trim()).filter(Boolean))];
  function field(module,name,key,type='text',required=false,value='',opts=''){return{id:uid(),module,name,key,type,required,value,options:opts};}
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
      if(['select','multi'].includes(f.type)){const opts=options(f.options);if(!opts.length)fail('请填写可选值');const selected=f.type==='multi'?options(f.value):String(f.value??'').trim()?[String(f.value??'').trim()]:[];if(selected.some(x=>!opts.includes(x)))fail('默认值必须属于可选值');}
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
  return{MODULES,TYPES,clone,uid,options,field,validate,createVersion,publish,published,setDefault,nextChildCode,createChild,seed};
});
