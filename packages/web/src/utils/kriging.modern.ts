// 定义基本类型
interface Point {
  x: number;
  y: number;
}

interface ValuePoint extends Point {
  value: number;
}

interface Variogram {
  t: number[];
  x: number[];
  y: number[];
  nugget: number;
  range: number;
  sill: number;
  A: number;
  n: number;
  model: VariogramModel;
  K?: number[];
  M?: number[];
}

type VariogramModel = (
  h: number,
  nugget: number,
  range: number,
  sill: number,
  A: number,
) => number;

type ModelType = "gaussian" | "exponential" | "spherical";

// 矩阵操作工具类
export class MatrixUtils {
  static diag(c: number, n: number): number[] {
    const Z = new Array(n * n).fill(0);
    for (let i = 0; i < n; i++) {
      Z[i * n + i] = c;
    }
    return Z;
  }

  static transpose(X: number[], n: number, m: number): number[] {
    const Z = new Array(m * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        Z[j * n + i] = X[i * m + j];
      }
    }
    return Z;
  }

  static scale(X: number[], c: number, n: number, m: number): void {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        X[i * m + j] *= c;
      }
    }
  }

  static add(X: number[], Y: number[], n: number, m: number): number[] {
    const Z = new Array(n * m);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        Z[i * m + j] = X[i * m + j] + Y[i * m + j];
      }
    }
    return Z;
  }

  static multiply(
    X: number[],
    Y: number[],
    n: number,
    m: number,
    p: number,
  ): number[] {
    const Z = new Array(n * p);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < p; j++) {
        Z[i * p + j] = 0;
        for (let k = 0; k < m; k++) {
          Z[i * p + j] += X[i * m + k] * Y[k * p + j];
        }
      }
    }
    return Z;
  }

  static cholesky(X: number[], n: number): boolean {
    const p = new Array(n);
    for (let i = 0; i < n; i++) {
      p[i] = X[i * n + i];
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        p[i] -= X[i * n + j] * X[i * n + j];
      }
      if (p[i] <= 0) return false;
      p[i] = Math.sqrt(p[i]);

      for (let j = i + 1; j < n; j++) {
        for (let k = 0; k < i; k++) {
          X[j * n + i] -= X[j * n + k] * X[i * n + k];
        }
        X[j * n + i] /= p[i];
      }
    }

    for (let i = 0; i < n; i++) {
      X[i * n + i] = p[i];
    }
    return true;
  }

  static choleskyInverse(X: number[], n: number): void {
    for (let i = 0; i < n; i++) {
      X[i * n + i] = 1 / X[i * n + i];
      for (let j = i + 1; j < n; j++) {
        let sum = 0;
        for (let k = i; k < j; k++) {
          sum -= X[j * n + k] * X[k * n + i];
        }
        X[j * n + i] = sum / X[j * n + j];
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        X[i * n + j] = 0;
      }
    }

    for (let i = 0; i < n; i++) {
      X[i * n + i] *= X[i * n + i];
      for (let k = i + 1; k < n; k++) {
        X[i * n + i] += X[k * n + i] * X[k * n + i];
      }
      for (let j = i + 1; j < n; j++) {
        for (let k = j; k < n; k++) {
          X[i * n + j] += X[k * n + i] * X[k * n + j];
        }
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        X[i * n + j] = X[j * n + i];
      }
    }
  }
}

// 变差函数模型
export class VariogramModels {
  static gaussian(
    h: number,
    nugget: number,
    range: number,
    sill: number,
    A: number,
  ): number {
    return (
      nugget +
      ((sill - nugget) / range) *
        (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)))
    );
  }

  static exponential(
    h: number,
    nugget: number,
    range: number,
    sill: number,
    A: number,
  ): number {
    return (
      nugget +
      ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)))
    );
  }

  static spherical(
    h: number,
    nugget: number,
    range: number,
    sill: number,
    A: number,
  ): number {
    if (h > range) return nugget + (sill - nugget) / range;
    return (
      nugget +
      ((sill - nugget) / range) *
        (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3))
    );
  }
}

