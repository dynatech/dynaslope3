process.chdir(__dirname);
 
module.exports = {
    root: true,
    parser: "babel-eslint",
    parserOptions: {
        allowImportExportEverywhere: true,
        codeFrame: false
    },
    "extends": [
        "airbnb-standard",
        "prettier",
        "prettier/react"
    ],
    env: {
        browser: true,
        es6: true,
        jquery: true
    },
    rules: {
        "react/jsx-filename-extension": ["error", { extensions: [".js", ".jsx"] }],
        "jsx-a11y/label-has-associated-control": [ "error", {
            required: {
                some: [ "nesting", "id" ]
            }
        }],
        "jsx-a11y/label-has-for": [ "error", {
            required: {
                some: [ "nesting", "id" ]
            }
        }],
        indent: [
            "error",
            4,
            {
                SwitchCase: 1,
                MemberExpression: 0,
                ObjectExpression: 1
            }
        ],
        quotes: [
            "error",
            "double",
            { allowTemplateLiterals: true }
        ],
        semi: [
            "error",
            "always"
        ],
        "spaced-comment": [
            "error",
            "always",
            {
                exceptions: [
                    "*"
                ]
            }
        ],
        "no-use-before-define": "error",
        camelcase: 0,
        "prefer-arrow-callback": "error",
        "no-undef": "error",
        "no-var": "error",
        "no-param-reassign": [
            2,
            {
                props: true
            }
        ],
        "block-spacing": "error",
        "dot-notation": "error",
        "no-multi-spaces": "error",
        "comma-spacing": ["error", { before: false, after: true }],
        "jsx-quotes": ["error", "prefer-double"],
        "key-spacing": ["error", { afterColon: true, mode: "strict" }],
        "keyword-spacing": ["error", { before: true, after: true }],
        "linebreak-style": 0,
        "max-params": ["error", 3],
        "newline-per-chained-call": ["error", { ignoreChainWithDepth: 2 }],
        "no-unneeded-ternary": "error",
        "object-curly-spacing": ["error", "always"],
        "quote-props": ["error", "as-needed", { keywords: true, numbers: true }],
        "semi-spacing": ["error", { before: false, after: true }],
        "space-before-blocks": "error",
        "space-before-function-paren": ["error", "always"],
        "space-infix-ops": ["error", { int32Hint: false }],
        "switch-colon-spacing": ["error", { after: true, before: false }],
        "prefer-destructuring": ["error", { object: true, array: false }],
        "no-extra-semi": "error"
    },
    plugins: [
        "prettier"
    ]
};