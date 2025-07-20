function analyze(sg) {
  if (window.location.host.includes('xiaohongshu.com') && window.location.pathname.startsWith('/user/profile/')) {
    analyzeXiaohongshu(sg);
  } else if (window.location.host.includes('douyin.com') && window.location.pathname.startsWith('/user/')) {
    analyzeDouyin(sg);
  } else {
    alert('当前页面不支持分析，请在小红书或抖音的账号主页使用此功能');
  }
}


function getUserInfoXiaohongshu() {
  const userInfo = {};
  // 获取用户名和小红书号
  const nameElement = document.querySelector('.user-name');
  if (nameElement) {
    userInfo.username = nameElement.textContent.trim();
  }
  
  const redIdElement = document.querySelector('.user-redId');
  if (redIdElement) {
    userInfo.xhsId = redIdElement.textContent.replace('小红书号：', '').trim();
  }
  
  // 获取头像
  const avatarElement = document.querySelector('.avatar-wrapper img');
  if (avatarElement) {
    userInfo.avatar = avatarElement.src;
  }
  
  // 获取粉丝数和获赞收藏数
  const userInteractions = document.querySelectorAll('.user-interactions .count');
  if (userInteractions.length >= 3) {
    userInfo.followers = userInteractions[1].textContent.trim();
    userInfo.likes = userInteractions[2].textContent.trim();
  }
  
  // 获取用户简介
  const descElement = document.querySelector('.user-desc');
  if (descElement) {
    userInfo.description = descElement.textContent.trim();
  }
  
  // 获取用户标签
  const tagElements = document.querySelectorAll('.user-tags .tag, .user-tags .tag-item');
  if (tagElements.length > 0) {
    userInfo.tags = Array.from(tagElements).map(tag => {
      // 处理性别标签
      const genderIcon = tag.querySelector('use');
      if (genderIcon && genderIcon.hasAttribute('xlink:href')) {
        const gender = genderIcon.getAttribute('xlink:href') === '#female' ? '女' : '男';
        return `性别:${gender}`;
      }
      return tag.textContent.trim();
    });
  }
  
  return userInfo;
}

async function analyzeXiaohongshu(sg) {
  const items = document.querySelectorAll('.note-item');
  const likeCounts = [];
  const userInfo = getUserInfoXiaohongshu();
  
  
  items.forEach(item => {
    const likeText = item.querySelector('.count')?.textContent;
    if (likeText && likeText.trim() !== '') {
      let likes = 0;
      if (likeText.includes('万')) {
        const numValue = parseFloat(likeText.replace(/[^\d.]/g, ''));
        likes = numValue * 10000;
      } else {
        likes = parseInt(likeText.replace(/[^\d]/g, '')) || 0;
      }
      likeCounts.push(likes);
      // 获取小红书标题和链接
      const titleElement = item.querySelector('.footer .title span') || item.querySelector('.title');
      item.dataset.title = titleElement?.textContent.trim() || '无标题';
      
      const linkElement = item.querySelector('a.cover.mask.ld') || item.querySelector('a[href^="/note/"]');
      if (linkElement) {
        item.dataset.url = new URL(linkElement.href, window.location.origin).href;
      }
    } else {
      likeCounts.push(0);  // 处理空字符串情况
    }
  });

  processAnalysisResults(items, likeCounts, userInfo,sg);
}

