const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

const IS_PROD = process.env.NODE_ENV === "production";

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  publicPath: IS_PROD ? "/bpmn" : "/", // 打包相对路径
  pages: {
    designer: {
      entry: "src/designer/main.js",
      filename: "bpmn-process-designer.html",
      template: "public/index.html",
      title: "流程设计器"
    },
    viewer: {
      entry: "src/viewer/main.js",
      filename: "bpmn-process-viewer.html",
      template: "public/index.html",
      title: "流程查看器"
    }
  },
  productionSourceMap: false,
  devServer: {
    port: 8100
  },
  chainWebpack: config => {
    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(!IS_PROD, config => config.devtool("source-map"));
  },
  configureWebpack: config => {
    // 生产环境相关配置
    if (IS_PROD) {
      // 代码混淆
      config.plugins.push(new TerserPlugin());
      config.plugins.push(
        new CompressionPlugin({
          algorithm: "gzip", // 使用gzip压缩
          test: /\.js$|\.html$|\.css$/, // 匹配文件名
          // filename: "[path].gz", // 压缩后的文件名(保持原文件名，后缀加.gz)
          minRatio: 1, // 压缩率小于1才会压缩
          threshold: 10240, // 对超过10k的数据压缩
          deleteOriginalAssets: false // 是否删除未压缩的源文件，谨慎设置，如果希望提供非gzip的资源，可不设置或者设置为false（比如删除打包后的gz后还可以加载到原始资源文件）
        })
      );
    }
  }
};
