HarmonyOS Sans SC 字体放置位置
================================

将以下三份字体文件放入本目录（frontend/public/fonts/）：

  HarmonyOS_Sans_SC_Regular.woff2   (or .ttf)
  HarmonyOS_Sans_SC_Medium.woff2    (or .ttf)
  HarmonyOS_Sans_SC_Bold.woff2      (or .ttf)

下载来源
--------
HarmonyOS Sans 由 Huawei 官方发布，可通过以下任一渠道获取：
  1. 华为开发者官网：https://developer.huawei.com/consumer/cn/doc/design-guides/font-0000001157868583
  2. 公司内部字体服务器（如可访问）
  3. 许多 npm/pypi 镜像站也有对应二进制包

若本地没有字体文件，页面会自动回退到 PingFang SC / Microsoft YaHei / 系统字体，
视觉不会崩坏；但加上字体后，页面的字形、压缩、谐调都会更符合 NPU 生态的设计语言。

若工作机上已安装 HarmonyOS Sans 系统字体，CSS 的 local() 声明会直接命中系统安装，
无需放置任何文件即可生效。
