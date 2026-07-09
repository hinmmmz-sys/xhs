/**
 * XHS Browser Search Service
 * 通过 CDP 连接 Comet 浏览器，实时搜索小红书笔记
 * 端口: 5558
 */
const puppeteer = require('puppeteer-core');
const express = require('express');

const app = express();
app.use(express.json());

const CDP_URL = process.env.XHS_CDP_URL || 'http://127.0.0.1:9333';
const PORT = process.env.XHS_BROWSER_PORT || 5558;

let browser = null;
let searchPage = null;

async function getBrowser() {
  try {
    if (browser && browser.connected) {
      return browser;
    }
  } catch (e) {
    browser = null;
  }
  browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: null });
  console.log(`[Browser] 已连接 CDP ${CDP_URL}`);
  return browser;
}

async function getSearchPage() {
  const b = await getBrowser();
  const pages = await b.pages();
  
  // 查找已有的小红书页面
  for (const p of pages) {
    const url = p.url();
    if (url.includes('xiaohongshu.com')) {
      searchPage = p;
      return p;
    }
  }
  
  // 没有则新建
  const page = await b.newPage();
  await page.goto('https://www.xiaohongshu.com/explore', { waitUntil: 'domcontentloaded', timeout: 30000 });
  searchPage = page;
  return page;
}

async function getLoginStatusFromPage(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || '';
    const state = window.__INITIAL_STATE__;
    const user = state?.user || {};
    const userId = user.userId || user.user_id || user.id || '';
    const nickname = user.nickname || user.nickName || '';
    const needsLogin =
      text.includes('登录后查看搜索结果') ||
      (text.includes('手机号登录') && text.includes('获取验证码'));
    const hasSignedInNav = text.includes('我') && text.includes('发布') && text.includes('通知');
    return {
      loggedIn: !needsLogin && (Boolean(userId || nickname) || hasSignedInNav),
      userId,
      nickname,
      needsLogin,
    };
  }).catch(() => ({ loggedIn: false, userId: '', nickname: '', needsLogin: false }));
}

function notLoggedInResult() {
  return {
    success: false,
    source: 'browser_live',
    error: 'not_logged_in',
    message: '请先在 CDP 浏览器窗口登录小红书',
    total: 0,
    notes: [],
  };
}

/**
 * 实时搜索小红书笔记
 * @param {string} keyword - 搜索关键词
 * @param {number} maxResults - 最大返回数
 */
