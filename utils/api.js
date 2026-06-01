const config = require("./config");

function requestMatch(name) {
  const url = `${config.baseURL}/api/match`;
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      data: { name },
      timeout: config.timeout,
      success: (res) => {
        console.log("[asset-api] success", {
          url,
          statusCode: res.statusCode,
          data: res.data
        });
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail: (err) => {
        console.error("[asset-api] fail", { url, err });
        reject(err);
      }
    });
  });
}

function requestFloatingAssets(limit = 11) {
  const url = `${config.baseURL}/api/floating-assets`;
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      data: { limit },
      timeout: config.timeout,
      success: (res) => {
        console.log("[asset-api] floating success", {
          url,
          statusCode: res.statusCode,
          data: res.data
        });
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail: (err) => {
        console.error("[asset-api] floating fail", { url, err });
        reject(err);
      }
    });
  });
}

module.exports = {
  requestMatch,
  requestFloatingAssets
};
