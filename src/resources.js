export class Resources {
  constructor(fetcher=fetch) {this.fetcher=(...args)=>fetcher(...args);this.entries=new Map()}
  state(url) {return this.entries.get(url)?.status || 'idle'}
  load(url, {format='json',signal,force=false}={}) {
    const old=this.entries.get(url)
    if(!force && old?.status==='ready')return Promise.resolve(old.data)
    if(!force && old?.status==='loading' && !old.signal?.aborted)return old.promise
    const entry={status:'loading',signal};this.entries.set(url,entry)
    entry.promise=this.fetcher(url,{signal}).then(r=>{if(!r.ok)throw new Error(`加载失败（${r.status}）`);return r[format]()}).then(data=>{
      if(this.entries.get(url)===entry){entry.data=data;entry.status='ready';entry.promise=null} return data
    }).catch(err=>{if(this.entries.get(url)===entry){entry.status=err.name==='AbortError'?'idle':'error';entry.promise=null;entry.error=err}throw err})
    return entry.promise
  }
}
export class Navigation {
  constructor(){this.number=0;this.controller=null}
  next(){this.controller?.abort();this.controller=new AbortController();const number=++this.number;return {signal:this.controller.signal,current:()=>number===this.number}}
}