function getUserInfoDouyin() {
  const userInfo = {};
  
  // 获取抖音号和昵称
  const usernameElement = document.querySelector('.GMEdHsXq span span span span');
  const followersElement = document.querySelector('[data-e2e="user-info-fans"] .C1cxu0Vq');
  const likesElement = document.querySelector('[data-e2e="user-info-like"] .C1cxu0Vq');
  const douyinIdElement = document.querySelector('.OcCvtZ2a');
  const locationElement = document.querySelector('.DtUnx4ER');
  const descriptionElement = document.querySelector('.JMYmWBA1 span span span span span');
  
  if (usernameElement) {
    userInfo.nickname = usernameElement.textContent.trim();
  }
  if (douyinIdElement) {
    userInfo.douyinId = douyinIdElement.textContent.trim();
  }
  if (followersElement) {
    userInfo.followers = followersElement.textContent.trim();
  }
  if (likesElement) {
    userInfo.likes = likesElement.textContent.trim();
  }
  if (descriptionElement) {
    userInfo.description = descriptionElement.textContent.trim();
  }
  if (locationElement) {
    userInfo.location = locationElement.textContent.trim();
  }
  
  return userInfo;
}

function analyzeDouyin(sg) {
  // 使用data-e2e属性获取作品列表容器
  const postList = document.querySelector('[data-e2e="user-post-list"]');
  if (!postList) {
    processAnalysisResults([], [], {},sg);
    return;
  }
  const userInfo = getUserInfoDouyin();

  // 等待页面加载完成
  let retryCount = 0;
  const maxRetries = 10; // 最大重试次数

  const waitForItems = () => {
    const items = postList.querySelectorAll('li.wqW3g_Kl.WPzYSlFQ.OguQAD1e');
    if (items.length === 0 && retryCount < maxRetries) {
      retryCount++;
      setTimeout(waitForItems, 2000); // 增加等待时间到2秒
      return;
    }

    const likeCounts = [];
    const userInfo = getUserInfoDouyin();
    const itemsData = [];

    // 如果超过最大重试次数仍未找到items，返回空结果
    if (items.length === 0) {
      processAnalysisResults([], [], userInfo,sg);
      return;
    }

    // 提取抖音点赞数和标题
    items.forEach(item => {
      // 从点赞区域获取点赞数 - 更新选择器
      const likeArea = item.querySelector('span.uWre3Wbh.author-card-user-video-like');
      if (likeArea) {
        const likeText = likeArea.querySelector('span.BgCg_ebQ')?.textContent;
        if (likeText) {
          // 处理点赞数格式（1.8万→18000）
          let likes = 0;
          if (likeText.includes('万')) {
            likes = parseFloat(likeText.replace('万', '')) * 10000;
          } else if (likeText.includes('k')) {
            likes = parseFloat(likeText.replace('k', '')) * 1000;
          } else {
            likes = parseInt(likeText.replace(/[^\d]/g, '')) || 0;
          }
          likeCounts.push(likes);

          // 获取抖音标题和链接
          const linkElement = item.querySelector('a.uz1VJwFY.TyuBARdT.IdxE71f8');
          const url = linkElement ? new URL(linkElement.href, window.location.origin).href : '';
          const title = item.querySelector('p.EtttsrEw')?.textContent || item.querySelector('p.eJFBAbdI.H4IE9Xgd')?.textContent || '无标题';

          itemsData.push({
            title,
            url,
            likes: likeText
          });
        }
      }
    });

    const douyinData = {
      userInfo,
      items: itemsData
    };
    console.log('抖音原始数据:', douyinData);

    processAnalysisResults(items, likeCounts, userInfo,sg);
  };

  // 立即开始检查页面加载
  waitForItems();

}

