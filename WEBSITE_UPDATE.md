# Existing storefront refresh

This change updates the existing React storefront in place. Root URL opens the product catalogue, using the existing Supabase products table. The existing admin login remains at `#/admin-9980`, including its Supabase authentication, admin profile role check, product editing and storage upload flows. A footer link makes the admin login discoverable.

Keep the existing hosting provider, domain, REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY. No database migration or new hosting configuration is needed. Build with `npm ci` then `npm run build` and publish the `build` directory through the current deployment process. Preserve the existing custom-domain CNAME when publishing to GitHub Pages.

The redesign adds a clean responsive storefront theme, a concise services introduction, accessible product search/category names, keyboard product access and catalogue error/retry states. Safety fixes normalize malformed product data and bound quantities by displayed stock. Invoices retain the existing client-generated behavior; they do not confirm payment or reserve inventory in the database.

Admin login handles connection failures and prevents duplicate submits. Database roles, policies, credentials and product upload logic remain unchanged. Real login/upload and database authorization require verification with the store owner's account. The managed browser preview was unavailable in this workspace.
