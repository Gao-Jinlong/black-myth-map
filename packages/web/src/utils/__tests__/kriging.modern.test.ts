import { Kriging, MatrixUtils, VariogramModels } from "../kriging.modern";

describe("Kriging Modern Implementation", () => {
  describe("MatrixUtils", () => {
    test("should correctly transpose a matrix", () => {
      const matrix = [1, 2, 3, 4];
      const n = 2;
      const m = 2;
      const result = MatrixUtils.transpose(matrix, n, m);
      expect(result).toEqual([1, 3, 2, 4]);
    });

    test("should correctly multiply matrices", () => {
      const X = [1, 2, 3, 4];
      const Y = [5, 6, 7, 8];
      const result = MatrixUtils.multiply(X, Y, 2, 2, 2);
      expect(result).toEqual([19, 22, 43, 50]);
    });
  });

  describe("VariogramModels", () => {
    const nugget = 0;
    const range = 10;
    const sill = 1;
    const A = 1;

    test("gaussian model should return expected values", () => {
      const h = 5;
      const result = VariogramModels.gaussian(h, nugget, range, sill, A);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(sill);
    });

    test("exponential model should return expected values", () => {
      const h = 5;
      const result = VariogramModels.exponential(h, nugget, range, sill, A);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(sill);
    });

    test("spherical model should return expected values", () => {
      const h = 5;
      const result = VariogramModels.spherical(h, nugget, range, sill, A);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(sill);
    });
  });

  describe("Kriging", () => {
    const values = [1, 2, 3, 4];
    const x = [0, 1, 0, 1];
    const y = [0, 0, 1, 1];
    const model = "gaussian" as const;
    const sigma2 = 0;
    const alpha = 100;

    test("should train model successfully", () => {
      const variogram = Kriging.train(values, x, y, model, sigma2, alpha);
      expect(variogram).toBeDefined();
      expect(variogram.t).toEqual(values);
      expect(variogram.x).toEqual(x);
      expect(variogram.y).toEqual(y);
      expect(variogram.model).toBeDefined();
      expect(variogram.nugget).toBeDefined();
      expect(variogram.range).toBeDefined();
      expect(variogram.sill).toBeDefined();
      expect(variogram.A).toBeDefined();
      expect(variogram.n).toBe(4);
      expect(variogram.M).toBeDefined();
    });

    test("should predict values correctly", () => {
      const variogram = Kriging.train(values, x, y, model, sigma2, alpha);
      // Test prediction at known point
      const predictedValue = Kriging.predict(0, 0, variogram);
      expect(predictedValue).toBeCloseTo(1, 1);

      // Test prediction at interpolated point
      const interpolatedValue = Kriging.predict(0.5, 0.5, variogram);
      expect(interpolatedValue).toBeGreaterThan(0);
      expect(interpolatedValue).toBeLessThan(5);
    });

    test("should handle edge cases", () => {
      // Test with single point
      const singleVariogram = Kriging.train(
        [1],
        [0],
        [0],
        model,
        sigma2,
        alpha,
      );
      expect(singleVariogram).toBeDefined();

      // Test prediction far from training points
      const variogram = Kriging.train(values, x, y, model, sigma2, alpha);
      const farValue = Kriging.predict(100, 100, variogram);
      expect(farValue).toBeDefined();
      expect(isNaN(farValue)).toBe(false);
    });
  });
});