async function processAnalysisResults(items, likeCounts, userInfo = {}, sg) {
  // 清除之前的高亮效果
  items.forEach(item => {
    item.style.border = '';
    item.style.boxShadow = '';
  });

  if (!sg && likeCounts.length === 0) {
    // 仅发送完成状态
    chrome.runtime.sendMessage({ type: 'analysisComplete', success: false });
    return;
  }

  // 根据数据来源判断是抖音还是小红书
  const isDouyin = Object.hasOwnProperty.call(userInfo, 'douyinId');
  const sourceData = isDouyin ? {
    userInfo,
    items: Array.from(items).map(item => {
      const linkElement = item.querySelector('a.uz1VJwFY.TyuBARdT.IdxE71f8');
      const url = linkElement ? new URL(linkElement.href, window.location.origin).href : '';
      const title = item.querySelector('p.EtttsrEw')?.textContent || item.querySelector('p.eJFBAbdI.H4IE9Xgd')?.textContent || '无标题';
      const likeArea = item.querySelector('span.uWre3Wbh.author-card-user-video-like');
      const likeText = likeArea ? likeArea.querySelector('span.BgCg_ebQ')?.textContent : '';
      return {
        title,
        url,
        likes: likeText
      };
    })
  } : {
    userInfo,
    items: Array.from(items).map(item => ({ 
      title: item.dataset.title, 
      url: item.dataset.url, 
      likes: item.querySelector('.count')?.textContent 
    }))
  };

  let hasCache = false; 
  let hasDeepCache = false;
  let cacheData;
  const parsedData = (data)=>{
    if(!data||(!data.output_d&&!data.output_s)){
      return false;
    }
      const markdownText = JSON.stringify(data.output_d||data.output_s, null, 2);
      // 去除 markdownText 开头和结尾的双引号
      let parsedText = markdownText.replace(/^"|"$/g, '');
      parsedText = parsedText.replace(/- /gm, '<div style="margin-bottom: 10px;"></div>');
      parsedText = parsedText.replace(/\\n/g, '<div style="margin-bottom: 10px;"></div>');
      // 新增：处理### 综合评价格式为h3
      parsedText = parsedText.replace(/### (.*?)\s/g, '<h4>$1</h4>');
      parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return parsedText;
  }


  
  // 封装 API 调用为异步函数
  const fetchApiData = async (sourceData, type='normal') => {
    // 生成包含类型的缓存键
    const cacheKey = sourceData.userInfo.xhsId ? `xhs-${sourceData.userInfo.xhsId}-${type}` : 
                     sourceData.userInfo.douyinId ? `dy-${sourceData.userInfo.douyinId}-${type}` : null;
    // 生成deep类型缓存键（用于优先检查）
    const deepCacheKey = sourceData.userInfo.xhsId ? `xhs-${sourceData.userInfo.xhsId}-deep` : 
                          sourceData.userInfo.douyinId ? `dy-${sourceData.userInfo.douyinId}-deep` : null;

    if (cacheKey) {
      // 优先检查deep缓存（仅当当前类型为normal时）
      let cachedData;
      if (type === 'normal' && deepCacheKey) {
        cachedData = await new Promise(resolve => chrome.storage.sync.get([deepCacheKey], resolve));
        if (cachedData[deepCacheKey]) {
          console.log('使用deep缓存数据：', deepCacheKey);
          hasCache = true;
          hasDeepCache = true;
          // 补充设置cacheData
          cacheData = parsedData(cachedData[deepCacheKey].data);
          document.getElementById('showDeepButton').style.display ='none';
          document.getElementById('showclearCacheButton').style.display ='block';
          return cachedData[deepCacheKey];
          
        }
        console.log('没有deep缓存');
      }
      // 未找到deep缓存时检查当前类型缓存
      cachedData = await new Promise(resolve => chrome.storage.sync.get([cacheKey], resolve));
     console.log('找到正常缓存',cachedData)
      if (cachedData[cacheKey]) {
        console.log('使用缓存数据：', cacheKey);
        const data = cachedData[cacheKey];
        cacheData = parsedData(data.data);
        if(cacheData){
          document.getElementById('apiData').innerHTML = cacheData;
          // 直接检查深度缓存状态
          const deepCacheKey = sourceData.userInfo.xhsId ? `xhs-${sourceData.userInfo.xhsId}-deep` : `dy-${sourceData.userInfo.douyinId}-deep`;
          chrome.storage.sync.get([deepCacheKey], (deepCache) => {
            document.getElementById('showDeepButton').style.display = deepCache[deepCacheKey] ? 'none' : 'block';
          });
          document.getElementById('clearCacheButton').style.display = 'block';
          return cacheData;
        }
      }
      console.log('没有缓存数据，开始请求数据：', cacheKey);
    }

    try {
      const response = await fetch('http://localhost:7001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: sourceData, type, cacheKey })
      });
      const data = await response.json();
      if(data.success){
        if (cacheKey) {
          chrome.storage.sync.set({ [cacheKey]: data });
           hasCache = true;
           if(type=='deep'){
            hasDeepCache = true;
           }
        }
        console.log(data.data)
        document.getElementById('apiData').innerHTML = parsedData(data.data);
        document.getElementById('showDeepButton').style.display = 'block';
        return data;
      }else{
        document.getElementById('apiData').innerHTML = '部分数据分析失败';
        console.log('error', data.error);
      }
    } catch (error) {
      console.error('调用Coze API出错:', error);
      document.getElementById('apiData').innerHTML = '部分数据分析失败';
      return { error: error.message };
    }
  }

  // async function fetchDeepAnalysis() {
  //   try {
  //     const response = await fetch('http://localhost:7001/run', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ input: sourceData, type: 'deep' })
  //     });
  //     const data = await response.json();
  //     document.getElementById('apiData').innerHTML = data.result;
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // }
  // 在processAnalysisResults函数中修改按钮绑定方式
  
  
  
  function fetchDeepAnalysis() {
    // 触发深度分析请求时，将type改为'deep'
    const button = document.getElementById('showDeepButton'); // 假设按钮id为deepAnalysisButton
    if (button) {
        button.disabled = true;
        button.textContent = '分析中...';
    }
    fetchApiData(sourceData,'deep').then(data => {
        const deepAnalysisElement = document.getElementById('apiData');
        if (deepAnalysisElement) {
            deepAnalysisElement.innerHTML = parsedData(data.data);
           
        } 
        button.style.display = 'none';
        document.getElementById('clearCacheButton').style.display = 'block';
    }).finally(() => {
        if (button) {
            button.disabled = false;
            button.textContent = '深度洞察';
        }
    });
  }


  // 清除当前账号缓存（normal和deep类型）
const clearCache = async () => {
  const xhsId = sourceData?.userInfo?.xhsId;
  const douyinId = sourceData?.userInfo?.douyinId;
  if (!xhsId && !douyinId) {
    alert('未检测到当前账号信息');
    return;
  }
  const cacheKeys = [];
  if (xhsId) {
    cacheKeys.push(`xhs-${xhsId}-normal`, `xhs-${xhsId}-deep`);
  }
  if (douyinId) {
    cacheKeys.push(`dy-${douyinId}-normal`, `dy-${douyinId}-deep`);
  }
  await chrome.storage.sync.remove(cacheKeys);
  alert('已清除当前账号缓存（含深度分析缓存）');
}

  
  // 发起异步调用，不等待结果
  const apiPromise = fetchApiData(sourceData);
  
  if (!sg&&likeCounts.length === 0) {
    // 仅发送完成状态
    chrome.runtime.sendMessage({
      type: 'analysisComplete',
      success: false
    });
    return;
  }
  
  // 计算平均值和标准差
  const avg = likeCounts.reduce((a, b) => a + b, 0) / likeCounts.length;
  const stdDev = Math.sqrt(
    likeCounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / likeCounts.length
  );
  
  // 改进的阈值算法
  const belowAvgCount = likeCounts.filter(l => l < avg).length;
  const aboveAvgCount = likeCounts.length - belowAvgCount;
  
  // 根据数据分布动态调整阈值
  let threshold;
  if (aboveAvgCount > belowAvgCount * 2) {
    // 如果大部分数据高于平均值，使用更严格的阈值
    threshold = avg + 1.0 * stdDev;
  } else {
    // 正常情况
    threshold = avg + 0.5 * stdDev;
  }

  let  ratio = await new Promise(resolve => {
    chrome.storage.sync.get(['threshold'], resolve);
  });

  if(ratio.threshold===''||ratio.threshold==null||ratio.threshold===undefined){
    ratio.threshold=50;
  }
  threshold = threshold * ratio.threshold/100;
  


  const highlights = [];
  items.forEach((item, index) => {
    // 设置所有作品透明度为0.3
    item.style.opacity = '0.3';
    
    if (likeCounts[index] > threshold) {
      highlights.push({
        title: item.dataset.title,
        likes: likeCounts[index],
        url: item.dataset.url || window.location.href
      });
      
      // 高亮显示异常作品
      item.style.border = '4px solid red';
      item.style.boxShadow = '0 0 15px rgba(255,0,0,0.8)';
      item.style.opacity = '1';
    }
  });
  if(!sg){
    // 使用事务方式确保数据一致性
    const timestamp = new Date().toISOString();
    const key = 'analysisResults_'+window.location.href; // 改为使用URL作为key的一部分

    // 先删除该URL可能存在的旧记录
    await new Promise(resolve => {
      chrome.storage.sync.remove(key, resolve);
    });

    await chrome.storage.sync.set({ [key]: {
      url: window.location.href,
      results: highlights || [],
      timestamp: timestamp,  // 使用前面生成的timestamp
      userInfo: userInfo || {}
    } }, () => {
      // 发送完成状态
      chrome.runtime.sendMessage({
        type: 'analysisComplete',
        success: true
      });
    });
  }


  // 修改结果展示部分的样式
  let resultDiv = document.querySelector('#analysis-result-container');
  // 如果结果容器已存在，先移除它
  if (resultDiv) {
    resultDiv.remove();
  }
  
  // 创建新的结果容器
  resultDiv = document.createElement('div');
    resultDiv.id = 'analysis-result-container';
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '0';
    resultDiv.style.left = '0';
    resultDiv.style.width = '350px';
    resultDiv.style.height = '100vh';
    resultDiv.style.zIndex = '9999';
    resultDiv.style.background = 'white';
    resultDiv.style.padding = '15px';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRight = 'none';
    resultDiv.style.borderRadius = '0 8px 8px 0';
    resultDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    resultDiv.style.overflowY = 'auto';
    resultDiv.style.transition = 'transform 0.3s ease';
    resultDiv.style.transform = 'translateX(-350px)'; // 初始隐藏
    
    // 确保折叠按钮位置正确
    const existingToggleBtn = document.querySelector('#analysis-toggle-btn');
    if (existingToggleBtn) {
      existingToggleBtn.style.left = '350px';
      existingToggleBtn.innerHTML = '◀';
    }
  
  // 修改折叠按钮位置
  let toggleBtn = document.querySelector('#analysis-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('div');
    toggleBtn.id = 'analysis-toggle-btn';
    document.body.appendChild(toggleBtn);
  }
  toggleBtn.innerHTML = '◀';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.left = '0'; // 初始在屏幕左侧
  toggleBtn.style.top = '50%';
  toggleBtn.style.transform = 'translateY(-50%)';
  toggleBtn.style.width = '20px';
  toggleBtn.style.height = '60px';
  toggleBtn.style.background = 'white';
  toggleBtn.style.border = '1px solid #ccc';
  toggleBtn.style.borderLeft = 'none';
  toggleBtn.style.borderRadius = '0 8px 8px 0';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.userSelect = 'none';
  toggleBtn.style.zIndex = '10000';  // 确保按钮在最上层
  
  // 添加点击事件
  let isCollapsed = false;
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      resultDiv.style.transform = 'translateX(-350px)';
      toggleBtn.innerHTML = '▶';
      toggleBtn.style.left = '0';
    } else {
      resultDiv.style.transform = 'translateX(0)';
      toggleBtn.innerHTML = '◀';
      toggleBtn.style.left = '350px';
    }
  });
  
  // 在添加内容后，立即显示面板
  setTimeout(() => {
    resultDiv.style.transform = 'translateX(0)'; // 滑入屏幕
    toggleBtn.style.left = '350px'; // 按钮移动到面板右侧
    resultDiv.style.top = '0';
    resultDiv.style.left = '0';
    resultDiv.style.height = '100vh';
  }, 100);
  
  // 将按钮添加到body而不是resultDiv
  document.body.appendChild(toggleBtn);


  // 账号评分算法
  // Move the account score calculation before it's used in the HTML
  function calculateAccountScore(avgLikes, stdDev, followers, likes) {
    // 标准化处理粉丝数和获赞数
    console.log(followers);
    const parseSocialNumber = (numStr) => {
        if (!numStr) return 0;
        if (numStr.includes('万')) {
            return parseFloat(numStr.replace('万', '')) * 10000;
        } else if (numStr.includes('k')) {
            return parseFloat(numStr.replace('k', '')) * 1000;
        } else {
            return parseInt(numStr.replace(/[^\d]/g, '')) || 0;  // 修正正则表达式
        }
    };
    
    const followersNum = parseSocialNumber(followers) || 1;
    const likesNum = parseSocialNumber(likes) || 0;
    // 1. 修正互动率计算
    const engagementRate = Math.min(1, avgLikes / followersNum); // 限制最大为100%
   
    const normalizedStdDev = stdDev / (avgLikes + 1); // 防止除以0
    const likeConsistency = Math.max(1, Math.min(100, 100 * Math.exp(-0.5 * normalizedStdDev)));
  
    
    const popularityScore = Math.min(1, 
      (Math.log10(likesNum + 1) * 0.7 + 
       Math.log10(followersNum + 1) * 0.3) / 5
    ) * 100;

    // 4. 添加低分高赞判断
    const isLowFansHighLikes = followersNum < 10000 && engagementRate > 0.1;
    
    // 计算综合评分(0-100分)
    const score = Math.min(100, 
      (engagementRate * 20) + 
      (likeConsistency * 0.2) + 
      (popularityScore * 0.5) +
      (isLowFansHighLikes ? 10 : 0)
    );
    // Add return statement at the end


       // 新增账号风格分类函数
       function getAccountStyle(consistency, popularity) {
        const styleMap = [
            { threshold: [80, 80], label: '优质均衡型', desc: '内容稳定且受欢迎' },
            { threshold: [80, 60], label: '稳定成长型', desc: '内容稳定且传播力良好' },
            { threshold: [80, 40], label: '稳定小众型', desc: '内容稳定但受众有限' },
            { threshold: [60, 80], label: '单点爆发式', desc: '偶有爆款但不够稳定' },
            { threshold: [60, 60], label: '潜力新星型', desc: '表现均衡有上升空间' },
            { threshold: [40, 80], label: '内容波动式', desc: '爆款频出但不够稳定' },
            { threshold: [40, 60], label: '普通发展型', desc: '表现中等需优化' },
            { threshold: [40, 40], label: '起步阶段型', desc: '各项指标均有提升空间' }
        ];

        // 寻找最接近的匹配规则
        const closestStyle = styleMap.reduce((prev, curr) => {
            const prevDiff = Math.abs(consistency - prev.threshold[0]) + Math.abs(popularity - prev.threshold[1]);
            const currDiff = Math.abs(consistency - curr.threshold[0]) + Math.abs(popularity - curr.threshold[1]);
            return currDiff < prevDiff ? curr : prev;
        });

        // 设置最低匹配条件（至少满足一个维度超过40）
        if (closestStyle.threshold[0] > 40 || closestStyle.threshold[1] > 40) {
            return closestStyle;
        }
        return { label: '新兴探索型', desc: '新账号或数据不足' };
    }

    const accountStyle = getAccountStyle(likeConsistency, popularityScore);


    return {
      score: Math.round(score),
      engagementRate: (engagementRate * 100).toFixed(2) + '%',
      likeConsistency: Math.round(likeConsistency),
      popularityScore: Math.round(popularityScore),
      isLowFansHighLikes,
      accountStyle: accountStyle.label,  // 新增风格标签
      accountStyleDesc: accountStyle.desc  // 新增风格描述
    };
}

