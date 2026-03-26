Pre-deployment checklist for Cloudflare Pages:
1. Run /project:validate
2. Run vite build and confirm zero errors
3. Check bundle size — warn if main chunk exceeds 500kb
4. Verify service worker is registered
5. Verify offline capability
6. Confirm attribution footer (tow.whfb.app) appears on rules reference pages
7. Confirm GW disclaimer appears in footer
