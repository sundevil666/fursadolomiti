# Chalet Zenit widget audit — 30 September 2026

Source: https://developers.bookingsuedtirol.com/docs/widgets/booking/?id=46f72afb-7807-4d15-af6f-50bfe01de476&propertyId=13459

## Configuration

- Official external `https://widget.bookingsuedtirol.com/v2/bundle.js`, deferred and initialized after load: correct.
- Widget ID `46f72afb-7807-4d15-af6f-50bfe01de476`, property ID `13459`: match the supplied documentation URL.
- DOM element argument: supported.
- English fallback for Russian: supported; Russian is not a widget language.
- `promotion`: documented optional attribution tuple. It does not supply availability or a guest discount.
- `source`: documented portal option requiring provider support. Existing value retained; its provider-side authorization cannot be verified from repository code.
- Success/error callbacks: optional, not prerequisites for loading offers.

## Reproduced availability result

Chrome, 2 adults, 16–23 January 2027:

1. Published FursaDolomiti Chalet Zenit modal loads the calendar and accepts the stay.
2. The Room step says no offers are available and suggests an enquiry.
3. A standalone widget with the same IDs, official script and required settings, but without `source` or `promotion`, returns the same result.

This rules out the FursaDolomiti modal and optional attribution overrides as the cause for this tested stay. It does not establish whether the accommodation is full, rates are unpublished, or stay/occupancy restrictions apply. Those require the property's availability configuration. No booking or enquiry was submitted.

## Corrections

- Keep the returned widget instance and call `unmount()` before the container is removed or replaced, and when the Vue component unmounts.
- Invalidate pending initialization when closing/switching hotels; discard stale completions and errors.
- Remove failed script elements and reset the rejected loading promise so reopening retries.
- Set the documented `BookingSüdtirolTrackingConsent = false` before script loading to disable the optional 30-day promotion cookie; retain the configured promotion tuple.

## Remaining documentation discrepancies

- `termsURL` still points at `/privacy-policy`. The project has no separate terms page. A real terms document/approved URL is needed; the privacy policy is not a substitute.
- The privacy page is English-only, while the widget can be Italian. Documentation requires the legal pages' language to match the widget. An Italian version remains necessary.

These document-content issues do not explain the reproduced no-offers response. No legal terms were invented as part of this widget repair.

## Validation

- `node --test scripts/test-booking-suedtirol.mjs`: five regression tests.
- Before the repair, lifecycle disposal, concurrent mounts and retry tests fail; after repair all pass.
- Production build with Node 22 and `vue-tsc` passes.
- Focused ESLint: no errors; two existing `vue/no-template-shadow` warnings.
- Chrome: real provider calendar loads, closes and reopens using the corrected integration.