// 主要的 Kriging 类
export class Kriging {
  static train(
    values: number[],
    x: number[],
    y: number[],
    model: ModelType,
    sigma2: number,
    alpha: number,
  ): Variogram {
    const variogram: Variogram = {
      t: values,
      x,
      y,
      nugget: 0.0,
      range: 0.0,
      sill: 0.0,
      A: 1 / 3,
      n: values.length,
      model: VariogramModels.gaussian,
    };

    // 选择变差函数模型
    switch (model) {
      case "gaussian":
        variogram.model = VariogramModels.gaussian;
        break;
      case "exponential":
        variogram.model = VariogramModels.exponential;
        break;
      case "spherical":
        variogram.model = VariogramModels.spherical;
        break;
    }

    // 计算滞后距离/半变异数
    const n = values.length;
    const distance: [number, number][] = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        distance.push([
          Math.sqrt(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2)),
          Math.abs(values[i] - values[j]),
        ]);
      }
    }

    distance.sort((a, b) => a[0] - b[0]);
    variogram.range = distance[distance.length - 1][0];

    // 计算变差函数
    const lags = Math.min(30, (n * n - n) / 2);
    const tolerance = variogram.range / lags;
    const lag = new Array(lags).fill(0);
    const semi = new Array(lags).fill(0);

    if (lags < 30) {
      for (let l = 0; l < lags; l++) {
        lag[l] = distance[l][0];
        semi[l] = distance[l][1];
      }
    } else {
      let i = 0,
        j = 0,
        k = 0,
        l = 0;
      while (i < lags && j < distance.length) {
        while (distance[j][0] <= (i + 1) * tolerance) {
          lag[l] += distance[j][0];
          semi[l] += distance[j][1];
          j++;
          k++;
          if (j >= distance.length) break;
        }
        if (k > 0) {
          lag[l] /= k;
          semi[l] /= k;
          l++;
        }
        i++;
        k = 0;
      }
      if (l < 2) return variogram; // 错误：点太少
    }

    // 特征变换和最小二乘法拟合
    const X = new Array(2 * n).fill(1);
    const Y = new Array(n);
    const { A } = variogram;

    for (let i = 0; i < n; i++) {
      switch (model) {
        case "gaussian":
          X[i * 2 + 1] =
            1.0 - Math.exp(-(1.0 / A) * Math.pow(lag[i] / variogram.range, 2));
          break;
        case "exponential":
          X[i * 2 + 1] =
            1.0 - Math.exp((-(1.0 / A) * lag[i]) / variogram.range);
          break;
        case "spherical":
          X[i * 2 + 1] =
            1.5 * (lag[i] / variogram.range) -
            0.5 * Math.pow(lag[i] / variogram.range, 3);
          break;
      }
      Y[i] = semi[i];
    }

    // 矩阵运算
    const Xt = MatrixUtils.transpose(X, n, 2);
    let Z = MatrixUtils.multiply(Xt, X, 2, n, 2);
    Z = MatrixUtils.add(Z, MatrixUtils.diag(1 / alpha, 2), 2, 2);
    const cloneZ = [...Z];

    if (MatrixUtils.cholesky(Z, 2)) {
      MatrixUtils.choleskyInverse(Z, 2);
    } else {
      // 使用备选求解方法
      Z = cloneZ;
    }

    const W = MatrixUtils.multiply(
      MatrixUtils.multiply(Z, Xt, 2, 2, n),
      Y,
      2,
      n,
      1,
    );

    // 设置变差函数参数
    variogram.nugget = W[0];
    variogram.sill = W[1] * variogram.range + variogram.nugget;

    // 计算克里金矩阵
    const K = new Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        const dist = Math.sqrt(
          Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2),
        );
        K[i * n + j] = K[j * n + i] = variogram.model(
          dist,
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A,
        );
      }
      K[i * n + i] = variogram.model(
        0,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    }

    // 计算克里金权重
    let C = MatrixUtils.add(K, MatrixUtils.diag(sigma2, n), n, n);
    const cloneC = [...C];
    if (MatrixUtils.cholesky(C, n)) {
      MatrixUtils.choleskyInverse(C, n);
    } else {
      // 使用备选求解方法
      C = cloneC;
    }

    variogram.K = [...C];
    variogram.M = MatrixUtils.multiply(C, values, n, n, 1);

    return variogram;
  }

  static predict(x: number, y: number, variogram: Variogram): number {
    const k = new Array(variogram.n);
    for (let i = 0; i < variogram.n; i++) {
      const dist = Math.sqrt(
        Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
      );
      k[i] = variogram.model(
        dist,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    }
    return MatrixUtils.multiply(k, variogram.M!, 1, variogram.n, 1)[0];
  }
}
