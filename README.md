# 双休优选 静态存档（shuangxiuyouxuan-archive）

> **项目定位：本仓库是第三方网站「双休优选」（[https://shuangxiuyouxuan.com/](https://shuangxiuyouxuan.com/)）的全量静态存档备份**，与账号下其他双休购相关仓库是不同的项目，请勿混淆：
>
> - **本仓库（shuangxiuyouxuan-archive）**：仅存第三方「双休优选」站点的静态快照（6,338 页，含岗位 API 数据全量 JSON），**不包含主站数据，也不是主站的数据源**；
> - **shuangxiugou**（[主站](https://github.com/dujeongil-galaxy/shuangxiugou)）：「双休购」众包测评 + 评级卡片的线上应用；
> - **shuangxiugou-guide**（[指南](https://github.com/dujeongil-galaxy/shuangxiugou-guide)）：独立的「双休购 2.0」公开资料与消费决策工具站。

本仓库是第三方站点「双休优选」的静态存档备份，抓取于 **2026-10-25**。

## 说明

- 本站内容为转载存档备份（类似维基百科的资料来源存档），数据版权归原站/原作者所有，**并非官方数据源**，请以企业官方及权威渠道信息为准。
- 商品/企业/功能页为 SSR，正文在 HTML 内；岗位列表/详情为客户端渲染，数据已按 API 快照落地（见下）。
- 更详细的抓取口径、筛选语义复现说明见仓库内 `README.txt`。

## 存档范围

- 6,338 个 HTML 页面 / 11,784 个文件 / 约 105 MB，抓取 0 失败
- 商品详情 397 个（`/products/product-N`）、企业详情 64 个（`/companies/company-N`）
- 岗位 5,154 个：详情数据全量 JSON + 岗位页 HTML 壳（`/jobs/<id>`）
- 淘宝外跳中转页 396 个（`/go/product-N`，存跳转后的真实目标地址）
- 首页、岗位列表、品类筛选、用户心声、推荐、反馈等功能页

## 岗位数据（核心资产）

- `_api/community/jobs/list/page-0000..0257.json`：258 个列表分页（每页 20 条，0 基）
- `_api/community/jobs/detail/<id>.json`：5,154 个岗位详情（含 description 全文、source_url、schedule_evidence 双休证据）
- `jobs-all.json` / `jobs-details-all.json`：合并版，便于整体利用

## 离线浏览关键：`_offline-api.js`

岗位数据原走 `/api/community/*` 客户端渲染。存档内已向全部页面注入 API 拦截器，把请求转向 `_api/` 快照，离线状态下岗位列表可正常加载、翻页、筛选、排序，详情页完整渲染；写操作返回 503 只读提示。页面右下角有「离线存档」徽标明示数据时效。

## 如何查看

用任意静态服务器从仓库根目录起服务（必须从根目录起服务，拦截器与相对路径才正确）：

```bash
python -m http.server 8000
```

## 部署备注

- 仓库根目录已带 `.nojekyll`：本存档含 `_next/`、`_api/` 下划线开头目录，若启用 GitHub Pages，缺它会被 Jekyll 忽略导致资源 404。
- 数据为 2026-10-25 快照，此后原站新增/过期内容不在其中。
