import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'X-Frame-Options',value:'SAMEORIGIN'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=(), usb=()'},
      {key:'Content-Security-Policy',value:"base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'"},
    ]}]
  },
}

export default nextConfig
