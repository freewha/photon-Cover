const photon = require('./photon_rs_inline.js');
const { PhotonImage, resize, SamplingFilter } = photon;

console.log('测试内联 WASM 版本...');
console.log('- PhotonImage 可用:', typeof PhotonImage);
console.log('- resize 函数可用:', typeof resize);
console.log('- SamplingFilter 可用:', typeof SamplingFilter);
console.log('✅ 内联 WASM 加载成功！');
