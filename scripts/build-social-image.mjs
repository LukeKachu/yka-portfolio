import sharp from 'sharp'
import {fileURLToPath} from 'node:url'

// Static, code-generated brand asset: no remote fonts, CV, metrics or private data.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#101510"/>
<path d="M64 112H1136M64 530H1136" stroke="#343e31"/>
<g font-family="Arial,Helvetica,sans-serif">
<text x="64" y="77" font-size="30" font-weight="900" fill="#eeefe7">YKA<tspan fill="#ef8559">.</tspan></text>
<text x="1136" y="75" text-anchor="end" font-size="17" fill="#a2ac9c">yusufkerimaltay.com</text>
<text x="59" y="281" font-size="98" letter-spacing="-5" font-weight="700" fill="#eeefe7">Yusuf Kerim</text>
<text x="59" y="384" font-size="98" letter-spacing="-5" font-weight="700" fill="#eeefe7">Altay<tspan fill="#ef8559">.</tspan></text>
<text x="66" y="465" font-size="26" fill="#b7f34a">SOCIAL MEDIA / CONTENT / DIGITAL</text>
<text x="64" y="580" font-size="18" fill="#a2ac9c">PORTFOLIO</text>
<path d="M1075 580l45-45m-45 0h45v45" fill="none" stroke="#b7f34a" stroke-width="3"/>
</g></svg>`
await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL('../public/yka-social.png',import.meta.url)))
console.log('Built public/yka-social.png (1200 × 630)')
