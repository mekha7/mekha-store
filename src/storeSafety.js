export function normalizeProducts(data) {
 if (!Array.isArray(data)) return [];
 const amount = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
 return data.filter(p => p && p.id != null && typeof p.name === 'string' && p.name.trim()).map(p => ({...p, name:p.name.trim(), category:typeof p.category==='string'?p.category:'Misc', description:typeof p.description==='string'?p.description:'', price:amount(p.price), mrp:amount(p.mrp), stock:Math.floor(amount(p.stock)), images:Array.isArray(p.images)?p.images.filter(u=>typeof u==='string' && /^https?:\/\//i.test(u)):[]}));
}
export function clampQuantity(value, stock) {
 const n=Number(value); const available=Number(stock);
 return Number.isFinite(n) && Number.isFinite(available) ? Math.max(0,Math.min(Math.floor(n),Math.floor(available))) : 0;
}
