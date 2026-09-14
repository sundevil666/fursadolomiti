# Alpenroyal: API versus browser, 2026-09-13

- Official bundle inspected: https://widget.bookingsuedtirol.com/v2/bundle.js
- Widget configuration request: GET https://api.widgets.bookingsuedtirol.com/v6/widgets?id=23b144fc-3c5e-45cb-b8d3-50137461646a
- Official code uses mode=cors and Accept=application/json. If widget id is supplied, this request sends only id; propertyId, source and promotion do not participate in this failing request.
- Direct Python GET: 200 JSON, Access-Control-Allow-Origin: *, both with Vercel and www production Origin/Referer. Adding Accept=application/json and Sec-Fetch-* headers also returned 200.
- Chrome on https://fursadolomiti.vercel.app/hotels: Alpenroyal dialog shows Oh no / unexpected error; official widget logs TypeError: Failed to fetch.
- Direct navigation to the same API URL in Chrome, without the host page or widget: visible 403 Forbidden.
- Separate in-app browser navigation could not complete: ERR_BLOCKED_BY_CLIENT. This is inconclusive and is not evidence of a provider HTTP response.

Conclusion: the problem is reproducible without the website integration. No evidence currently justifies changing the Vue configuration or .htaccess. The exact rejection layer is not established (provider edge/security rules versus browser/network-specific conditions). Provider support should investigate the browser's 403 and compare it with successful direct requests; do not claim that a specific WAF rule or domain restriction has been proven.

Suggested support request:
Alpenroyal widget id 23b144fc-3c5e-45cb-b8d3-50137461646a, propertyId 9772 fails in Chrome on https://fursadolomiti.vercel.app/hotels. The /v6/widgets?id=... request fails with CORS/Failed to fetch. Opening that exact API URL directly in Chrome also shows 403 Forbidden, with no website or widget code involved. Direct Python GET requests with the same Vercel Origin/Referer and Accept: application/json return 200 with Access-Control-Allow-Origin: *. Please investigate the API/edge access logs and explain which condition rejects browser requests. Checks performed around 08:37 UTC on 2026-09-13.
