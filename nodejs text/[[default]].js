import express from "express";
import photon from '../pkg/photon_rs_inline.js';
const { PhotonImage, resize, SamplingFilter } = photon;
const app = express();

// GET /file - 处理 Bing 图片缩放
app.get("/file", async (req, res) => {
  
  let imgurl = "https://www.bing.com/th?id=OHR.TexasIndigoBunting_ZH-CN3699392300_1920x1080.jpg";
  const metadataUrl = "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1";
  
  // 允许通过查询参数自定义图片URL
  if (req.query.url) {
    imgurl = req.query.url;
  } else {
    // 尝试获取 Bing 每日图片
    try {
      const info = await fetch(metadataUrl);
      const json = await info.json();
      if (json?.images?.[0]?.url) {
        imgurl = "https://www.bing.com" + json.images[0].url;
      }
    } catch (error) {
      console.warn("Bing metadata fetch failed:", error);
    }
  }
  
  // 获取缩放参数
  const width = parseInt(req.query.width, 10) || 800;
  const height = parseInt(req.query.height, 10) || 600;
  const format = req.query.format || 'webp';
  const quality = parseInt(req.query.quality, 10) || 80;
  
  try {
    // 获取图片
  const inputBytes = await fetch(imgurl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => new Uint8Array(buffer));

    // create a PhotonImage instance
    const inputImage = photon.PhotonImage.new_from_byteslice(inputBytes);
  
    // resize image using photon
    const outputImage = photon.resize_object_fit(inputImage, 400,600, photon.SamplingFilter.Nearest, photon.ScalingMode.Cover);

    // get webp bytes
    const outputBytes = outputImage.get_bytes_webp();

    // for other formats
    // png  : outputImage.get_bytes();
    // jpeg : outputImage.get_bytes_jpeg(quality);

    // call free() method to free memory
    inputImage.free();
    outputImage.free();
    
    // 设置正确的 Content-Type
    res.setHeader("Content-Type", `image/webp`);
    res.send(outputBytes);
    
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// GET / - 通用图片缩放端点
app.get("/", async (req, res) => {

    return res.status(200).json({ message: "Hello from EdgeOne Functions!" });

    

});


export default app;
