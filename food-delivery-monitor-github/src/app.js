const $=id=>document.getElementById(id),fmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('zh-CN',{maximumFractionDigits:d,minimumFractionDigits:d}):'—',pct=(a,b)=>b?fmt(a/b*100,2)+'%':'—',esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let dataset=null,filename='',activeView='overview';
function card(label,value,note){return `<div class="card" tabindex="0"><div class="label">${label}</div><div class="value">${value}</div><div class="metric-tip" role="tooltip">${note}</div></div>`;}
function panel(title,sub,body,id=''){return `<section class="panel" id="${id}"><h3>${title}</h3><p class="note">${sub}</p>${body}</section>`;}
function bars(items){const max=Math.max(1,...items.map(x=>x[1]));return items.map(([label,v,note])=>`<div class="barrow"><span>${label}</span><div class="track"><div class="fill" style="width:${v/max*100}%"></div></div><span>${fmt(v)} ${note||''}</span></div>`).join('');}
function seriesStats(values){
  if(!values.length)return {max:0,min:0,mean:0,maxIndices:[],minIndices:[],uniform:true};
  const max=Math.max(...values),min=Math.min(...values);
  return {max,min,mean:values.reduce((sum,x)=>sum+x,0)/values.length,maxIndices:values.map((v,i)=>v===max?i:-1).filter(i=>i>=0),minIndices:values.map((v,i)=>v===min?i:-1).filter(i=>i>=0),uniform:max===min};
}
function periodList(indices,labels){const all=indices.map(i=>labels[i]);return {full:all.join('、'),short:all.slice(0,3).join('、')+(all.length>3?` 等 ${all.length} 项`:'')};}
function extremaSummary(values,labels,{mean=false,decimals=0,unit='单',caption=''}={}){
  const s=seriesStats(values),hi=periodList(s.maxIndices,labels),lo=periodList(s.minIndices,labels);
  const tile=(label,value,period,tone,digits=decimals)=>`<div class="stat-tile ${tone}"><span class="stat-caption">${label}</span><div class="stat-number">${fmt(value,digits)}<small>${unit}</small></div><span class="stat-period" title="${esc(period.full)}">${period.short}</span></div>`;
  let out=`<div class="extrema-grid ${mean?'three':''}">${tile('最高'+(s.maxIndices.length>1?' · 并列':''),s.max,hi,'peak')}${tile('最低'+(s.minIndices.length>1?' · 并列':''),s.min,lo,'trough')}${mean?tile('每日平均',s.mean,{full:caption,short:caption},'average',2):''}</div>`;
  if(s.uniform)out+='<p class="extrema-note">各时段数值相同，最高与最低相等。</p>';
  if(s.maxIndices.length>3||s.minIndices.length>3)out+=`<details class="extrema-ties"><summary>查看全部并列时段 / 日期</summary><p>最高：${hi.full}；最低：${lo.full}。</p></details>`;
  return out;
}
function chart(values,labels,bar=false,options={}){
  const w=700,h=240,left=54,bottom=29,top=options.extrema?32:18,stats=seriesStats(values),max=Math.max(1,stats.max);
  const plotRight=w-18,plotBottom=h-bottom,step=(plotRight-left)/Math.max(1,values.length-1),y=v=>plotBottom-v/max*(plotBottom-top);
  const high='#285fd2',low='#7a9ccf',normal='#91b2ee';
  let body='';
  for(let i=0;i<4;i++){const v=max*i/3;body+=`<line x1="${left}" x2="${plotRight}" y1="${y(v)}" y2="${y(v)}" stroke="#e8eef8"/><text x="${left-9}" y="${y(v)+4}" text-anchor="end">${fmt(v,max<10?1:0)}</text>`;}
  if(bar){
    const bw=(plotRight-left)/Math.max(1,values.length);
    body+=values.map((v,i)=>{const isHigh=options.extrema&&v===stats.max,isLow=options.extrema&&v===stats.min;
      const color=stats.uniform?normal:isHigh?high:isLow?low:normal;
      const cx=left+(i+.5)*bw;
      return `<rect x="${left+i*bw+3}" y="${y(v)}" width="${Math.max(1,bw-6)}" height="${plotBottom-y(v)}" rx="3" fill="${color}"${isHigh&&!stats.uniform?' stroke="#174ba9" stroke-width="1"':''}><title>${labels[i]}：${fmt(v,options.decimals||0)}${isHigh?'（最高）':''}${isLow?'（最低）':''}</title></rect>${isLow&&options.extrema?`<circle cx="${cx}" cy="${y(v)}" r="3" fill="${color}" stroke="#fff" stroke-width="1"><title>${labels[i]}：最低 ${fmt(v,options.decimals||0)}</title></circle>`:''}${(isHigh||isLow)&&!stats.uniform?`<text class="extreme-chart-label ${isHigh?'peak-label':'low-label'}" x="${cx}" y="${y(v)-8}" text-anchor="middle">${fmt(v,options.decimals||0)}</text>`:''}`;
    }).join('');
  }else{
    const points=values.map((v,i)=>`${left+i*step},${y(v)}`);
    body+=`<polygon points="${left},${plotBottom} ${points.join(' ')} ${left+(values.length-1)*step},${plotBottom}" fill="#eef4ff"/><polyline points="${points.join(' ')}" fill="none" stroke="#5985dc" stroke-width="2.5" stroke-linejoin="round"/>`;
    if(options.mean){const cy=y(stats.mean);body+=`<line class="mean-line" x1="${left}" x2="${plotRight}" y1="${cy}" y2="${cy}" stroke="#8799b8" stroke-dasharray="5 5" stroke-width="1.2"><title>每日平均：${fmt(stats.mean,2)} 人</title></line><text class="mean-label" x="${plotRight}" y="${Math.max(15,cy-8)}" text-anchor="end">平均 ${fmt(stats.mean,2)}</text>`;}
    body+=values.map((v,i)=>{
      const isHigh=options.extrema&&v===stats.max,isLow=options.extrema&&v===stats.min;
      const special=isHigh||isLow,color=stats.uniform?high:isHigh?high:isLow?low:'#5985dc';
      return `<circle cx="${left+i*step}" cy="${y(v)}" r="${special?5:2.7}" fill="${special?'#fff':color}" stroke="${color}" stroke-width="${special?2.5:1}"><title>${labels[i]}：${fmt(v,options.decimals||0)}${isHigh?'（最高）':''}${isLow?'（最低）':''}</title></circle>`;
    }).join('');
    if(options.extrema&&!stats.uniform){
      // One value label per extreme; all tied dates are marked and listed below.
      for(const [index,value,kind] of [[stats.maxIndices[0],stats.max,'最高'],[stats.minIndices[0],stats.min,'最低']]){
        const x=left+index*step,anchor=x>plotRight-65?'end':x<left+65?'start':'middle';
        body+=`<text class="extreme-chart-label ${kind==='最高'?'peak-label':'low-label'}" x="${x}" y="${Math.max(16,y(value)-12)}" text-anchor="${anchor}">${kind} ${fmt(value)}</text>`;
      }
    }
  }
  values.forEach((v,i)=>{if(i%Math.max(1,Math.ceil(values.length/7))===0||i===values.length-1)body+=`<text x="${bar?left+(i+.5)*(plotRight-left)/values.length:left+i*step}" y="${h-6}" text-anchor="middle">${labels[i]}</text>`;});
  return `<div class="chart"><svg role="img" aria-label="${options.extrema?'标出最高与最低值的':''}数据趋势图${options.mean?'，虚线为每日平均值':''}，悬停查看数值" viewBox="0 0 ${w} ${h}">${body}</svg></div>`;
}
function hourDistribution(m,average=false){
  const values=m.hours.map(v=>v/(average?m.days:1)),labels=Array.from({length:24},(_,i)=>String(i).padStart(2,'0')+':00');
  return chart(values,labels,true,{extrema:true,decimals:average?2:0})+extremaSummary(values,labels,{decimals:average?2:0,unit:average?'单 / 日':'单'})+`<p class="extrema-note">深蓝标记最高，浅蓝标记最低；统计全部 24 小时，包含零订单时段。</p>`;
}
function dailyUserDistribution(d){
  const values=d.map(x=>x.users.size),labels=d.map(x=>x.day.slice(5));
  return chart(values,labels,false,{extrema:true,mean:true})+extremaSummary(values,labels,{mean:true,unit:'人',caption:values.length+' 个观察日'})+`<p class="extrema-note">日均下单用户数 = 每日去重下单用户数之和 ÷ ${d.length} 个观察日，含无单日；同一用户跨日可重复计入。</p>`;
}
function orderStructure(m){
  return `<div class="structure-metrics"><div class="structure-metric"><span>下单人数</span><div><strong>${fmt(m.users)}</strong><small>人</small></div><p>本月观察范围内去重</p></div><span class="structure-times" aria-hidden="true">×</span><div class="structure-metric"><span>人均下单频次</span><div><strong>${m.users?fmt(m.n/m.users,3):'—'}</strong><small>单 / 人</small></div><p>订单量 ÷ 下单人数</p></div></div><div class="structure-result"><span>共同构成本月订单量</span><strong>${fmt(m.n)} <small>单</small></strong></div><p class="note">订单量 = 下单人数 × 人均下单频次。展示频次已四舍五入，计算使用原始值。</p>`;
}
function render(){if(!dataset)return;try{const m=FoodEngine.metrics(dataset.orders,$('start').value,$('end').value),d=m.daily,labels=d.map(x=>x.day.slice(5)),n=m.n;const rs=[...m.restaurants.values()],one=rs.filter(x=>x===1).length,two=rs.filter(x=>x===2).length;const bad=dataset.issues.filter(x=>x.blocking).length;$('content').innerHTML=`<div class="cards">${card('订单金额 · 规模北极星',fmt(m.amount,2),'订单原金额之和 · 沿用源数据金额单位')}${card('订单量',fmt(n),'窗口内有效、唯一订单数')}${card('客单价',n?fmt(m.amount/n,2):'—',`${fmt(m.amount,2)} ÷ ${n} 单`)}${card('佣金收入',fmt(m.commission,2),'Commission Fee 字段合计')}</div><nav><a href="#overview">经营趋势</a><a href="#demand">下单需求</a><a href="#restaurant">餐厅交易覆盖</a><a href="#user">用户与售后</a><a href="#quality">数据质量</a></nav><div class="grid">${panel('每日订单金额','每日聚合 · 缺单日期显示为 0（仅在有效数据窗口内）',chart(d.map(x=>x.amount),labels),'overview')}${panel('本月下单结构','从用户规模与购买频次理解订单量',orderStructure(m))}</div><div class="grid">${panel('小时订单分布','按下单小时聚合，支持累计量 / 日均量切换',`<select id="hourMode" aria-label="小时统计口径"><option value="total">全窗口累计订单量</option><option value="average">日均小时订单量</option></select><div id="hours">${hourDistribution(m)}</div><p class="note">日均小时量 = 该小时累计订单数 ÷ ${m.days} 个自然日，含无单日期。</p>`,'demand')}${panel('每日下单用户数','按日去重 · 标注最高、最低与平均值',dailyUserDistribution(d))}</div><div class="grid">${panel('餐厅订单分布','按当前窗口每家餐厅累计订单数分组',bars([['仅 1 单',one,'家'],['仅 2 单',two,'家'],['3 单及以上',rs.length-one-two,'家']])+`<p>1–2 单餐厅占 ${pct(one+two,rs.length)}（${one+two}/${rs.length} 家），贡献 ${one+two*2}/${n} 单。</p>`,'restaurant')}${panel('餐厅交易覆盖','有单餐厅 ≠ 在线营业供给',`<div class="value">${fmt(d.reduce((s,x)=>s+x.restaurants.size,0)/m.days,2)} <small style="font-size:14px">家 / 日</small></div><p>日均有单餐厅数 = 每日有单餐厅数之和 ÷ ${m.days} 天</p>${chart(d.map(x=>x.restaurants.size),labels)}<p class="note">每日订单量 = 日有单餐厅数 × 店均日订单量；无单日期的店均值不可计算。</p><details><summary>查看每日餐厅承接数据</summary><table><tr><th>日期</th><th>订单量</th><th>有单餐厅</th><th>店均订单</th></tr>${d.map(x=>`<tr><td>${x.day}</td><td>${x.count}</td><td>${x.restaurants.size}</td><td>${x.restaurants.size?fmt(x.count/x.restaurants.size,3):'—'}</td></tr>`).join('')}</table></details>`)}</div><div class="grid">${panel('用户购买画像','复购 = 当前窗口内至少 2 单；有售后 = 至少一单退款/拒付金额 > 0',bars(['单次 · 无售后','单次 · 有售后','复购 · 无售后','复购 · 有售后'].map((x,i)=>[x,m.segments[i],'人']))+`<p>复购用户率 <strong>${pct(m.repeat,m.users)}</strong> = ${m.repeat} / ${m.users} 名下单用户</p>`,'user')}${panel('退款 / 拒付监控','合并字段无法区分退款与拒付，也不能确认部分退款或多次退款',`<div class="value">${pct(m.refundCount,n)}</div><p>涉及订单率 = ${m.refundCount} / ${n} 单</p><div class="value">${pct(m.refund,m.amount)}</div><p>金额占比 = ${fmt(m.refund,2)} / ${fmt(m.amount,2)}</p><p class="note">分母为订单原金额；涉及订单指合并金额 > 0 的唯一订单。</p>`)}</div>${panel('贡献利润情景分析','这是假设下的贡献利润，不是实际净利润。费用归属及退款是否冲回佣金未确认。',`<div class="assumptions"><label><input type="checkbox" id="costDiscount" checked> 优惠由平台承担</label><label><input type="checkbox" id="costDelivery" checked> 配送费作为平台成本</label><label><input type="checkbox" id="costRefund" checked> 退款/拒付额另行扣除</label></div><div id="profit"></div><p class="note">佣金 − 所选优惠成本 − 所选配送成本 − 支付手续费 − 所选退款/拒付。调整选项仅表示费用归属情景。</p><p>优惠 ${fmt(m.discount,2)} · 配送费 ${fmt(m.delivery,2)} · 手续费 ${fmt(m.payment,2)} · 退款/拒付 ${fmt(m.refund,2)}</p>`)}<br>${panel('数据质量与计算口径',`文件总计 ${dataset.total} 行 · 进入可分析数据 ${dataset.orders.length} 行 · 当前窗口 ${n} 行`,`${qualitySummary(dataset)}${bad?`<div class="alert">有 ${bad} 条阻断问题。相关行暂停统计，以下结果仅覆盖可分析数据，可能不代表完整业务。请修正原文件后重新上传。</div>`:'<div class="alert good">未发现阻断计算的问题。</div>'}<p>缺失字段会阻止导入；重复 ID 的所有记录暂停统计；非数值、负数、无效日期与未知优惠均列明。超过订单金额的费用保留并警示。</p><details><summary>展开问题行详情（${new Set(dataset.issues.map(x=>x.line)).size} 行）</summary><table><tr><th>CSV 行号</th><th>处理</th><th>问题</th></tr>${dataset.issues.map(x=>`<tr><td>${x.line}</td><td>${x.blocking?'暂停统计':'保留并提示'}</td><td>${esc(x.reason)}</td></tr>`).join('')}</table></details><details><summary>字段与优惠解析规则</summary><p>使用原始 CSV 英文字段。日期格式 YYYY-MM-DD HH:mm:ss，保留原始本地时刻，不做时区换算。No Offer / None / No Discount / 无优惠 / 0 视为零优惠；百分比按订单金额计算；50 off Promo 等固定金额按明示金额计算。空优惠不自动填零。其他可选列暂不影响经营指标。</p></details>`,'quality')}`;
setupLayout();
setupMonthly();
$('hourMode').onchange=e=>{$('hours').innerHTML=hourDistribution(m,e.target.value==='average');};const profit=()=>{const v=m.commission-m.payment-($('costDiscount').checked?m.discount:0)-($('costDelivery').checked?m.delivery:0)-($('costRefund').checked?m.refund:0);$('profit').innerHTML=`<div class="value">${fmt(v,2)}</div><p>情景贡献利润 · 单均 ${n?fmt(v/n,2):'—'}</p>`;};['costDiscount','costDelivery','costRefund'].forEach(id=>$(id).onchange=profit);profit();$('state').textContent=`${filename} · ${dataset.total} 行 · 当前 ${$('start').value} — ${$('end').value} · 重新上传即可刷新分析（本地处理）`; }catch(e){$('state').textContent=e.message;}}
function load(text,name){try{const parsed=FoodEngine.parse(text);if(!parsed.orders.length)throw Error('无可分析记录。'+parsed.issues.slice(0,5).map(x=>`第 ${x.line} 行：${x.reason}`).join('；'));dataset=parsed;filename=name;const dates=dataset.orders.map(x=>x.day).sort();$('month').min=dates[0].slice(0,7);$('month').max=dates.at(-1).slice(0,7);$('month').value=dates.at(-1).slice(0,7);updateMonthly();if($('csvGuide'))$('csvGuide').open=false;}catch(e){$('state').textContent='导入失败：'+e.message+'。保留上一份已成功导入的数据。';}}
$('upload').onchange=async e=>{const file=e.target.files[0];if(file)load(await file.text(),file.name);e.target.value='';};$('apply').onclick=render;$('sample').onclick=async()=>{try{const r=await fetch('data/demo.csv');if(!r.ok)throw Error('样本读取失败');load(await r.text(),'合成演示数据 · demo.csv');}catch(e){$('state').textContent='请使用“上传订单 CSV”选择本地文件。';}};

