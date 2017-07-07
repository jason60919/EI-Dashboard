# 1.0.4: Maintenance Release
## Bugs
 * [#]
    * Bug #324 [Stage]新增Widget-Chart，选择WISE-PaaS：Historical data的资料来源，显示的图形不正确
 * [#]
    * Bug #325 [Stage]新增Widget-Google Map成功后，看不到设置的Title
 * [#]
    * Bug #326 [Stage]新增WISE-PaaS：Historical data，Source选择sv类型的值，选择Table显示，v的一列为空
 * [#]
    * Bug #170 management portal / freeboard主畫面的白色toolbar，測試四種browser都有問題
 * [#]
    * Change WISE-PaaS to EI-PaaS
 * [#]
    * Bug #279 [Stage][Security]APPScan页面安全性检查有安全风险问题
 * [#]
    * Bug #367 Technical portal上signin后点击smart factory，food court，interlligent building， green house打开后无内容
 * [#]
    * Bug #327 [Stage][Edge]FreeBoard背景色选择DeepDark，Widget的显示凡是黑色的字体，均无法看清。如Widget的Title、Indicator Light的Text、chart的坐标、Table的数值
 * [#]
    * Bug #85 以HTTPS打开Common的FreeBoard，新增资料来源的DataSource-WebSocket并保存，资料来源不可用，Https无法连接WebSocket
 * [#]
    * Bug #73 EI-Dashboard在DeepDark下显示效果不佳，建议在只读模式下不显示此选项
 * [#]
    * Bug #71 IAQ图片中笑脸压扁
 * [#]
    * Bug #74 柱状图没有Y轴坐标单位
 * [#]
    * Bug #72 收银机ECR average数值没有含义说明，不易理解
 * [#]
    * Bug 8066 - [Dashboard]添加node-red阈值小工具，输入错误的url，点击存储会不停的弹出“找不到服务器url”的提示框,建议只弹出一次即可，且输入错误的url不能保存
 * [#]
    * Bug 8064 - [Dashboard]新增谷歌地图小工具，放大地图到极限，查看工具的缩放比例为22，但是缩放比例的范围为0~21
 * [#]
    * Bug 8065 - [Dashboard]修改图表小工具的图表参数选项，图表的显示样式没有更新，需手动刷新后才能更新


# 1.0.3: Maintenance Release
## Features
 * [+]
   * Add Content-Security-Policy HTTP header.
   * Add X-Content-Type-Options HTTP header.
   * Add X-XSS-Protection HTTP header.
   * Add password encryption in database.
   * EI-Dashboard its own account can perform log out action.
   * Hide defalut login , and provide a demo sso.
   * Change api handle from vcm apis.

# 1.0.2: Maintenance Release
## Features
 * [+]
    * SSO validation for WISEAccessToken type.
    * SSO validation for WISEAppToken type.
    * Auto refresh SSO token (only for WISEAccessToken) on demand.

# 1.0.1: Maintenance Release
## Bugs
 * [#]
    * Change vcm API default url
 * [#]
    * Change sso redirect url
 * [#]
    * Change food court API default

# 1.0.0: Milestone Release
 * The very first official release.
