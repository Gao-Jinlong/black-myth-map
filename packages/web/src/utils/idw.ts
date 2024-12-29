interface Point {
  x: number;
  y: number;
  value: number;
}

export class IDW {
  /**
   * 使用 IDW（反距离加权）方法进行插值
   * @param x 预测点的 x 坐标
   * @param y 预测点的 y 坐标
   * @param points 已知点数组
   * @param power 距离权重指数，通常为2
   * @param smoothing 平滑因子，用于避免除以零的情况
   * @returns 插值结果
   */
  static predict(
    x: number,
    y: number,
    points: Point[],
    power: number = 2,
    smoothing: number = 0.0001,
  ): number {
    let weightSum = 0;
    let valueSum = 0;

    for (const point of points) {
      // 计算距离
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 如果预测点与某个已知点重合
      if (distance < Number.EPSILON) {
        return point.value;
      }

      // 计算权重 (加入平滑因子避免除以零)
      const weight = 1.0 / Math.pow(distance + smoothing, power);
      weightSum += weight;
      valueSum += weight * point.value;
    }

    // 如果所有权重都为0，返回已知点的平均值
    if (weightSum === 0) {
      return points.reduce((sum, p) => sum + p.value, 0) / points.length;
    }

    return valueSum / weightSum;
  }

  /**
   * 批量计算网格点的插值
   * @param width 网格宽度
   * @param height 网格高度
   * @param points 已知点数组
   * @param power 距离权重指数
   * @param smoothing 平滑因子
   * @returns 插值结果数组
   */
  static interpolateGrid(
    width: number,
    height: number,
    points: Point[],
    power: number = 2,
    smoothing: number = 0.0001,
  ): Float32Array {
    const result = new Float32Array(width * height);

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        // 将网格索引转换为实际坐标
        const x = (i / width) * 64;
        const y = (j / height) * 64;

        result[j * width + i] = this.predict(x, y, points, power, smoothing);
      }
    }

    return result;
  }
}
