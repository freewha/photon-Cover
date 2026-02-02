
// worker.js

// 1. 从 wasm 包中导入 init 和所需的函数
import  {initSync , PhotonImage, resize_object_fit ,SamplingFilter, ScalingMode} from '../scaleFromUr/photon_rs.js';

// 2. 导入 wasm 模块以传递给 init
import wasmModule from '../scaleFromUr/photon_rs_bg.wasm';

// 在全局作用域中初始化 Wasm 模块。
// 在 fetch 处理程序中等待此 promise，以确保模块已准备就绪。
initSync({ module: wasmModule });
export default {
  async fetch(request, env, ctx) {
    // 等待 wasm 模块初始化完成。


    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('imageUrl');
    const width = parseInt(url.searchParams.get('width'), 10);
    const height = parseInt(url.searchParams.get('height'), 10);

    if (!imageUrl || !width || !height) {
      return new Response('需要 imageUrl, width, 和 height 参数。', { status: 400 });
    }

    try {
      // 从提供的 URL 获取图片
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return new Response(`获取图片失败。状态: ${imageResponse.status}`, { status: imageResponse.status });
      }

      // 以 Uint8Array 格式获取图片数据
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageArrayBuffer);

      // 从图片字节创建 PhotonImage
      let photonImage = PhotonImage.new_from_byteslice(imageBytes);

      // 调整图片大小。第4个参数是采样滤波器。
      // 1 = Nearest, 2 = Triangle, 3 = CatmullRom, 4 = Gaussian, 5 = Lanczos3
      // 我们使用 Triangle 作为默认值，效果很好。
      const resizedImage = resize_object_fit(photonImage, width, height, SamplingFilter.Lanczos3, ScalingMode.Cover);

      // 获取调整大小后的图片的 JPEG 字节。
      const outputBytes = resizedImage.get_bytes_jpeg(90);

      // 在响应中返回新图片
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
