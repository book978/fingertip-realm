# 第三步模型与纹样来源

保存日期：2026-10-22。

## face_landmarker.task

Google MediaPipe 官方 Face Landmarker float16 v1 模型，随本地 Tasks Vision 0.10.14 使用：

- https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

运行库与 Apache-2.0 许可证保存于 vendor/mediapipe/。相机仅在主动操作后开启，本地识别，不上传或保存摄像头画面。模型不是本项目训练所得。

## sun-bird.svg

纹样文件：Siyuwj 的 Wikimedia Commons 矢量图，页面标为二维公共领域作品的忠实重制（PD-art）。保留原始SVG元数据：

- https://commons.wikimedia.org/wiki/File:Sun_and_Immortal_Bird_Emblem_in_Jinsha.svg
- https://upload.wikimedia.org/wikipedia/commons/3/36/Sun_and_Immortal_Bird_Emblem_in_Jinsha.svg

本项目通过SVGLoader构造实际镂空的挤出几何；厚度、褶皱、锤纹和光线为数字艺术加工，不是文物扫描或精确考古复原。

名称与出处核对金沙遗址博物馆官方资料：https://www.jinshasitemuseum.com/seardetail/681 。作品中明确标注「太阳神鸟金饰 · 金沙遗址」，以艺术转化连接古蜀不同遗址，不将其称为三星堆出土物。

## 仅用于验收的公共面部照片

网页审查/试戴与金鸟-第三步/face-fixture-public-domain.jpg 来自 USGS 所列 NASA Harrison Schmitt 肖像；来源页面明确标注 Public Domain：https://www.usgs.gov/media/images/harrison-jack-schmitt-0 。该照片只用于本地模型加载和478点检测验收，不是产品的虚拟人物、用户照片或真实摄像头测试。
