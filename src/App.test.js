import { normalizeProducts, clampQuantity } from './storeSafety';
test('malformed catalogue data cannot break product rendering',()=>{
 expect(normalizeProducts(null)).toEqual([]);
 expect(normalizeProducts([null,{id:1,name:null},{id:2,name:' Camera ',stock:'3',price:'bad',description:{},images:['javascript:alert(1)','https://example.com/camera.jpg']}])).toEqual([{id:2,name:'Camera',stock:3,price:0,mrp:0,category:'Misc',description:'',images:['https://example.com/camera.jpg']}]);
});
test('cart quantities stay finite, whole and within stock',()=>{
 expect(clampQuantity(9,3)).toBe(3);expect(clampQuantity('2.9',5)).toBe(2);expect(clampQuantity(-1,5)).toBe(0);expect(clampQuantity('bad',5)).toBe(0);expect(clampQuantity(Infinity,5)).toBe(0);
});
