# Photon-rs Node.js Object-Fit 示例

本项目展示了如何扩展 [Photon-rs](https://github.com/silvia-odwyer/photon) 图像处理库，添加自定义函数，并在 Node.js 环境中使用。我们新增了一个 `resize_object_fit` 函数，该函数模仿了 CSS 的 `object-fit` 属性，支持 `Cover`（裁剪）和 `Contain`（完整显示）两种缩放模式。

## 快速入门

### 环境准备

*   [Rust 和 Cargo](https://www.rust-lang.org/tools/install)
*   [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
*   [Node.js 和 npm](https://nodejs.org/en/download/)

### 在 Firebase Studio (IDX) 环境中

本项目已为 Firebase Studio (IDX) 环境优化。IDX 通过 `dev.nix` 文件来管理开发环境所需的所有工具。

大多数依赖（如 Rust, Cargo, Node.js）已为您预装。要添加 `wasm-pack`，请将 `pkgs.wasm-pack` 添加到 `dev.nix` 文件的 `packages` 列表中，如下所示：

```nix
# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "unstable"; # or "stable-24.05"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.cargo
    pkgs.rustc
    pkgs.rustfmt
    pkgs.stdenv.cc
    pkgs.perl
    pkgs.wasm-pack
    pkgs.lld
  ];
  # Sets environment variables in the workspace
  env = {
    RUST_SRC_PATH = "${pkgs.rustPlatform.rustLibSrc}";
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "rust-lang.rust-analyzer"
      "tamasfe.even-better-toml"
      "serayuzgur.crates"
      "vadimcn.vscode-lldb"
      "google.gemini-cli-vscode-ide-companion"
    ];
    workspace = {
      onCreate = {
        # Open editors for the following files by default, if they exist:
        default.openFiles = ["src/main.rs"];
      };
    };
    # Enable previews and customize configuration
    previews = {};
  };
}

```

修改并保存 `dev.nix` 文件后，IDX 会自动重新构建环境，为您安装 `wasm-pack`。


## 构建 WebAssembly 模块

要将 Rust 代码编译成适用于 Node.js 的 WebAssembly 模块，请进入 `my-photon-build/crate` 目录，并运行以下命令：

```bash
cd my-photon-build/crate
wasm-pack build --target nodejs
```

该命令会编译 Rust 代码，生成必要的 JavaScript 绑定，并将最终的包输出到 `my-photon-build/crate/pkg` 目录中。

## 在 Node.js 中使用

以下示例展示了如何加载一张图片，并应用 `resize_object_fit` 函数的 `Cover` 和 `Contain` 两种模式。

### 示例代码

在项目根目录下创建一个名为 `test.js` 的文件，内容如下：

```javascript
const fs = require('fs');
// 请根据实际路径调整 wasm 包的位置
const photon = require('./my-photon-build/crate/pkg'); 

async function runTest() {
  try {
    // 从文件系统加载输入图片
    const imagePath = './my-photon-build/crate/examples/input_images/daisies_fuji.jpg';
    const imageBuffer = fs.readFileSync(imagePath);

    // 从缓冲区创建 PhotonImage
    const photonImage = photon.PhotonImage.new_from_byteslice(imageBuffer);

    // 1. 使用 'Cover' 模式进行缩放
    // 图片将被缩放以完全覆盖 400x300 的区域，多余部分将被裁剪。
    const coverImage = photon.resize_object_fit(photonImage, 400, 300, photon.SamplingFilter.Nearest, photon.ScalingMode.Cover);
    fs.writeFileSync('cover_test.png', coverImage.toPngBytes());
    console.log('成功创建 cover_test.png');

    // 2. 使用 'Contain' 模式进行缩放
    // 图片将被等比缩放以完整显示在 400x300 的区域内，这可能会产生留白。
    const containImage = photon.resize_object_fit(photonImage, 400, 300, photon.SamplingFilter.Nearest, photon.ScalingMode.Contain);
    fs.writeFileSync('contain_test.png', containImage.toPngBytes());
    console.log('成功创建 contain_test.png');

  } catch (error) {
    console.error('发生错误:', error);
  }
}

runTest();
```

### 运行脚本

在您的终端中执行此脚本：

```bash
node test.js
```

### 输出结果

脚本运行后，您会在项目根目录下发现两个新文件：

*   `cover_test.png`: 使用 "cover" 模式缩放至 400x300 的图片。
*   `contain_test.png`: 使用 "contain" 模式缩放至 400x300 的图片。
