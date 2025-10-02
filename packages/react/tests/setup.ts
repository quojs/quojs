/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

// Optionally set up global test hooks
beforeAll(() => {
  // Runs once before all tests.
  // e.g., global mocks, spies, env setup.
});

afterAll(() => {
  // Runs once after all tests.
  // e.g., cleanup, restore things
});

beforeEach(() => {
  // Runs before each test.
  // e.g., reset state
});

afterEach(() => {
  // Runs after each test.
  // e.g., clear mocks
});

// Optionally add any custom global matchers or utilities
// Example: Add a helper to assert deep immutability, etc.

// Optionally mock timers for async code
// import { vi } from 'vitest';
// vi.useFakeTimers();
