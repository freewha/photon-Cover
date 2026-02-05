
// my-photon-build/crate/scaleFromUr/worker.js

// 1. 导入 init 和我们需要的函数/枚举
import init, { PhotonImage, resize_object_fit, ScalingMode } from './photon_rs.js';

// 2. 导入 wasm 模块以传递给 init
import wasmModule from './photon_rs_bg.wasm';

// 在全局作用域中初始化 Wasm 模块。
const initPromise = init(wasmModule);

export default {
  async fetch(request, env, ctx) {
    // 确保 wasm 模块已初始化
    await initPromise;

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('imageUrl');

    // 解析 width 和 height，如果未提供则为 0
    const width = parseInt(url.searchParams.get('width'), 10) || 0;
    const height = parseInt(url.searchParams.get('height'), 10) || 0;

    // 解析缩放模式，默认为 Cover
    const modeParam = url.searchParams.get('mode')?.toLowerCase();
    let scalingMode = ScalingMode.Cover; // 默认为 Cover
    if (modeParam === 'contain') {
      scalingMode = ScalingMode.Contain;
    }

    if (!imageUrl) {
        return new Response('需要 imageUrl 参数。', { status: 400 });
    }

    if (width === 0 && height === 0) {
        return new Response('需要提供 width 或 height 参数中的至少一个。', { status: 400 });
    }

    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return new Response(`获取图片失败。状态: ${imageResponse.status}`, { status: imageResponse.status });
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageArrayBuffer);

      let photonImage = PhotonImage.new_from_byteslice(imageBytes);

      // *** 调用我们新的、更强大的函数 ***
      // Rust 函数会处理 width/height 为 0 的情况，并应用 Cover/Contain 逻辑
      const resizedImage = resize_object_fit(photonImage, width, height, 2, scalingMode);

      const outputBytes = resizedImage.get_bytes_jpeg(90);

      return new Response(outputBytes, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline; filename="resized.jpg"',
        },
      });

    } catch (error) {
      console.error('处理图片时出错:', error);
      return new Response(`发生错误: ${error.message}`, { status: 500 });
    }
  }
};
