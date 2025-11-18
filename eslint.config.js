module.exports = [
  {
    rules: {
      // ESLint recommended rules - manually specified since @eslint/js not installed
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-new-symbol": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-octal": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-vars": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-with": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error"
    }
  },
  {
    ignores: [
      "node_modules/**",
      "tmp/**",
      "coverage/**",
      "bower_components/**",
      "plugin_cache/**"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        // Node.js globals
        require: "readonly",
        module: "readonly",
        exports: "writable",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        global: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly"
      }
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "no-undef": "error",
      "no-redeclare": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "warn",
      "no-irregular-whitespace": "warn",
      "semi": ["warn", "always"],
      "quotes": "off",
      "indent": "off",
      "no-mixed-spaces-and-tabs": "warn",
      "no-trailing-spaces": "off",
      "eol-last": "off",
      "comma-dangle": "off"
    }
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        expect: "readonly"
      }
    },
    rules: {
      "no-unused-expressions": "off"
    }
  },
  {
    files: ["src/js/**/*.js", "src/components/**/*.jsx"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        $: "readonly",
        jQuery: "readonly",
        app: "writable",
        util: "readonly",
        _: "readonly",
        React: "readonly",
        Backbone: "readonly",
        moment: "readonly"
      }
    },
    rules: {
      "no-undef": "off"
    }
  },
  {
    files: ["settings/**/*.js"],
    languageOptions: {
      globals: {
        settings: "writable"
      }
    }
  }
];
