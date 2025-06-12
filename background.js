// 后台脚本，用于监听页面变化并自动执行分析
chrome.runtime.onInstalled.addListener(() => {
  // 监听存储变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.autoAnalyze?.newValue === true) {
      checkAndAnalyze();
    }
  });

  // 初始化检查
  chrome.storage.sync.get(['autoAnalyze'], (result) => {
    if (result.autoAnalyze) {
      checkAndAnalyze();
    }
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get(['autoAnalyze'], (result) => {
      if (result.autoAnalyze && isTargetUrl(tab.url)) {
        executeAnalysis(tabId);
      }
    });
  }
});

function isTargetUrl(url) {
  return url && (
    url.includes('xiaohongshu.com/user/profile') || 
    url.includes('douyin.com/user')
  );
}

function executeAnalysis(tabId) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    files: ['content.js']
  }).then(() => {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      function: () => {
        analyze(true);
      }
    });
  });
}

function checkAndAnalyze() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (isTargetUrl(tab.url)) {
        executeAnalysis(tab.id);
      }
    });
  });
}