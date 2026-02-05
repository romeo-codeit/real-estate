import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import unicorn from "eslint-plugin-unicorn";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    js.configs.recommended,
    sonarjs.configs.recommended,
    security.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                // Essential Browser Globals
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                location: "readonly",
                history: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                fetch: "readonly",
                Request: "readonly",
                Response: "readonly",
                Headers: "readonly",
                FormData: "readonly",
                FileReader: "readonly",
                Blob: "readonly",
                File: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                indexedDB: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                alert: "readonly",
                confirm: "readonly",
                prompt: "readonly",
                console: "readonly",
                React: "readonly",

                // Common DOM Types (to avoid no-undef)
                Node: "readonly",
                Element: "readonly",
                HTMLElement: "readonly",
                HTMLDivElement: "readonly",
                HTMLSpanElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLAnchorElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLTextAreaElement: "readonly",
                HTMLCanvasElement: "readonly",
                HTMLVideoElement: "readonly",
                HTMLImageElement: "readonly",
                HTMLLIElement: "readonly",
                HTMLUListElement: "readonly",
                HTMLTableElement: "readonly",
                HTMLTableRowElement: "readonly",
                HTMLTableCellElement: "readonly",
                HTMLTableSectionElement: "readonly",
                HTMLTableCaptionElement: "readonly",
                HTMLHeadingElement: "readonly",
                HTMLParagraphElement: "readonly",
                MediaStream: "readonly",
                KeyboardEvent: "readonly",
                MouseEvent: "readonly",
                FocusEvent: "readonly",
                HeadersInit: "readonly",
                NodeJS: "readonly",

                // Essential Node.js Globals
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                global: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "@next/next": nextPlugin,
            "unicorn": unicorn,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            "sonarjs/cognitive-complexity": ["error", 20], // Adjusted for realism
            "sonarjs/no-duplicate-string": "warn",
            "security/detect-object-injection": "off",
            "unicorn/prevent-abbreviations": "off",
            "unicorn/no-null": "off",
            "no-unused-vars": "off", // Handled by @typescript-eslint
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "sonarjs/no-ignored-exceptions": "error",
            "sonarjs/unused-import": "error",
            "no-undef": "error"
        },
    },
    {
        ignores: [
            ".next/*",
            "node_modules/*",
            "dist/*",
            "out/*",
            "coverage/*"
        ],
    },
];