function qualitySummary(data){
  const types=new Map();
  for(const issue of data.issues){
    const reason=issue.reason;
    const type=reason.includes('超过订单')?'费用或退款超过订单金额':reason.includes('重复')?'订单 ID 重复':reason.includes('日期')?'日期格式或日期值异常':reason.includes('优惠无法识别')?'优惠为空或无法识别':reason.includes('列数')?'CSV 列数不一致':reason.includes('非数值')?'金额缺失、格式错误或负数':reason.includes('为空')?'必需字段为空':'其他数据问题';
    if(!types.has(type))types.set(type,new Set());
    types.get(type).add(issue.line);
  }
  return `<div class="quality-overview"><strong>${new Set(data.issues.map(x=>x.line)).size}</strong><span>行数据需要核查</span></div><div class="issue-types">${[...types].map(([type,lines])=>`<span>${esc(type)} <b>${lines.size} 行</b></span>`).join('')||'<span>未发现数据问题</span>'}</div><p class="note">按整个导入文件检查；同一行有多类问题时会分别计入类型，问题总行数按行去重。</p>`;
}
function setupLayout(){
  const content=$('content'),cards=content.querySelector('.cards');
  const north=cards.firstElementChild;
  north.classList.add('north-star');
  north.querySelector('.label').textContent='本月已观察订单金额 · 规模北极星';
  cards.before(north);
  const nav=content.querySelector('nav');
  const definitions=[['overview','经营趋势'],['demand','下单需求'],['restaurant','餐厅交易覆盖'],['user','用户与售后'],['quality','数据质量']];
  nav.setAttribute('role','tablist');nav.setAttribute('aria-label','经营分析板块');
  nav.innerHTML=definitions.map(([key,name])=>`<button type="button" role="tab" id="tab-${key}" aria-controls="view-${key}" data-view="${key}">${name}</button>`).join('');
  const grids=[...content.querySelectorAll(':scope > .grid')];
  grids[1].classList.add('demand-grid');
  const views=new Map();
  definitions.forEach(([key],i)=>{
    const view=document.createElement('div');
    view.id='view-'+key;view.className='analysis-view';view.setAttribute('role','tabpanel');view.setAttribute('aria-labelledby','tab-'+key);
    if(i<4)view.append(grids[i]);else view.append($('quality'));
    content.append(view);views.set(key,view);
  });
  const profit=$('costDiscount').closest('.panel');
  views.get('overview').append(profit);
  content.querySelectorAll(':scope > br').forEach(el=>el.remove());
  const tabs=[...nav.querySelectorAll('[role="tab"]')];
  const activate=key=>{
    activeView=key;
    views.forEach((view,k)=>view.hidden=k!==key);
    tabs.forEach(tab=>{const selected=tab.dataset.view===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  };
  tabs.forEach((tab,index)=>{
    tab.onmouseenter=()=>activate(tab.dataset.view);
    tab.onclick=()=>activate(tab.dataset.view);
    tab.onfocus=()=>activate(tab.dataset.view);
    tab.onkeydown=event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();tabs[next].focus();
    };
  });
  activate(views.has(activeView)?activeView:'overview');
}
