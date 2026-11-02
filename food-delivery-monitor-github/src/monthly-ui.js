function monthlyLabel(month){return Number(month.slice(0,4))+' 年 '+Number(month.slice(5))+' 月';}
function monthlyRate(n){return n===null?'暂不可比':(n>0?'+':'')+fmt(n*100,2)+'%';}
function monthlyStatus(report){return {up:'订单金额上升',down:'订单金额下降',stable:'订单金额平稳',baseline:'建立月度基线',insufficient:'数据不足，继续观察',quality:'数据待补齐'}[report.status];}
function monthRangeLabel(m){return m.daily[0].day+' — '+m.daily.at(-1).day;}
function monthlyCopy(r){
  const c=r.current||r.observed,b=r.base;
  const observedWarning=r.window.full?'按文件范围推定覆盖全月':'本月仅覆盖 '+r.window.start+' 至 '+r.window.end;
  if(['quality','insufficient','baseline'].includes(r.status))return {title:monthlyStatus(r),intro:r.reason,signals:[`已观察到 ${r.observed.n} 单，订单金额 ${fmt(r.observed.amount,2)}。`,observedWarning+'；先保留这一期作为后续比较依据。'],action:r.status==='quality'?'先打开“数据质量”，修正缺失、重复或格式异常的订单后重新上传。':'优先补齐连续月份的完整订单，再观察下单人数、购买频次和客单价的变化。'};
  const positives=r.drivers.filter(x=>x.contribution>1e-7),negatives=r.drivers.filter(x=>x.contribution< -1e-7);
  const signal=d=>`${d.name}${d.after>=d.before?'增加':'减少'} ${monthlyRate(d.change).replace(/^[+-]/,'')}，是金额${d.contribution>0?'增长':'下降'}的${r.drivers[0]===d?'首要':'另一'}线索。`;
  let title,intro,signals,action;
  if(r.status==='up'){
    title='订单金额上升，'+(positives[0]?.name||'交易规模')+'表现较好';
    intro='先保持表现较好的部分，再确认增长是否伴随更高的优惠或售后压力。';
    signals=positives.slice(0,2).map(signal);
    action=positives[0]?.name==='下单人数'?'先找出下单人数增长集中的餐厅与时段，核查是否可持续；在小范围验证有效做法后再考虑扩大。':positives[0]?.name==='人均下单频次'?'先复盘重复购买增加的用户与餐厅组合，跟踪下一月是否持续，验证服务或活动是否带来增量。':'先核查高客单价订单和餐厅的结构变化，跟踪订单量、优惠与售后，确认增长能否持续。';
  }else if(r.status==='down'){
    title='订单金额下降，优先排查'+(negatives[0]?.name||'交易变化');
    intro='先定位下降发生在哪里，再做小范围调整，避免直接大幅改价或调整投放。';
    signals=negatives.slice(0,2).map(signal);
    action=negatives[0]?.name==='下单人数'?'先按餐厅和时段定位下单人数下降的位置，再核查营业、履约与用户反馈；对目标用户做小范围召回试验，观察增量订单与售后。':negatives[0]?.name==='人均下单频次'?'先检查重复购买减少的用户与餐厅组合，核查履约和售后记录；小范围尝试服务修复或复购方案，再看下一月是否改善。':'先拆分餐厅和优惠分组，核查低客单价订单占比是否增加；小范围测试套餐组合，同时观察订单量与售后。';
  }else{
    const opposing=positives.length&&negatives.length;
    title=opposing?'订单金额平稳，留意指标之间的抵消':'订单金额平稳，继续观察购买与售后';
    intro='金额变化处于所设平稳区间，先保持节奏，重点观察下面的信号。';
    signals=opposing?[signal(positives[0]),signal(negatives[0])]:['继续观察下单人数与人均频次，区分用户规模变化和重复购买变化。','继续观察餐厅交易覆盖与低单量餐厅占比，判断订单是否更集中。'];
    action=opposing?'先跟踪一升一降的指标能否持续，按餐厅和用户分组核查原因，再决定是否做小范围调整。':'保持当前节奏，补齐后续月份；在同口径下观察用户数、频次、餐厅交易覆盖与售后变化。';
  }
  const refundChange=c.refundCount/c.n-b.refundCount/b.n;
  const discountChange=c.amount&&b.amount?c.discount/c.amount-b.discount/b.amount:0;
  if(refundChange>=.02-1e-10){signals.push(`退款/拒付涉及订单率上升 ${fmt(refundChange*100,2)} 个百分点，需优先关注售后。`);action='优先按餐厅和时段排查退款/拒付增长，核对售后原因与履约记录；先修复集中问题，再验证经营调整的效果。';}
  else if(discountChange>=.01-1e-10)signals.push(`优惠金额占比上升 ${fmt(discountChange*100,2)} 个百分点；先核查优惠承担方与活动效果。`);
  if(r.status==='up'&&negatives.length)signals.push(`${negatives[0].name}仍在回落，增长尚不均衡。`);
  if(r.mode==='full'&&c.days!==b.days)intro+=` 两月自然日数不同，日均订单金额变化 ${monthlyRate((c.amount/c.days)/(b.amount/b.days)-1)}，请结合判断。`;
  return {title,intro,signals:signals.slice(0,3),action};
}
function monthlyMarkup(month){
  const threshold=Number($('stability').value)/100;
  const r=MonthlyMonitor.report(dataset,month,threshold);
  if(!r)return '';
  const copy=monthlyCopy(r),c=r.current,b=r.base;
  const reports=MonthlyMonitor.available(dataset.orders).map(m=>MonthlyMonitor.report(dataset,m,threshold));
  const history=reports.map(item=>`<button type="button" class="month-pill ${item.month===month?'selected':''}" data-month="${item.month}" aria-pressed="${item.month===month}"><span>${monthlyLabel(item.month)}</span><small>${monthlyStatus(item)}</small></button>`).join('');
  return `<section class="monthly-summary ${r.status}" aria-labelledby="monthly-heading"><div class="monthly-top"><div><span class="monthly-eyebrow">月度经营小结</span><h2 id="monthly-heading">${monthlyLabel(month)}</h2></div><span class="monthly-state">${monthlyStatus(r)}</span></div><div class="month-conclusion"><div><h3>${copy.title}</h3><p>${copy.intro}</p></div>${r.rate!==null?`<div class="month-change"><strong>${monthlyRate(r.rate)}</strong><span>${r.mode==='matched'?'较上月同日范围':'较上月整月'} · 订单金额</span></div>`:''}</div><div class="month-content"><div><h4>${r.status==='up'?'做得较好的数据表现':r.status==='down'?'优先排查的变化':'有待观察的信号'}</h4><ul>${copy.signals.map(s=>`<li>${s}</li>`).join('')}</ul></div><div class="month-action"><h4>建议先做这一步</h4><p>${copy.action}</p></div></div><p class="month-coverage">${r.window.start} — ${r.window.end} · 已观察订单金额 ${fmt(r.observed.amount,2)}${r.mode==='matched'?' · 非完整月份，使用上月相同日期范围比较':''}</p><details class="month-method"><summary>查看比较口径与判断依据</summary><p>“经营额”在此指订单原金额之和，不等于平台收入或净利润。变化超过 +${fmt(threshold*100)}% 视为上升，低于 −${fmt(threshold*100)}% 视为下降，其余为平稳；这是可调整的经营观察阈值，不是统计显著性判断。可比窗口至少 7 天且两期各至少 20 单。</p><p>观察边界由文件最早、最晚有效订单推定，无法保证上传完整；中间缺单日暂按零单处理。若两期均推定覆盖整月，比较两个月总额（自然日数可能不同）；否则仅比较共同覆盖的月内同日范围，不将剩余日期外推成整月。</p>${c&&b?`<p>本期比较范围：${monthRangeLabel(c)}，${c.days} 天、${c.n} 单、金额 ${fmt(c.amount,2)}；上期：${monthRangeLabel(b)}，${b.days} 天、${b.n} 单、金额 ${fmt(b.amount,2)}。金额变化率 =（本期金额 ÷ 上期金额 − 1）× 100%。</p><div class="guide-table"><table><thead><tr><th>变化指标</th><th>上期</th><th>本期</th><th>变化</th><th>金额变化分解</th></tr></thead><tbody>${r.drivers.map(x=>`<tr><td>${x.name}</td><td>${fmt(x.before,3)}</td><td>${fmt(x.after,3)}</td><td>${monthlyRate(x.change)}</td><td>${x.contribution>0?'+':''}${fmt(x.contribution,2)}</td></tr>`).join('')}</tbody></table></div><p>订单金额 = 下单人数 × 人均下单频次 × 客单价。金额变化分解采用三因素全部六种替换顺序的平均贡献，合计等于金额变化；仅为数学分解，不能证明活动、价格或服务的因果效果。</p>`:''}<p>售后提示阈值为涉及订单率上升至少 2 个百分点；优惠提示阈值为优惠金额占比上升至少 1 个百分点。建议是待验证的排查与试验方向；文件中的费用异常请结合“数据质量”核查。</p></details><div class="month-history" aria-label="选择月份查看小结">${history}</div></section>`;
}
function updateMonthly(){
  if(!dataset)return;
  const months=MonthlyMonitor.available(dataset.orders),month=$('month').value;
  if(!months.includes(month)){$('state').textContent='所选月份不在当前文件的观察范围内，请选择 '+months[0]+' 至 '+months.at(-1)+'。';return;}
  const span=MonthlyMonitor.coverage(dataset.orders),window=MonthlyMonitor.bounds(month,span);
  $('start').value=window.start;$('end').value=window.end;
  render();
}
function setupMonthly(){
  const month=$('month').value;
  const north=$('content').querySelector('.north-star');
  north.insertAdjacentHTML('beforebegin',monthlyMarkup(month));
  $('content').querySelectorAll('[data-month]').forEach(button=>button.onclick=()=>{$('month').value=button.dataset.month;updateMonthly();});
  const months=MonthlyMonitor.available(dataset.orders),index=months.indexOf(month);
  $('prevMonth').disabled=index<=0;$('nextMonth').disabled=index>=months.length-1;
}
$('month').onchange=updateMonthly;
$('stability').onchange=updateMonthly;
$('apply').onclick=updateMonthly;
$('prevMonth').onclick=()=>{const months=MonthlyMonitor.available(dataset?.orders||[]),i=months.indexOf($('month').value);if(i>0){$('month').value=months[i-1];updateMonthly();}};
$('nextMonth').onclick=()=>{const months=MonthlyMonitor.available(dataset?.orders||[]),i=months.indexOf($('month').value);if(i>=0&&i<months.length-1){$('month').value=months[i+1];updateMonthly();}};
