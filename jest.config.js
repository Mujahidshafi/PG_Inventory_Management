const nextJest = require('next/jest')

// Create the Jest config with Next.js
const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  clearMocks: true,

  // Transform JS/JSX with Babel (required for JSX)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
}

module.exports = createJestConfig(customJestConfig)