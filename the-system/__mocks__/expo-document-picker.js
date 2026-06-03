module.exports = {
  __esModule: true,
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
};
