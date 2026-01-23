module.exports = {
  default: {
    require: ['src/**/__tests__/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:cucumber-report.html'],
    parallel: 2
  }
};