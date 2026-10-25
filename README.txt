# 站点静态存档 · 双休优选（shuangxiuyouxuan.com）

- 源站：https://shuangxiuyouxuan.com
- 存档时间：2026-10-25（全天数据快照）
- 工具：site-archiver.cjs（BFS 全量镜像 + sitemap 种子 + 岗位 API 全量抓取）
- 规模：6,338 个 HTML 页面 / 11,784 个文件 / 105.5 MB
- 抓取结果：0 失败（后补 6 个站点自身返 409 的 /go/ 中转页，已如实存下响应）

## 页面覆盖

- 商品详情 397 个（/products/product-N，SSR）
- 企业详情 64 个（/companies/company-N，SSR）
- 岗位 5,154 个：详情数据全量 JSON（_api/community/jobs/）+ 岗位页 HTML 壳（/jobs/<id>）
- 淘宝外跳中转页 /go/product-N 396 个（存的是跳转后的真实目标地址）
- 首页、岗位列表 /jobs、品类筛选页、用户心声、推荐、反馈等全部功能页

## 岗位数据（核心资产）

- _api/community/jobs/list/page-0000..0257.json：258 个列表分页（每页 20 条，与线上 page=0 基一致）
- _api/community/jobs/detail/<id>.json：5,154 个岗位详情（含 description 全文、source_url 原招聘链接、schedule_evidence 双休证据、核实/过期时间）
- _api/community/jobs/jobs-all.json、jobs-details-all.json：合并版，便于整体利用
- _api/community/job-cities.json：城市筛选数据；_api/community/group-qr.png：微信群二维码

## 离线浏览关键：_offline-api.js

岗位列表/详情是客户端渲染（数据走 /api/community/*）。本存档带一个 API 拦截器
（已注入全部 6,116 个页面 HTML 的 <head> 首位），把页面里的 API 请求转到 _api/ 下的
快照数据，因此离线状态下：

- 岗位列表可正常加载、翻页、按城市/学历/经验/关键词/公司筛选、按薪资排序
- 点岗位卡片可进入详情页，完整渲染（薪资、双休证据、原站来源链接）
- 页面右下角会显示「离线存档 · 数据快照 2026-10-25」徽标，明示数据时效
- 写操作（收藏事件/反馈/推荐提交）返回 503 与只读提示——收藏本身走浏览器
  localStorage 仍可本地使用，但不会同步到任何服务器

筛选/排序语义经对线上 API 实证后复现（2026-10-25）：
q/city/education/experience/company 均为子串匹配（如 education=本科 线上 total=1200
≈ 本科+本科及以上+大学本科；experience=3 线上 total=1766=1-3年+3-5年+3年以上）；
page 为 0 基每页 20 条；sort=salary 按薪资字符串上限面值降序（不折算 N 薪）。
因是快照，此后原站新增/过期的岗位不在其中，各筛选总数与线上当前值可能有少量差异。

## 如何查看

必须用静态服务器从存档根目录起服务（页面以 /_offline-api.js 绝对路径引用拦截器）：
```
cd 本目录所在路径
node D:/WebArchive/_tools/serve-archive.cjs . 8080
# 或 npx serve . / python -m http.server 8080
```
然后浏览器访问 http://127.0.0.1:8080/ ，进「找双休工作」即可。

## 说明

- 站外链接（招聘平台、淘宝等）未下载，点击后会跳转到原网站；存档内仅保留链接。
- /go/ 中转页 6 个存的是站点自身返回的 409「该商品暂时无法跳转购买」响应。
- 商品页数据里残留的 {{淘宝模板占位符}} URL 非真实页面，验收中已甄别剔除。
- 查询串页面以 index@query.html 形式存储。
- 详细 URL 清单见 manifest.jsonl；抓取报告见 archive-report.json。