// Calculate the score before generating HTML
const accountScore = calculateAccountScore(
  avg, 
  stdDev, 
  userInfo.followers || '0', 
  userInfo.likes || '0'
);

console.log(hasCache)
// Now generate the HTML with the calculated score
resultDiv.innerHTML = `
  
  <style>
      button {
      margin-top: 10px;
      padding: 8px;
      background: #2196F3;
      color: white;
      border: none;
      width: 100%;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    button:hover {
      background: #0b86eb;
    }

    button:active {
      transform: scale(0.98);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
      #analysis-result {
      font-size: 14px;
      }
      #analysis-result h3 {
        font-size: 26px;
        margin-bottom: 15px;
        color: #333;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        font-weight: bold;
        unicode-bidi: isolate;
      }

      #analysis-result h4 {
        font-size: 18px;
        margin-bottom: 15px;
        color: #333;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        font-weight: bold;
        unicode-bidi: isolate;
      }

    #analysis-result  p {
    display: block;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    unicode-bidi: isolate;
}

 #analysis-result ul {
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    padding-inline-start: 40px;
    unicode-bidi: isolate;
}

 #analysis-result li {
    display: list-item;
    list-style: disc;
    text-align: -webkit-match-parent;
    unicode-bidi: isolate;
}

 #analysis-result a {
   color: #007bff;
}
    </style>
    <div id="analysis-result">
    <h3 style="border-bottom:1px solid #e5e7eb;padding: 15px 0; margin:0">分析结果</h3>
    ${userInfo.avatar ? `<img src="${userInfo.avatar}" style="width: 50px; height: 50px; border-radius: 50%; margin: 10px 0;">` : ''}
    ${userInfo.username ? `<p>用户名: ${userInfo.username}</p>` : ''}
    ${userInfo.xhsId ? `<p>小红书号: ${userInfo.xhsId}</p>` : ''}
    ${userInfo.douyinId ? `<p>抖音号: ${userInfo.douyinId}</p>` : ''}
    ${userInfo.nickname ? `<p>昵称: ${userInfo.nickname}</p>` : ''}
    ${userInfo.followers ? `<p>粉丝数: ${userInfo.followers}</p>` : ''}
    ${userInfo.likes ? `<p>获赞/收藏: ${userInfo.likes}</p>` : ''}
    <h4>详细维度拆解</h4>
      ${hasCache ? `<div id="apiData">${cacheData}</div>` : `<div id="apiData">
      <style>
        .loading {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #3498db;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="loading"></div>
      <span style="color:red">后台正在扫描分析中，数据即将呈现....</span>
    </div>`}
    <button id="showDeepButton" style="display:${hasCache&&!hasDeepCache ? 'block' : 'none'}">深度洞察</button>
    <button id="clearCacheButton" style="display: ${hasCache ? 'block' : 'none'}; margin:10px 0; padding: 8px 16px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer">清除当前账号缓存</button>

    <h4>账号质量评分</h4>
    <p>综合评分: ${accountScore.score}分 ${accountScore.isLowFansHighLikes ? '(低粉高赞账号)' : ''}</p>
   
    <p>账号风格: <strong>${accountScore.accountStyle}</strong>(${accountScore.accountStyleDesc})</p>
    <p>是否低粉高赞号: ${accountScore.isLowFansHighLikes? '是': '否'}</p>
    <p>互动率: ${accountScore.engagementRate}</p>
    <p>内容稳定性: ${accountScore.likeConsistency}分</p>
    <p>受欢迎度: ${accountScore.popularityScore}分</p>
    <div id="likesChartd" style="width:100%; height:200px; margin-bottom:20px;  border-bottom:1px solid #eee;">
    </div>
    <h4>近期相对高点赞作品</h4>
    ${avg ? `<p>平均点赞数: ${avg.toFixed(0)}</p>` : ''}
    ${stdDev ? `<p>标准差: ${stdDev.toFixed(0)}</p>` : ''}
    <p>高点赞阈值: ${threshold.toFixed(0)}</p>
    <p>高点赞作品数: ${highlights.length}</p>
    <ul>
      ${highlights.map(h => `<li><a href="${h.url}" target="_blank">${h.title}</a> - ${h.likes}点赞</li>`).join('')}
    </ul>
   
      
    </div>
    </div>
  `;
  document.body.prepend(resultDiv);
  document.getElementById('showDeepButton').addEventListener('click', fetchDeepAnalysis);
document.getElementById('clearCacheButton').addEventListener('click', clearCache);

  // 创建折线图容器
  const chartContainer = document.createElement('div');
  chartContainer.style.marginBottom = '20px';
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 200;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '320px';
  canvas.style.display = 'block';
  chartContainer.appendChild(canvas);
  // 查找id为likesChartd的div元素
const likesChartdDiv = document.getElementById('likesChartd');
if (likesChartdDiv) {
  // 如果存在，则将chartContainer渲染到该div中
  likesChartdDiv.appendChild(chartContainer);
} else {
  // 如果不存在，则给出警告信息
  console.warn('未找到id为likesChartd的div元素，无法渲染图表容器');
}
  // 绘制折线图
  const ctx = canvas.getContext('2d');
  const maxLike = Math.max(...likeCounts);
  const minLike = Math.min(...likeCounts);
  const range = maxLike - minLike;
  const padding = 5;
  
  // 绘制坐标轴
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.strokeStyle = '#666';
  ctx.stroke();
  
  // 绘制数据点
  ctx.strokeStyle = '#4285f4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  likeCounts.slice().reverse().forEach((count, i) => {
    const x = padding + (i / (likeCounts.length - 1)) * (canvas.width - 2 * padding);
    const y = canvas.height - padding - ((count - minLike) / range) * (canvas.height - 2 * padding);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // 绘制数据点
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    ctx.arc(x, y+1, 3, 0, Math.PI * 2);
    ctx.fill();
  });
 

  // 在添加内容后，使用setTimeout触发动画
