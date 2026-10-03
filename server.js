const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-now';
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const sessions = new Map();
fs.mkdirSync(DATA_DIR, { recursive: true });

const initialProducts = [
 {id:1,name:'HP ProBook Business Laptop i5 / 8GB / 256GB SSD',cat:'Laptops',price:95000,old:115000,stock:5,img:'assets/hp-1.jpeg',active:true,deal:true},
 {id:2,name:'HP ProBook Silver Laptop i5 / 8GB / 256GB SSD',cat:'Laptops',price:85000,old:100000,stock:6,img:'assets/hp-3.jpeg',active:true,deal:true},
 {id:3,name:'HP Business Laptop — Silver',cat:'Laptops',price:88000,old:105000,stock:4,img:'assets/laptop-white.jpeg',active:true,deal:false},
 {id:4,name:'HP ProBook Laptop — New Arrival',cat:'Laptops',price:92000,old:110000,stock:3,img:'assets/hp-2.jpeg',active:true,deal:false},
 {id:5,name:'Samsung Galaxy Smartphone 256GB',cat:'Phones',price:265000,old:295000,stock:4,img:'assets/samsung.jpeg',active:true,deal:true},
 {id:6,name:'Smartphone — Various Colors 128GB / 256GB',cat:'Phones',price:85000,old:100000,stock:10,img:'assets/android.jpeg',active:true,deal:false},
 {id:7,name:'Premium Wireless Headphones',cat:'Headphones',price:85000,old:100000,stock:8,img:'assets/headphones.jpeg',active:true,deal:true},
 {id:8,name:'Smartphone Collection',cat:'Phones',price:120000,old:140000,stock:7,img:'assets/iphone.jpeg',active:true,deal:false}
];
function read(file, fallback){ try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch { fs.writeFileSync(file, JSON.stringify(fallback,null,2)); return fallback; } }
function write(file, data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }
let products = read(PRODUCTS_FILE, initialProducts);
let orders = read(ORDERS_FILE, []);
function send(res,status,data,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(data):data)}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6)req.destroy()});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}})})}
function token(req){return (req.headers.authorization||'').replace(/^Bearer\s+/,'')}
function authed(req){const t=token(req);return t && sessions.has(t)}
function id(){return crypto.randomUUID()}
function publicProducts(){return products.filter(p=>p.active!==false)}
function api(req,res,u){
 if(req.method==='GET'&&u.pathname==='/api/products') return send(res,200,publicProducts());
 if(req.method==='POST'&&u.pathname==='/api/login') return body(req).then(b=>{if(b.username===ADMIN_USER&&b.password===ADMIN_PASSWORD){const t=crypto.randomBytes(32).toString('hex');sessions.set(t,Date.now());return send(res,200,{token:t})}send(res,401,{error:'Invalid login'})});
 if(!authed(req)) return send(res,401,{error:'Admin login required'});
 if(req.method==='GET'&&u.pathname==='/api/admin/products') return send(res,200,products);
 if(req.method==='GET'&&u.pathname==='/api/admin/orders') return send(res,200,orders);
 if(req.method==='POST'&&u.pathname==='/api/admin/products') return body(req).then(b=>{const p={id:Math.max(0,...products.map(x=>x.id))+1,name:String(b.name||'Untitled'),cat:b.cat||'Accessories',price:Number(b.price||0),old:Number(b.old||0),stock:Number(b.stock||0),img:b.img||'assets/logo.jpeg',active:b.active!==false,deal:Boolean(b.deal)};products.push(p);write(PRODUCTS_FILE,products);send(res,201,p)});
 const m=u.pathname.match(/^\/api\/admin\/products\/(\d+)$/);
 if(m && req.method==='PUT') return body(req).then(b=>{const p=products.find(x=>x.id===Number(m[1]));if(!p)return send(res,404,{error:'Product not found'});Object.assign(p,{...b,price:b.price===undefined?p.price:Number(b.price),old:b.old===undefined?p.old:Number(b.old),stock:b.stock===undefined?p.stock:Number(b.stock)});write(PRODUCTS_FILE,products);send(res,200,p)});
 if(m && req.method==='DELETE'){products=products.filter(x=>x.id!==Number(m[1]));write(PRODUCTS_FILE,products);return send(res,204,{})}
 if(req.method==='POST'&&u.pathname==='/api/orders') return body(req).then(b=>{if(!b.customer||!b.items?.length)return send(res,400,{error:'Customer and items are required'});const order={id:'MT-'+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),status:'New',payment:b.payment||'Cash on Delivery',customer:b.customer,items:b.items,total:Number(b.total||0)};orders.unshift(order);write(ORDERS_FILE,orders);send(res,201,{order})});
 if(req.method==='PUT'&&u.pathname.startsWith('/api/admin/orders/')) return body(req).then(b=>{const oid=u.pathname.split('/').pop();const o=orders.find(x=>x.id===oid);if(!o)return send(res,404,{error:'Order not found'});o.status=b.status||o.status;write(ORDERS_FILE,orders);send(res,200,o)});
 if(requestPath==='/css/style.css')requestPath='/style.css';else if(requestPath==='/js/app.js')requestPath='/app.js';let p=path.join(__dirname,requestPath);if(!p.startsWith(__dirname))return send(res,403,'Forbidden','text/plain');fs.readFile(p,(err,data)=>{if(err)return send(res,404,'Not found','text/plain');const ext=path.extname(p);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};send(res,200,data,types[ext]||'application/octet-stream')});});
   rr)return  in s,404,'Not found','text/plain');const ext=path.extname(p);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};send(res,200,data,types[ext]||'application/octet-stream')});});
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,`http://${req.headers.host}`);if(u.pathname.startsWith('/api/')){try{return await api(req,res,u)}catch(e){return send(res,400,{error:e.message})}}
 let p=path.jname,u.pathname==='/'?'index.html':u.pathname);if(!p.startsWith(__dirname))return send(res,403,'Forbidden','text/plain');fs.readFile(p,(err,data)=>{if(err)return send(res,404,'Not found','text/plain');const ext=path.extname(p);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};send(res,200,data,types[ext]||'application/octet-stream')});});
server.listen(PORT,HOST,()=>console.log(`Meridian Trading running at http://localhost:${PORT}`));
