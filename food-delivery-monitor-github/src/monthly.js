(function(root){
  const pad=n=>String(n).padStart(2,'0');
  const last=month=>new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),0)).getUTCDate();
  const previous=month=>{const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);};
  const range=(month,lo,hi)=>({start:month+'-'+pad(lo),end:month+'-'+pad(hi)});
  function coverage(orders){const days=orders.map(o=>o.day).sort();return days.length?{start:days[0],end:days.at(-1)}:null;}
  function bounds(month,span){
    if(!span||month<span.start.slice(0,7)||month>span.end.slice(0,7))return null;
    const lo=month===span.start.slice(0,7)?+span.start.slice(8):1;
    const hi=month===span.end.slice(0,7)?+span.end.slice(8):last(month);
    return {...range(month,lo,hi),lo,hi,full:lo===1&&hi===last(month)};
  }
  function available(orders){const span=coverage(orders);if(!span)return [];const months=[];let m=span.start.slice(0,7);while(m<=span.end.slice(0,7)){months.push(m);const d=new Date(m+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);m=d.toISOString().slice(0,7);}return months;}
  function factors(base,current){
    if(!base.n||!current.n)return [];
    const b=[base.users,base.n/base.users,base.amount/base.n];
    const c=[current.users,current.n/current.users,current.amount/current.n];
    return ['下单人数','人均下单频次','客单价'].map((name,i)=>{
      const [j,k]=[0,1,2].filter(x=>x!==i);
      const contribution=(c[i]-b[i])*(b[j]*b[k]/3+(c[j]*b[k]+b[j]*c[k])/6+c[j]*c[k]/3);
      return {name,before:b[i],after:c[i],change:b[i]?c[i]/b[i]-1:null,contribution};
    }).sort((x,y)=>Math.abs(y.contribution)-Math.abs(x.contribution));
  }
  function report(data,month,threshold=.05){
    const span=coverage(data.orders),window=bounds(month,span);
    if(!window)return null;
    const observed=root.FoodEngine.metrics(data.orders,window.start,window.end);
    const prior=previous(month),priorWindow=bounds(prior,span);
    const result={month,prior,window,observed,threshold,status:'baseline',reason:'缺少上月可比数据，本月先建立基线。',mode:null,current:null,base:null,drivers:[],rate:null};
    if(priorWindow){
      let a,b;
      if(window.full&&priorWindow.full){a=window;b=priorWindow;result.mode='full';}
      else{
        const lo=Math.max(window.lo,priorWindow.lo),hi=Math.min(window.hi,priorWindow.hi);
        if(lo<=hi){a=range(month,lo,hi);b=range(prior,lo,hi);result.mode='matched';}
      }
      if(a&&b){
        result.current=root.FoodEngine.metrics(data.orders,a.start,a.end);
        result.base=root.FoodEngine.metrics(data.orders,b.start,b.end);
        const c=result.current,p=result.base;
        result.drivers=factors(p,c);
        if(c.days<7||p.days<7||c.n<20||p.n<20){result.status='insufficient';result.reason='可比窗口不足 7 天，或任一窗口少于 20 单，暂不判断涨跌。';}
        else if(p.amount===0){result.status='insufficient';result.reason='上月可比订单金额为零，无法计算金额变化率。';}
        else{
          result.rate=c.amount/p.amount-1;
          result.status=result.rate>threshold+1e-10?'up':result.rate< -threshold-1e-10?'down':'stable';
          result.reason='';
        }
      }else{result.status='insufficient';result.reason='两个月没有可比较的同日范围，暂不判断涨跌。';}
    }
    const blocking=data.issues.filter(i=>i.blocking);
    if(blocking.length){result.status='quality';result.rate=null;result.reason='导入文件有阻断问题，部分订单未纳入统计；请先补齐数据，再判断月度变化。';}
    return result;
  }
  root.MonthlyMonitor={available,report,bounds,coverage,previous,factors};
  if(typeof module!=='undefined')module.exports=root.MonthlyMonitor;
})(globalThis);
