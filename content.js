function analyze(sg) {
  console.log('分析开始');
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
  
  return userInfo;
}

function analyzeXiaohongshu(sg) {
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
      item.dataset.title = item.querySelector('.footer .title span')?.textContent || '无标题';
      const linkElement = item.querySelector('a.cover.mask.ld');
      if (linkElement) {
        item.dataset.url = linkElement.href;
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
  const nameElement = document.querySelector('.a34DMvQe');
  if (nameElement) {
    userInfo.nickname = nameElement.textContent.trim();
    
    // 获取抖音号
    const douyinIdElement = document.querySelector('.TVGQz3SI');
    if (douyinIdElement) {
      userInfo.douyinId = douyinIdElement.textContent.replace('抖音号：', '').trim();
    }
  }
  
  // 获取头像
  const avatarElement = document.querySelector('.avatar-wrapper img');
  if (avatarElement) {
    userInfo.avatar = avatarElement.src;
  }
  
  // 获取粉丝数和获赞数
  const fansElement = document.querySelector('[data-e2e="user-info-fans"] .cIss_G7b');
  const likesElement = document.querySelector('[data-e2e="user-info-like"] .cIss_G7b');
  
  if (fansElement) {
    userInfo.followers = fansElement.textContent.trim();
  }
  if (likesElement) {
    userInfo.likes = likesElement.textContent.trim();
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

  // 等待页面加载完成
  let retryCount = 0;
  const maxRetries = 10; // 最大重试次数

  const waitForItems = () => {
    const items = postList.querySelectorAll('li');
    if (items.length === 0 && retryCount < maxRetries) {
      retryCount++;
      setTimeout(waitForItems, 2000); // 增加等待时间到2秒
      return;
    }

    const likeCounts = [];
    const userInfo = getUserInfoDouyin();
    
    // 如果超过最大重试次数仍未找到items，返回空结果
    if (items.length === 0) {
      processAnalysisResults([], [], userInfo,sg);
      return;
    }

    // 提取抖音点赞数和标题
    items.forEach(item => {
      // 从点赞区域获取点赞数 - 更新选择器
      const likeArea = item.querySelector('.YzDRRUWc.author-card-user-video-like');
      if (likeArea) {
        const likeText = likeArea.querySelector('.b3Dh2ia8')?.textContent;
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
          
          // 存储标题到元素的dataset中
          const titleElement = item.querySelector('p:first-of-type');
          if (titleElement) {
            item.dataset.title = titleElement.textContent;
          }
          // 获取抖音标题和链接
          item.dataset.title = item.querySelector('.ztA3qIFr')?.textContent || '无标题';
          const linkElement = item.querySelector('a.hY8lWHgA');
          if (linkElement) {
            item.dataset.url = linkElement.href;
          }
        }
      }
    });

    processAnalysisResults(items, likeCounts, userInfo,sg);
  };

  // 立即开始检查页面加载
  waitForItems();
  
  // 监听URL和路由变化
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const resultDiv = document.querySelector('#analysis-result-container');
      if (resultDiv) {
        resultDiv.remove();
      }
      const toggleBtn = document.querySelector('#analysis-toggle-btn');
      if (toggleBtn) {
        toggleBtn.remove();
      }
    }
  });
  
  // 监听body属性变化（路由和URL变化通常会改变body的class或属性）
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  });
  
  // 额外监听hashchange事件（单页应用常用）
  window.addEventListener('hashchange', () => {
    const resultDiv = document.querySelector('#analysis-result-container');
    if (resultDiv) {
      resultDiv.remove();
    }
    const toggleBtn = document.querySelector('#analysis-toggle-btn');
    if (toggleBtn) {
      toggleBtn.remove();
    }
  });
}

async function processAnalysisResults(items, likeCounts, userInfo = {}, sg) {
  // 清除之前的高亮效果
  items.forEach(item => {
    item.style.border = '';
    item.style.boxShadow = '';
  });
  
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
  if (belowAvgCount > aboveAvgCount * 2) {
    // 如果大部分数据低于平均值，使用更宽松的阈值
    threshold = avg - 0.3 * stdDev;
  } else if (aboveAvgCount > belowAvgCount * 2) {
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
    ratio.threshold=1;
  }
  threshold = threshold * ratio.threshold/20;
  
  console.log( ratio.threshold)


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
    console.log(stdDev,avgLikes);
    // 2. 改进的内容稳定性计算 (确保1-100分布)
    const normalizedStdDev = stdDev / (avgLikes + 1); // 防止除以0
    const likeConsistency = Math.max(1, Math.min(100, 100 * Math.exp(-0.5 * normalizedStdDev)));
    // 使用指数衰减函数，确保：
    // - stdDev=0 → 100分
    // - stdDev=avg → ~60分 
    // - stdDev=2*avg → ~37分
    // - 永远不会低于1分
    
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

// Now generate the HTML with the calculated score
resultDiv.innerHTML = `
  
  <style>
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
  `;
  document.body.prepend(resultDiv);

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

