import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  preset: "ts-jest",
  testEnvironment: 'node',
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};

export default config;