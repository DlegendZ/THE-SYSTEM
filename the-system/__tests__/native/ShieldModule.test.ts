import ShieldModule from '../../src/native/ShieldModule';

describe('ShieldModule (JS bridge)', () => {
  it('lockNow rejects with error in test env', async () => {
    await expect(ShieldModule.lockNow()).rejects.toThrow();
  });

  it('isAdminActive returns false in test env', async () => {
    const result = await ShieldModule.isAdminActive();
    expect(result).toBe(false);
  });
});
