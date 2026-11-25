import {build} from 'vite'
import {readFile, writeFile} from 'node:fs/promises'
import {posts} from '../src/catalog.ts'
import {applySecurityMeta, portablePolicy} from './csp.mjs'

const dataURL = async (path,type) => 'data:'+type+';base64,'+(await readFile(path)).toString('base64')
const covers = Object.fromEntries(await Promise.all(posts.map(async post =>
  [post.id,await dataURL('public/photos/'+post.id+'.webp','image/webp')])))
const logo = await dataURL('public/lens.svg','image/svg+xml')
const notices = await Promise.all(['dm-sans', 'stix-two', 'zip-js'].map(name =>
  readFile('public/licenses/'+name+'.txt','utf8')))
const {output} = await build({publicDir:false,define:{__INLINE_COVERS__:JSON.stringify(covers)},
  build:{assetsInlineLimit:()=>true,write:false,cssCodeSplit:false,modulePreload:false}})
const script = output.find(item=>item.type==='chunk' && item.isEntry).code
const css = output.find(item=>item.type==='asset' && item.fileName.endsWith('.css')).source
const noticeBlock = notices.join('\\n\\n')
// Opened from file:// there is no origin to trust, so the inline blocks are authorised by hash.
const inline = script.replaceAll('</script','<\\/script')
const portableHtml = applySecurityMeta(await readFile('index.html','utf8'), portablePolicy([inline, noticeBlock]))
const html = portableHtml.replace('href="/lens.svg"','href="'+logo+'"')
  .replace('</head>',()=>'<style>'+css+'</style><script type="text/plain" id="license-notices">'+noticeBlock+'</script></head>')
  .replace('<script type="module" src="/src/main.tsx"></script>',()=>'<script type="module">'+inline+'</script>')
await writeFile('../FeedLens.html',html)
