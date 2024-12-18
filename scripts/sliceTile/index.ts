import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// 切片大小（假设每个切片大小为 256x256）
const TILE_SIZE = 256;

/**
 * 将地图切分为指定的 x, y, z 坐标的切片
 * @param options 包含完整地图图像路径、输出切片的文件夹、切片在 X 轴的位置、切片在 Y 轴的位置、切片的缩放层级
 */
async function tileMap(options: {
  inputImagePath: string;
  outputDir: string;
  maxZoom: number;
  minZoom: number;
}) {
  const { inputImagePath, outputDir, maxZoom, minZoom } = options;

  // 检查输出目录是否存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 加载完整地图
  const image = sharp(inputImagePath);

  // 获取地图的尺寸
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error("地图尺寸获取失败");
  }

  const maxLength = Math.max(width, height);
  const v = Math.ceil((maxLength - height) / 2);
  const h = Math.ceil((maxLength - width) / 2);

  const finalImage = sharp(
    await image
      .extend({
        top: v,
        bottom: v,
        left: h,
        right: h,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .webp()
      .toBuffer(),
  );

  for (let z = minZoom; z < maxZoom; z++) {
    const finalOutputDir = path.join(outputDir, z.toString());

    if (!fs.existsSync(finalOutputDir)) {
      fs.mkdirSync(finalOutputDir, { recursive: true });
    }
    for (let y = 0; y < 2 ** z; y++) {
      for (let x = 0; x < 2 ** z; x++) {
        const tileLength = Math.pow(2, z) * TILE_SIZE;

        const scale = maxLength / tileLength;
        const xTileSize = TILE_SIZE * scale;
        const yTileSize = TILE_SIZE * scale;
        const extract = {
          left: Math.floor(x * xTileSize),
          top: Math.floor(y * yTileSize),
          width: Math.ceil(xTileSize),
          height: Math.ceil(yTileSize),
        };

        // 生成切片文件的保存路径
        const outputFilePath = path.join(
          finalOutputDir,
          `tile_${z}_${y}_${x}.webp`,
        );

        finalImage
          .clone()
          .extract(extract)
          .resize(TILE_SIZE, TILE_SIZE)
          .toFile(outputFilePath)
          .then(() => {
            console.log(`已保存 ${outputFilePath}`);
          })
          .catch((err) => {
            console.error(err, extract);
          });
      }
    }
  }

  // 保存切片
}

// 主函数，接受命令行参数
async function main() {
  const pwd = path.join(__dirname, "../../packages/web/public/assets/");
  const options = {
    inputImagePath: path.join(pwd, "black_myth_02.jpg"),
    outputDir: path.join(pwd, "tile/black_myth_02"),
    minZoom: 0,
    maxZoom: 4,
  };

  await tileMap(options);
}

// 执行主函数
main().catch(console.error);
