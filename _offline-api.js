/*!
 * 双休优选 · 离线存档 API 拦截器（存档快照 2026-10-25）
 * ------------------------------------------------------------------
 * 作用：把页面里的 /api/community/* 请求转到本存档 _api/ 目录下的快照数据，
 *       使岗位列表、岗位详情、城市筛选在离线（无原站）状态下依然可用。
 *
 * 覆盖端点（经对线上 API 实证，2026-10-25）：
 *   GET /api/community/jobs?q=&city=&education=&experience=&sort=&page=&company=
 *       - page 为 0 基，每页 20 条，与线上一致
 *       - q/city/education/experience/company 均为「子串匹配」，与线上语义一致
 *         （线上实测：education=本科 total=1200≈本科+本科及以上+大学本科；
 *           experience=3 total=1766=1-3年+3-5年+3年以上，精确命中）
 *       - sort=newest 用快照顺序（线上默认序）；sort=salary 按薪资字符串上限
 *         面值降序（线上实测：9-14K*14薪 排在 14K 档，即不折算 N 薪）
 *   GET /api/community/jobs/<id>   -> _api/community/jobs/detail/<id>.json（缺失返 404）
 *   GET /api/community/job-cities  -> _api/community/job-cities.json
 *   GET /api/community/group-qr    -> _api/community/group-qr.png
 *   GET /api/community/jobs/mine   -> 空数组（收藏态属会话数据，非存档内容）
 *
 * 注意：本文件需由静态服务器从存档根目录提供（页面里以 /_offline-api.js 绝对路径引用）。
 *       数据为 2026-10-25 快照，此后原站新增/过期的岗位不在其中。
 */
(function () {
  'use strict';
  if (window.__archiveApiInstalled) return;
  window.__archiveApiInstalled = true;

  var PREFIX = '/api/community/';
  var API_BASE = '/_api/community/';
  var SNAPSHOT = '2026-10-25';
  var PAGE_SIZE = 20;
  var allJobsPromise = null;

  function loadAll() {
    if (allJobsPromise) return allJobsPromise;
    allJobsPromise = fetch(API_BASE + 'jobs/jobs-all.json').then(function (r) {
      if (!r.ok) throw new Error('岗位快照数据缺失');
      return r.json();
    }).then(function (j) { return j.items || j; });
    return allJobsPromise;
  }

  // 薪资字符串 -> 排序键（上限面值；万=×10000，K/千=×1000，不折算 N 薪）
  function salaryKey(job) {
    var s = String(job.salary == null ? '' : job.salary);
    if (!s) return -1;
    var range = s.match(/(\d+(?:\.\d+)?)\s*[-~—–至]\s*(\d+(?:\.\d+)?)/);
    var num;
    if (range) num = parseFloat(range[2]);
    else { var single = s.match(/(\d+(?:\.\d+)?)/); num = single ? parseFloat(single[1]) : 0; }
    if (/万/.test(s)) num *= 10000;
    else if (/[kK]/.test(s) || /千/.test(s)) num *= 1000;
    return num;
  }

  function contains(hay, needle) {
    return String(hay == null ? '' : hay).indexOf(needle) !== -1;
  }

  function filterAndPage(params) {
    return loadAll().then(function (jobs) {
      var q = params.get('q') || '';
      var city = params.get('city') || '';
      var education = params.get('education') || '';
      var experience = params.get('experience') || '';
      var company = params.get('company') || '';
      var sort = params.get('sort') || 'newest';
      var page = parseInt(params.get('page') || '0', 10);
      if (!isFinite(page) || page < 0) page = 0;

      var list = jobs.filter(function (j) {
        if (q && !contains(j.title, q) && !contains(j.employer, q)) return false;
        if (city && !contains(j.city, city)) return false;
        if (education && !contains(j.education, education)) return false;
        if (experience && !contains(j.experience, experience)) return false;
        if (company && !contains(j.company_slug, company) && !contains(j.employer, company)) return false;
        return true;
      });
      if (sort === 'salary') {
        list = list.slice().sort(function (a, b) { return salaryKey(b) - salaryKey(a); });
      }
      var start = page * PAGE_SIZE;
      return { total: list.length, items: list.slice(start, start + PAGE_SIZE) };
    });
  }

  function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  function showBadge() {
    if (document.getElementById('archive-api-badge')) return;
    var d = document.createElement('div');
    d.id = 'archive-api-badge';
    d.textContent = '离线存档 · 数据快照 ' + SNAPSHOT;
    d.setAttribute('style',
      'position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:6px 12px;' +
      'border-radius:999px;background:rgba(17,24,39,.82);color:#fff;' +
      'font:12px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;' +
      'pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.25)');
    (document.body || document.documentElement).appendChild(d);
  }

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.split('?')[0];
    var method = (init && init.method) || 'GET';
    if (path.indexOf(PREFIX) === 0) {
      var rest = path.slice(PREFIX.length);
      // 会话引导：合成一个，避免页面加载即报错（写操作仍会被下方 503 拦截）
      if (rest === 'session' && method === 'GET') {
        return Promise.resolve(jsonResponse({ header: 'Idempotency-Key', token: 'archive-offline' }));
      }
      // 写操作（收藏事件/反馈/推荐等）：存档为只读快照，明确告知而非假装成功
      if (method !== 'GET' && method !== 'HEAD') {
        return Promise.resolve(jsonResponse(
          { message: '这是 2026-10-25 的离线存档快照，为只读副本；收藏仅保存在本机浏览器，提交类操作不可用。' }, 503));
      }
      var detail = rest.match(/^jobs\/(\d+)$/);
      if (detail) {
        var id = detail[1];
        return origFetch(API_BASE + 'jobs/detail/' + id + '.json').then(function (r) {
          showBadge();
          return r.ok ? r : jsonResponse({ error: 'not_found' }, 404);
        });
      }
      if (rest === 'jobs') {
        var u = new URL(url, location.origin);
        return filterAndPage(u.searchParams).then(function (res) {
          showBadge();
          return jsonResponse(res);
        });
      }
      if (rest === 'job-cities') return origFetch(API_BASE + 'job-cities.json').then(function (r) { showBadge(); return r; });
      if (rest === 'group-qr') return origFetch(API_BASE + 'group-qr.png').then(function (r) { showBadge(); return r; });
      if (rest === 'jobs/mine') return Promise.resolve(jsonResponse([]));
    }
    return origFetch.apply(this, arguments);
  };
})();
