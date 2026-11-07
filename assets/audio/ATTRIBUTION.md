# Music attribution

Eastern Thought — Kevin MacLeod (incompetech.com).

Licensed under Creative Commons Attribution 4.0:
https://creativecommons.org/licenses/by/4.0/

Official track and current license statement:
https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100682

Official download:
https://incompetech.com/music/royalty-free/mp3-royaltyfree/Eastern%20Thought.mp3

ISRC: USUAN1100682. Original duration: 4:22.

Used with volume adjustment, looping and fades. The audio file is not covered by the source code's MIT License. This is contemporary background music, not an archaeological or traditional performance reconstruction.

## 第四幕中文旁白

`dialogue-narration.wav`：本项目原创中文叙事，完整文本见`dialogue-narration.txt`。使用本机已安装的 Microsoft Yaoyao 中文合成语音离线生成，非真人配音，未上传用户声音。32.034秒、22050Hz、单声道16-bit PCM。

生成方式：Windows System.Speech.Synthesis.SpeechSynthesizer，SelectVoice('Microsoft Yaoyao')、Rate=-1、Volume=90，逐句SSML插入550ms停顿，SetOutputToWaveFile。音频是本地资源，播放不依赖浏览器中文语音或网络服务。系统语音输出不作CC0素材承诺。

## 三回合对话历史配音（0.4.2初版）

初版使用本机Microsoft Kangkang中文男声离线生成，Rate=-2、Volume=88，22050Hz单声道16-bit PCM。2026-10-23已被下列新配音替换，原文件保存在开发备份/配音替换前-20261023-01/。旧Yaoyao单段旁白亦仅为历史资源，生产对话不使用。

## 当前生产配音 2026年10月23日

`dialogue-opening/identity/story/memory/imagination/learn/create.wav`使用创作者提供的七段标准版配音。交付记录标明Microsoft `zh-CN-YunyangNeural`，通过edge-tts生成，语速`-12%`、音调`-4Hz`；FFmpeg完成均衡、石厅短混响、压缩和响度处理。导入使用交付的48kHz、16-bit、双声道PCM WAV母版，不二次有损编码或重复添加效果。

文件对应`配音/work/01_final.wav`至`07_final.wav`。文本与`dialogue-lines.json`逐字一致。每段的源文件、时长、规格与SHA-256见`voice-manifest.json`，原始交付制作说明保存于`docs/references/voice-20261023/`。网页仍在第四幕点击开始后播放，逐句实际结束后出现回答；不使用串联demo，不在第一幕自动播放。

七段为本项目当代虚构对话，非历史原话、非真人录音，不克隆演员或游戏角色声音。原始配音包未附单独的音频再分发授权证明；生成工具和实际Microsoft语音服务的条款分别适用，不将工具代码的许可当作声音素材许可，不声明CC0。
