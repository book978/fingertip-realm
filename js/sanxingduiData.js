/** Shared cultural copy and canonical artifact coordinates; no browser dependencies. */
export const PARTS = [
  { id: 'face', name: '面庞', target: { x: 0, y: 0 }, initial: { x: 0, y: 21 } },
  { id: 'eye-left', name: '左目', target: { x: -8.5, y: 3 }, initial: { x: -31, y: 12 } },
  { id: 'eye-right', name: '右目', target: { x: 8.5, y: 3 }, initial: { x: 31, y: 12 } },
  { id: 'ear-left', name: '左耳', target: { x: -23.5, y: 0 }, initial: { x: -35, y: -11 } },
  { id: 'ear-right', name: '右耳', target: { x: 23.5, y: 0 }, initial: { x: 35, y: -11 } },
  { id: 'jaw', name: '颌部', target: { x: 0, y: -8 }, initial: { x: 0, y: -20 } },
];
export const HOTSPOTS = [
  { id: 'eyes', name: '纵目', en: 'THE PROTRUDING EYES', position: { x: -8.5, y: 3 }, title: '目光，向外延伸', text: '柱状凸出的双目，是纵目面具鲜明的造型特征。转动器物，从斜侧面观察眼部伸出的体积。关于它的用途与象征，研究仍有不同解释。' },
  { id: 'ears', name: '展耳', en: 'THE EXPANDING SILHOUETTE', position: { x: 23.5, y: 0 }, title: '双耳，展开器形', text: '向两侧展开的耳部，与宽阔的面庞共同形成强烈的横向轮廓。试着把视线从双眼移到耳缘，感受这件器物的比例。' },
  { id: 'bronze', name: '青铜', en: 'FORM IN BRONZE', position: { x: 1.2, y: -7 }, title: '青铜，承载形貌', text: '参考器物出土于四川广汉三星堆遗址，材质为青铜。这里的造型、铜绿和分件方式经过艺术化设计，供你以另一种方式亲近古蜀文化。' },
];
export const SOURCES = [
  { name: '三星堆博物馆 · 纵目面具', url: 'https://artsandculture.google.com/asset/mask-with-protruding-eyes-unknown/5AFJRU7_hxc1yA?hl=zh-cn' },
  { name: '香港故宫 · 凝视三星堆', url: 'https://www.hkpm.org.hk/sc/visit/audio-guide/g8-gazing-at-sanxingdui' },
];
