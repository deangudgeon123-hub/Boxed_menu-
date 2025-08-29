const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

let PRODUCTS = [];
let CART = {}; // id -> qty

const $grid = document.getElementById('grid');
const $search = document.getElementById('search');
const $checkout = document.getElementById('checkout');

async function load() {
  const res = await fetch('products.json', {cache: 'no-store'});
  PRODUCTS = await res.json();
  render(PRODUCTS);
}
function money(n){ return `£${(+n).toFixed(2)}`; }

function render(list){
  $grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <div class="cbody">
        <div class="title">${p.title}</div>
        <div class="row">
          <div class="price">${money(p.price)}</div>
          <div class="stock ${p.stock>0?'in':'out'}">
            ${p.stock>0?`In stock (${p.stock})`:'Sold out'}
          </div>
        </div>
        ${p.notes ? `<div class="note">${p.notes}</div>` : ''}
        <div class="qty">
          <button class="btn dec" ${p.stock===0?'disabled':''}>−</button>
          <div class="qval">${CART[p.id]||0}</div>
          <button class="btn inc" ${p.stock===0?'disabled':''}>＋</button>
        </div>
      </div>
    `;
    card.querySelector('.inc')?.addEventListener('click', ()=>{
      const q = CART[p.id]||0;
      if(q < p.stock){ CART[p.id] = q+1; card.querySelector('.qval').textContent=CART[p.id];}
    });
    card.querySelector('.dec')?.addEventListener('click', ()=>{
      const q = CART[p.id]||0;
      if(q>0){ CART[p.id]=q-1; card.querySelector('.qval').textContent=CART[p.id];}
    });
    $grid.appendChild(card);
  });
}

function filterCat(cat){
  if(cat==='ALL') return render(PRODUCTS);
  render(PRODUCTS.filter(p=>p.category===cat));
}
document.querySelectorAll('.pill').forEach(b=>b.addEventListener('click', ()=>filterCat(b.dataset.cat)));

$search.addEventListener('input', ()=>{
  const q = $search.value.toLowerCase();
  render(PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.notes||'').toLowerCase().includes(q)
  ));
});

$checkout.addEventListener('click', ()=>{
  const items = Object.entries(CART)
    .filter(([,q])=>q>0)
    .map(([id,q])=>{
      const p = PRODUCTS.find(x=>x.id===id);
      return { id, title:p.title, qty:q, price:p.price, subtotal:+(q*p.price).toFixed(2) };
    });
  const total = items.reduce((s,i)=>s+i.subtotal,0);
  const payload = { type:'order', items, total };

  if(tg?.sendData){
    tg.sendData(JSON.stringify(payload));
    tg.close();
  } else {
    alert(JSON.stringify(payload, null, 2));
  }
});

load();
