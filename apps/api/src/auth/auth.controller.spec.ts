import { shouldUseSecureAuthCookie } from './auth.controller';

describe('shouldUseSecureAuthCookie', () => {
  it('uses secure cookies for AWS runtime by default', () => {
    expect(shouldUseSecureAuthCookie({ APP_ENV: 'aws' })).toBe(true);
  });

  it('allows HTTP EC2 deployments to opt out explicitly', () => {
    expect(
      shouldUseSecureAuthCookie({
        APP_ENV: 'aws',
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toBe(false);
  });

  it('keeps local development cookies non-secure by default', () => {
    expect(shouldUseSecureAuthCookie({ APP_ENV: 'local' })).toBe(false);
  });
});
