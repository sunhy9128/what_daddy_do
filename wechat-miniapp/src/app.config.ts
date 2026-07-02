export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/community/index',
    'pages/profile/index',
    'pages/login/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAF6EF',
    navigationBarTitleText: '爸爸去哪了',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FAF6EF',
  },
  tabBar: {
    color: '#8A8A8A',
    selectedColor: '#1F3A5F',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页', iconPath: 'assets/tab/home.png', selectedIconPath: 'assets/tab/home-active.png' },
      { pagePath: 'pages/tasks/index', text: '任务', iconPath: 'assets/tab/tasks.png', selectedIconPath: 'assets/tab/tasks-active.png' },
      { pagePath: 'pages/community/index', text: '社区', iconPath: 'assets/tab/community.png', selectedIconPath: 'assets/tab/community-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/tab/profile.png', selectedIconPath: 'assets/tab/profile-active.png' },
    ],
  },
  requiredPrivateInfos: ['getLocation'],
  permission: {
    'scope.userLocation': { desc: '用于显示附近的产检医院' },
  },
});