async function searchNotes(keyword, maxResults = 9999) {
  let page;
  try {
    page = await getSearchPage();
  } catch (e) {
    // 连接失败，重置并重试
    console.log(`[Search] 连接失败，重连: ${e.message}`);
    browser = null;
    searchPage = null;
    page = await getSearchPage();
  }

  const currentLoginStatus = await getLoginStatusFromPage(page);
  if (currentLoginStatus.needsLogin) {
    console.log('[Search] 当前浏览器未登录小红书，无法读取实时搜索结果');
    return notLoggedInResult();
  }
  
  // 导航前设置请求拦截，捕获搜索 API 请求模板
  const capturedSearchReq = { url: '', headers: {}, body: null };
  const capturedSearchResp = { items: [], has_more: false };

  let interceptionEnabled = false;
  await page.setRequestInterception(true);
  interceptionEnabled = true;
  const onRequest = async (req) => {
    const url = req.url();
    if (url.includes('search/notes') && req.method() === 'POST') {
      capturedSearchReq.url = url;
      capturedSearchReq.headers = req.headers();
      try { capturedSearchReq.body = JSON.parse(req.postData()); } catch(e) {}
    }
    try {
      req.continue();
    } catch (e) {
      console.log(`[Search] 请求继续失败: ${e.message}`);
    }
  };
  page.on('request', onRequest);
  
  const onResponse = async (resp) => {
    const url = resp.url();
    if (url.includes('search/notes') && resp.status() === 200) {
      try {
        const json = await resp.json();
        if (json?.data?.items) {
          capturedSearchResp.items = json.data.items;
          capturedSearchResp.has_more = json.data.has_more;
        }
      } catch(e) {}
    }
  };
  page.on('response', onResponse);
  
  // 导航到搜索页面
  const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`;
  console.log(`[Search] 导航: ${searchUrl}`);
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (e) {
    console.log(`[Search] 导航未完全完成，继续读取页面: ${e.message}`);
  }

  // 等待搜索结果加载
  await new Promise(r => setTimeout(r, 5000));

  const initialCount = capturedSearchResp.items.length;
  console.log(`[Search] 初始加载: ${initialCount} 条, has_more=${capturedSearchResp.has_more}`);
  console.log(`[Search] 捕获请求: ${capturedSearchReq.url ? '成功' : '失败'}, body=${JSON.stringify(capturedSearchReq.body)?.substring(0,80)}`);

  // 移除拦截器
  page.off('request', onRequest);
  page.off('response', onResponse);
  if (interceptionEnabled) {
    await page.setRequestInterception(false).catch(e => {
      console.log(`[Search] 关闭请求拦截失败: ${e.message}`);
    });
  }

  if (capturedSearchResp.items.length === 0) {
    const pageStatus = await page.evaluate(() => {
      const text = document.body?.innerText || '';
      return {
        needsLogin:
          text.includes('登录后查看搜索结果') ||
          (text.includes('手机号登录') && text.includes('获取验证码')),
        preview: text.slice(0, 180),
      };
    }).catch(() => null);

    if (pageStatus?.needsLogin) {
      console.log('[Search] 当前浏览器未登录小红书，无法读取实时搜索结果');
      return notLoggedInResult();
    }
  }
  
  // 收集所有结果
  const allItems = [...capturedSearchResp.items];
  
  // 分页加载：通过页面内 fetch 重放请求，增加 page 号
  if (capturedSearchResp.has_more && capturedSearchReq.url && capturedSearchReq.body) {
    const templateUrl = capturedSearchReq.url;
    const templateHeaders = {};
    // 只保留必要的 headers
    for (const key of ['x-s', 'x-t', 'x-s-common', 'content-type', 'cookie', 'user-agent', 'origin', 'referer']) {
      if (capturedSearchReq.headers[key]) {
        templateHeaders[key] = capturedSearchReq.headers[key];
      }
    }
    const templateBody = capturedSearchReq.body;
    
    let pageNum = 2;
    for (let i = 0; i < 50; i++) {
      try {
        const resp = await page.evaluate(async (url, headers, body, pgNum) => {
          try {
            // 更新 page 号
            body.page = pgNum;
            // 重新生成 x-t 时间戳
            headers['x-t'] = String(Date.now());
            
            const fetchResp = await fetch(url, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(body),
              credentials: 'include',
            });
            const json = await fetchResp.json();
            return {
              success: true,
              items: json?.data?.items || [],
              has_more: json?.data?.has_more || false,
              count: json?.data?.items?.length || 0,
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }, templateUrl, { ...templateHeaders }, { ...templateBody }, pageNum);
        
        if (resp.success && resp.count > 0) {
          allItems.push(...resp.items);
          console.log(`[Search] 分页第${pageNum}: +${resp.count} 条 (累计 ${allItems.length})`);
          if (!resp.has_more) {
            console.log('[Search] 已加载全部结果');
            break;
          }
          pageNum++;
        } else {
          console.log(`[Search] 分页停止: ${resp.error || '无更多数据'}`);
          break;
        }
        
        if (allItems.length >= maxResults) break;
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.log(`[Search] 分页异常: ${e.message}`);
        break;
      }
    }
  }
  
  console.log(`[Search] "${keyword}" 总计获取: ${allItems.length} 条`);
  
  // 格式化所有结果
  const notes = allItems
    .filter(item => item && (item.model_type === 'note' || item.note_card || item.id))
    .map(item => {
      const card = item.note_card || {};
      const user = card.user || {};
      const interact = card.interact_info || {};
      const cover = card.cover || {};
      const timeTag = (card.corner_tag_info || []).find(t => t.type === 'publish_time');
      return {
        id: item.id || '',
        title: card.display_title || '',
        type: card.type === 'video' ? '视频' : '图文',
        author: user.nickname || user.nick_name || '',
        author_id: user.user_id || '',
        likes: String(interact.liked_count || '0'),
        comments: String(interact.comment_count || '0'),
        favorites: String(interact.collected_count || '0'),
        shares: String(interact.shared_count || '0'),
        publish_time: timeTag ? timeTag.text : '',
        url: `https://www.xiaohongshu.com/explore/${item.id}?xsec_token=${item.xsec_token || ''}`,
        cover_url: cover.url_default || cover.url_pre || '',
        xsec_token: item.xsec_token || '',
      };
    });
  
  const result = {
    success: true,
    source: 'browser_live',
    total: notes.length,
    notes: notes.slice(0, maxResults),
  };
  result.total = result.notes.length;
  return result;
}

