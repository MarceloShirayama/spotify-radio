const defaultConfig = {
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  maxWorkers: '50%',
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
  transformIgnorePatterns: ['<rootDir>/node_modules/']
}

export default {
  projects: [
    {
      ...defaultConfig,
      testEnvironment: 'node',
      displayName: '*Backend*',
      collectCoverageFrom: ['server/**/*.{js,jsx}', '!server/index.js'],
      transformIgnorePatterns: [
        defaultConfig.transformIgnorePatterns[0],
        '<rootDir>/public/'
      ],
      testMatch: ['<rootDir>/tests/**/server/**/*.test.js']
    },
    {
      ...defaultConfig,
      testEnvironment: 'jsdom',
      displayName: '*Frontend*',
      collectCoverageFrom: ['public/**/*.{js,jsx}'],
      transformIgnorePatterns: [
        defaultConfig.transformIgnorePatterns[0],
        '<rootDir>/server/'
      ],
      testMatch: ['<rootDir>/tests/**/public/**/*.test.js'],
      setupFiles: ['<rootDir>/server/config.js']
    }
  ]
}
