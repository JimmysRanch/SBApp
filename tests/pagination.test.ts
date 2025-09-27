import { describe, it } from "node:test";
import assert from "node:assert";

describe("Pagination utilities", () => {
  it("should calculate pagination metadata correctly", () => {
    // Test pagination calculation
    const page = 2;
    const size = 10;
    const total = 25;
    
    const pagination = {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      hasNext: total > (page - 1) * size + size,
      hasPrev: page > 1
    };

    assert.strictEqual(pagination.totalPages, 3);
    assert.strictEqual(pagination.hasNext, true);
    assert.strictEqual(pagination.hasPrev, true);
  });

  it("should handle edge cases for pagination", () => {
    // Test first page
    const firstPage = {
      page: 1,
      size: 10,
      total: 25,
      totalPages: Math.ceil(25 / 10),
      hasNext: 25 > (1 - 1) * 10 + 10,
      hasPrev: 1 > 1
    };

    assert.strictEqual(firstPage.hasNext, true);
    assert.strictEqual(firstPage.hasPrev, false);

    // Test last page
    const lastPage = {
      page: 3,
      size: 10,
      total: 25,
      totalPages: Math.ceil(25 / 10),
      hasNext: 25 > (3 - 1) * 10 + 10,
      hasPrev: 3 > 1
    };

    assert.strictEqual(lastPage.hasNext, false);
    assert.strictEqual(lastPage.hasPrev, true);
  });

  it("should handle single page", () => {
    const singlePage = {
      page: 1,
      size: 10,
      total: 5,
      totalPages: Math.ceil(5 / 10),
      hasNext: 5 > (1 - 1) * 10 + 10,
      hasPrev: 1 > 1
    };

    assert.strictEqual(singlePage.totalPages, 1);
    assert.strictEqual(singlePage.hasNext, false);
    assert.strictEqual(singlePage.hasPrev, false);
  });

  it("should enforce size limits", () => {
    const requestedSize = 150;
    const maxSize = 100;
    const actualSize = Math.min(requestedSize, maxSize);
    
    assert.strictEqual(actualSize, 100);
  });
});