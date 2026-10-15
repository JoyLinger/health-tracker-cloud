// 飞书多维表格后端代理 - 部署到 Vercel Serverless
// 环境变量需要在 Vercel 后台配置：
// APP_ID: 飞书自建应用的 App ID
// APP_SECRET: 飞书自建应用的 App Secret
// BASE_TOKEN: 多维表格的 base_token
// RECORD_TABLE_ID: 打卡记录表的 table_id
// USER_TABLE_ID: 用户表的 table_id

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

let cachedToken = null;
let tokenExpireAt = 0;

async function getTenantAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt - 60000) {
    return cachedToken;
  }
  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.APP_ID,
      app_secret: process.env.APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error('获取飞书token失败: ' + data.msg);
  }
  cachedToken = data.tenant_access_token;
  tokenExpireAt = now + data.expire * 1000;
  return cachedToken;
}

async function feishuRequest(path, options = {}) {
  const token = await getTenantAccessToken();
  const res = await fetch(`${FEISHU_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`飞书API错误 ${data.code}: ${data.msg}`);
  }
  return data.data;
}

// 把前端state格式转成飞书记录格式
function stateToRecord(username, date, dayData) {
  const fields = {
    '用户名': username,
    '日期': new Date(date).getTime(),
  };
  if (dayData.weight != null) fields['体重(kg)'] = dayData.weight;
  if (dayData.diet) {
    fields['午餐完成'] = JSON.stringify(dayData.diet.lunch || []);
    fields['晚餐完成'] = JSON.stringify(dayData.diet.dinner || []);
    fields['加餐完成'] = JSON.stringify(dayData.diet.snack || []);
    if (dayData.diet.calorie) fields['热量摄入(kcal)'] = Number(dayData.diet.calorie);
    if (dayData.diet.note) fields['饮食备注'] = dayData.diet.note;
  }
  if (dayData.training) {
    fields['训练完成'] = JSON.stringify(dayData.training.items || []);
    if (dayData.training.steps) fields['步数'] = Number(dayData.training.steps);
    if (dayData.training.min) fields['训练时长(分钟)'] = Number(dayData.training.min);
    if (dayData.training.note) fields['训练备注'] = dayData.training.note;
  }
  if (dayData.habits) {
    fields['习惯完成'] = JSON.stringify(dayData.habits.items || []);
    if (dayData.habits.note) fields['习惯备注'] = dayData.habits.note;
  }
  return fields;
}

// 把飞书记录转成前端state格式
function recordToState(record) {
  const f = record.fields;
  const date = new Date(f['日期']).toISOString().slice(0, 10);
  const result = {
    weight: {},
    diet: {},
    training: {},
    habits: {},
  };
  if (f['体重(kg)'] != null) {
    result.weight[date] = f['体重(kg)'];
  }
  result.diet[date] = {
    lunch: JSON.parse(f['午餐完成'] || '[]'),
    dinner: JSON.parse(f['晚餐完成'] || '[]'),
    snack: JSON.parse(f['加餐完成'] || '[]'),
    calorie: f['热量摄入(kcal)'] || '',
    note: f['饮食备注'] || '',
  };
  result.training[date] = {
    items: JSON.parse(f['训练完成'] || '[]'),
    steps: f['步数'] || '',
    min: f['训练时长(分钟)'] || '',
    note: f['训练备注'] || '',
  };
  result.habits[date] = {
    items: JSON.parse(f['习惯完成'] || '[]'),
    note: f['习惯备注'] || '',
  };
  return result;
}

// 合并多条记录到一个state对象
function mergeRecords(records) {
  const state = { weight: {}, diet: {}, training: {}, habits: {} };
  records.forEach(r => {
    const s = recordToState(r);
    Object.assign(state.weight, s.weight);
    Object.assign(state.diet, s.diet);
    Object.assign(state.training, s.training);
    Object.assign(state.habits, s.habits);
  });
  return state;
}

module.exports = async (req, res) => {
  // 简单CORS处理
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    // POST /api/login - 登录或注册
    if (pathname === '/api/login' && req.method === 'POST') {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      }

      // 查用户表有没有这个用户
      const searchRes = await feishuRequest(
        `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.USER_TABLE_ID}/records/search?page_size=10`,
        {
          method: 'POST',
          body: JSON.stringify({
            filter: {
              conjunction: 'and',
              conditions: [
                { field_name: '用户名', operator: 'is', value: [username] }
              ]
            }
          })
        }
      );

      if (searchRes.items && searchRes.items.length > 0) {
        // 用户已存在，验证密码
        const user = searchRes.items[0];
        if (user.fields['密码'] !== password) {
          return res.status(401).json({ success: false, error: '密码错误' });
        }
        return res.json({ success: true, username });
      } else {
        // 用户不存在，自动注册
        await feishuRequest(
          `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.USER_TABLE_ID}/records`,
          {
            method: 'POST',
            body: JSON.stringify({
              fields: {
                '用户名': username,
                '密码': password,
                '创建时间': Date.now(),
              }
            })
          }
        );
        return res.json({ success: true, username, isNew: true });
      }
    }

    // GET /api/data?username=xxx - 获取用户所有打卡数据
    if (pathname === '/api/data' && req.method === 'GET') {
      const username = req.query.username;
      if (!username) {
        return res.status(400).json({ success: false, error: '缺少username参数' });
      }

      let allRecords = [];
      let pageToken = '';
      do {
        const url = `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.RECORD_TABLE_ID}/records?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
        const data = await feishuRequest(url);
        // 过滤当前用户的记录
        const userRecords = (data.items || []).filter(r => r.fields['用户名'] === username);
        allRecords = allRecords.concat(userRecords);
        pageToken = data.page_token || '';
        if (!data.has_more) break;
      } while (pageToken);

      const state = mergeRecords(allRecords);
      return res.json({ success: true, state });
    }

    // POST /api/save - 保存某天的打卡数据
    if (pathname === '/api/save' && req.method === 'POST') {
      const { username, date, dayData } = req.body;
      if (!username || !date) {
        return res.status(400).json({ success: false, error: '缺少参数' });
      }

      // 先查有没有当天的记录
      const searchRes = await feishuRequest(
        `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.RECORD_TABLE_ID}/records/search?page_size=10`,
        {
          method: 'POST',
          body: JSON.stringify({
            filter: {
              conjunction: 'and',
              conditions: [
                { field_name: '用户名', operator: 'is', value: [username] },
                { field_name: '日期', operator: 'is', value: ['ExactDate(' + date + ')'] }
              ]
            }
          })
        }
      );

      const fields = stateToRecord(username, date, dayData);

      if (searchRes.items && searchRes.items.length > 0) {
        // 更新已有记录
        const recordId = searchRes.items[0].record_id;
        await feishuRequest(
          `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.RECORD_TABLE_ID}/records/${recordId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ fields })
          }
        );
      } else {
        // 创建新记录
        await feishuRequest(
          `/bitable/v1/apps/${process.env.BASE_TOKEN}/tables/${process.env.RECORD_TABLE_ID}/records`,
          {
            method: 'POST',
            body: JSON.stringify({ fields })
          }
        );
      }

      return res.json({ success: true });
    }

    res.status(404).json({ success: false, error: '接口不存在' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
