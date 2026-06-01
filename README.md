# wechat-asset-classifier

一个用于资产分类查询的微信小程序项目。

## 功能

- 根据资产名称查询分类结果
- 从后端接口获取浮动词推荐
- 适配微信开发者工具的小程序工程结构

## 项目结构

```text
pages/      页面代码
utils/      接口与配置
data/       本地数据
db/         SQL 脚本
```

## 本地开发

1. 使用微信开发者工具打开项目目录。
2. 确认 `project.config.json` 中的 `appid` 配置正确。
3. 根据需要修改 `utils/config.js` 中的后端服务地址。

## 注意事项

- `project.private.config.json` 为本地私有配置文件，已在 `.gitignore` 中排除。
- 当前默认接口地址指向腾讯云托管服务，公开仓库前请确认该地址可以对外暴露。
