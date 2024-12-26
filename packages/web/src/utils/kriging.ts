// kriging.ts - 克里金插值算法实现

interface Point {
  x: number;
  y: number;
  value: number;
}

export class Kriging {
  private static gaussian(h: number, nugget: number, range: number, sill: number): number {
    return nugget + ((sill - nugget) * (1.0 - Math.exp(-(h * h) / (range * range))));
  }

  private static spherical(h: number, nugget: number, range: number, sill: number): number {
    if (h > range) return nugget + (sill - nugget);
    return nugget + ((sill - nugget) * (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3)));
  }

  private static train(points: Point[], variogram: string, sigma2: number, alpha: number): {
    K: number[][];
    M: number[];
  } {
    const n = points.length;
    const K = Array(n).fill(0).map(() => Array(n).fill(0));
    const M = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);

        K[i][j] = K[j][i] = variogram === 'gaussian' 
          ? this.gaussian(d, 0, alpha, sigma2)
          : this.spherical(d, 0, alpha, sigma2);
      }
      M[i] = points[i].value;
    }

    return { K, M };
  }

  private static solve(K: number[][], M: number[]): number[] {
    const n = M.length;
    const weights = Array(n).fill(0);
    
    // 简单的高斯消元法
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(K[j][i]) > Math.abs(K[maxRow][i])) {
          maxRow = j;
        }
      }

      for (let k = i; k < n; k++) {
        const tmp = K[i][k];
        K[i][k] = K[maxRow][k];
        K[maxRow][k] = tmp;
      }
      const tmp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tmp;

      for (let j = i + 1; j < n; j++) {
        const factor = K[j][i] / K[i][i];
        for (let k = i; k < n; k++) {
          K[j][k] -= factor * K[i][k];
        }
        M[j] -= factor * M[i];
      }
    }

    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += K[i][j] * weights[j];
      }
      weights[i] = (M[i] - sum) / K[i][i];
    }

    return weights;
  }

  static interpolate(
    points: Point[], 
    x: number, 
    y: number, 
    variogram = 'gaussian',
    sigma2 = 1,
    alpha = 100
  ): number {
    const { K, M } = this.train(points, variogram, sigma2, alpha);
    const weights = this.solve(K, M);
    
    let value = 0;
    for (let i = 0; i < points.length; i++) {
      const dx = x - points[i].x;
      const dy = y - points[i].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const k = variogram === 'gaussian'
        ? this.gaussian(d, 0, alpha, sigma2)
        : this.spherical(d, 0, alpha, sigma2);
      value += weights[i] * k;
    }

    return value;
  }
}
