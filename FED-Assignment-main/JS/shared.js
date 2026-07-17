// assets/js/data.js
// All pages read/write via these localStorage keys.
const KEYS = {
  role: 'hc.role',                  // 'guest'|'customer'|'owner'|'operator'
  selectedCenter: 'hc.center',      // string id of centre
  selectedStall: 'hc.stall',        // stall id
  cart: 'hc.cart',                  // [{stallId, itemId, name, price, qty, notes}]
  savedOrders: 'hc.savedOrders',    // [{id, name, items, createdAt}]
  ordersHistory: 'hc.ordersHistory',// [{id, status, total, items, scheduledAt?, createdAt}]
  selectedPromo: 'hc.selectedPromo' // {id} chosen earlier
};

// Centres (click any -> same stalls, per assignment)
const HAWKER_CENTRES = [
  { id:'maxwell', name:'Maxwell Food Centre', address:'1 Kadayanallur St' },
  { id:'adam', name:'Adam Road Food Centre', address:'2 Adam Rd' },
  { id:'oldairport', name:'Old Airport Road Food Centre', address:'51 Old Airport Rd' }
];

// Single shared stall list regardless of centre (the “trick”)
const STALLS = [
  { id:'s1', name:'Tian Tian Chicken Rice', cuisine:'Chinese', hours:'10:00–20:00', rating:4.6 },
  { id:'s2', name:'Heng Carrot Cake', cuisine:'Chinese', hours:'09:00–21:00', rating:4.5 },
  { id:'s3', name:'Zam Zam Prata', cuisine:'Indian-Muslim', hours:'07:00–23:00', rating:4.3 }
];

// Menu by stall
const MENU = {
  s1:[{id:'m1',name:'Chicken Rice',price:5.5},{id:'m2',name:'Chicken Rice (Large)',price:7.0},{id:'m3',name:'Poached Chicken (Quarter)',price:11}],
  s2:[{id:'m4',name:'White Carrot Cake',price:4.5},{id:'m5',name:'Black Carrot Cake',price:4.5},{id:'m6',name:'Mixed Carrot Cake',price:5.0}],
  s3:[{id:'m7',name:'Plain Prata (2 pcs)',price:2.0},{id:'m8',name:'Egg Prata',price:2.2},{id:'m9',name:'Chicken Curry',price:3.0}]
};

// Promotions (some have minSpend, some stall-specific)
const PROMOTIONS = [
  { id:'p1', title:'$2 off orders ≥ $12', type:'order', minSpend:12, amount:2 },
  { id:'p2', title:'10% off Zam Zam (s3) items', type:'stall', stallId:'s3', percent:10 },
  { id:'p3', title:'Buy 2 get $1 off Carrot Cake (s2)', type:'bundle', stallId:'s2', itemId:'m6', thresholdQty:2, amount:1 }
];

// Simulated hygiene history & analytics
const HYGIENE = [
  { stallId:'s1', date:'2025-06-15', grade:'A', remarks:'Clean & Sanitised' },
  { stallId:'s2', date:'2025-06-10', grade:'B', remarks:'Improve grease trap maintenance' },
  { stallId:'s3', date:'2025-07-01', grade:'A', remarks:'Good' }
];

const RENTAL = { // shown only to owner/operator
  stallId:'s1', monthlyRent: 1800, start:'2025-01-01', end:'2026-12-31', terms:'Pay by 5th monthly. Utilities separate.'
};