// Tiny static server with SPA fallback: node tools/serve.js <dir> <port>
const http=require("http"),fs=require("fs"),path=require("path");
const root=path.resolve(process.argv[2]||"src"),port=+process.argv[3]||8080;
const T={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon",".xml":"application/xml",".txt":"text/plain",".svg":"image/svg+xml",".json":"application/json"};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split("?")[0]);let f=path.join(root,p);
 if(!f.startsWith(root)){r.writeHead(403);return r.end()}
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,"index.html");
 if(!fs.existsSync(f)){const nf=path.join(root,"404.html");f=fs.existsSync(nf)&&process.argv[4]==="static"?nf:path.join(root,"index.html")}
 r.writeHead(200,{"content-type":T[path.extname(f)]||"application/octet-stream"});fs.createReadStream(f).pipe(r)}).listen(port,()=>console.log("serving",root,port));