/**
 * 获取热门搜索
 */
async function getHotSearch() {
  const page = await getSearchPage();
  
  // 回到搜索首页
  await page.goto('https://www.xiaohongshu.com/search_result', { 
    waitUntil: 'domcontentloaded', timeout: 15000 
  }).catch(() => {});
  
  await new Promise(r => setTimeout(r, 2000));
  
  const data = await page.evaluate(() => {
    try {
      const state = window.__INITIAL_STATE__;
      if (state && state.search && state.search.hotQuery) {
        const hotList = state.search.hotQuery._rawValue || state.search.hotQuery;
        return {
          success: true,
          total: Array.isArray(hotList) ? hotList.length : 0,
          hot_list: Array.isArray(hotList) ? hotList.map(item => ({
            title: item.title || item.query || '',
            score: String(item.score || item.searchWord || ''),
          })) : [],
        };
      }
    } catch (e) {}
    
    // DOM fallback
    const hotEls = document.querySelectorAll('[class*="hot"] a, [class*="trend"] a');
    return {
      success: hotEls.length > 0,
      total: hotEls.length,
      hot_list: Array.from(hotEls).map(el => ({ title: el.textContent?.trim() || '' })),
    };
  });
  
  return data;
}

// === API 路由 ===

app.post('/search', async (req, res) => {
  try {
    const { keyword = '', max_results = 9999 } = { ...req.body, ...req.query };
    const kw = keyword;
    if (!kw) return res.status(400).json({ success: false, error: '缺少 keyword' });
    
    const data = await searchNotes(kw, parseInt(max_results) || 9999);
    res.json(data);
  } catch (e) {
    console.error('[API] search error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/hot-search', async (req, res) => {
  try {
    const data = await getHotSearch();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    const b = await getBrowser();
    const pages = await b.pages();
    const xhsPages = pages.filter(p => p.url().includes('xiaohongshu.com'));
    res.json({
      status: 'ok',
      browser_connected: true,
      cdp_url: CDP_URL,
      total_pages: pages.length,
      xhs_pages: xhsPages.length,
    });
  } catch (e) {
    browser = null;
    res.json({ status: 'error', browser_connected: false, error: e.message });
  }
});

// 登录状态检测
app.get('/login-status', async (req, res) => {
  try {
    const page = await getSearchPage();
    const isLogin = await getLoginStatusFromPage(page);
    res.json(isLogin);
  } catch (e) {
    res.json({ loggedIn: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔍 XHS Browser Search Service`);
  console.log(`   端口: ${PORT}`);
  console.log(`   CDP:  ${CDP_URL}`);
  console.log(`   API:  POST /search?keyword=xxx`);
  console.log(`         GET  /hot-search`);
  console.log(`         GET  /health\n`);
});
