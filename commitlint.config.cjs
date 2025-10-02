module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-case': [2, 'always', 'kebab-case'],
        'header-max-length': [2, 'always', 100],
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'chore', 'revert']
        ]
    }
};
