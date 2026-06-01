App({
  onLaunch() {
    if (!wx.cloud) {
      return;
    }
    wx.cloud.init({
      env: "prod-d2ggnrm4me2a9fff4",
      traceUser: true
    });
  }
});
