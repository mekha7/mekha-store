# Website update

The services homepage is the default entry point. Product store is at `#/shop`; the existing admin route remains `#/admin-9980`.

The homepage uses no remote fonts, images or database requests. Its enquiry form opens a WhatsApp draft; the visitor must send that draft in WhatsApp. It does not claim to save or submit an enquiry.

The store retains the existing Supabase integration. Configure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY at build time. The anonymous key is a browser credential; database access must be enforced by Supabase row-level security. No database policies were changed or verified in this update. The existing invoice flow remains a client-generated document; it does not confirm payment or reserve database inventory.

Validation: npm ci, CI=true npm test -- --watchAll=false --runInBand (four tests), npm run build. Browser layout QA was unavailable because the managed preview relay was not running. Test mobile/desktop layout, real catalogue access and admin permissions before replacing the public domain.

Deploy the `build` directory to the existing static host. The GitHub branch and PR preserve the existing main branch and domain. The separately published review Site is private and does not change mekshacctv.in.