setTimeout(() => {
  resultDiv.style.transform = 'translateX(0)'; // 滑入屏幕
}, 100);
  return highlights;
}

// --- Start of new SPA navigation handling logic ---

function removeAnalysisUI() {
  const resultDiv = document.querySelector('#analysis-result-container');
  if (resultDiv) {
    resultDiv.remove();
  }
  const toggleBtn = document.querySelector('#analysis-toggle-btn');
  if (toggleBtn) {
    toggleBtn.remove();
  }
}

function handlePageNavigation() {
  // Add a delay to ensure the page content is updated after navigation
  setTimeout(() => {
    const isSupportedPage = (window.location.host.includes('xiaohongshu.com') && window.location.pathname.startsWith('/user/profile/')) ||
                            (window.location.host.includes('douyin.com') && window.location.pathname.startsWith('/user/'));

    if (isSupportedPage) {
      // It's a user page, so we should re-analyze.
      // The 'true' parameter ensures the UI is shown.
      analyze(true);
    } else {
      // Not a user page, remove the UI.
      removeAnalysisUI();
    }
  }, 1500); // 1.5 second delay, adjustable
}

// Use a single, robust observer for SPA navigation
let lastUrl = window.location.href;
const spaObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    handlePageNavigation();
  }
});

// Start observing the body for changes that indicate a route change
spaObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Also handle popstate for browser back/forward buttons, which might not trigger the observer
window.addEventListener('popstate', handlePageNavigation);

// --- End of new SPA navigation handling logic ---
