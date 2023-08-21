<img src="logo.png" width="100" align="right" alt="logo">

# Vivia

[![website](https://img.shields.io/badge/website-vivia.saurlax.com-blue)](https://vivia.saurlax.com)
[![license](https://img.shields.io/npm/l/vivia.svg)](https://www.npmjs.com/package/vivia)
[![npm version](https://img.shields.io/npm/v/vivia.svg)](https://www.npmjs.com/package/vivia)
[![chat](https://img.shields.io/badge/chat-on_QQ-blue)](https://pd.qq.com/s/g5z1ao6om)

## Introduction

vivia is a simple and fast static website generator that gives you more freedom to control everything on your website through powerful plugins.

**Features**

- Only encapsulate the basic components of the website (source, templates, data), simple and fast
- Plugins pipeline, by defining `render` and `prerender` pipeline in configuration, each plugin can control the final output, including operations such as adding watermarks to images
- A more natural output, where the structure in `source` is the final website structure
- Theme inheritance, no need to write complex configuration, just inherit the theme directly

## Quick Start

**Create project**

```bash
$ npm create vivia
$ npm i
```

**Preview & Hot-reload Writing**

```bash
$ npm run serve
```

**Generate website**

```bash
$ npm run build
```

## Contribution

We welcome [pull requests](https://github.com/saurlax/vivia/pulls) from everyone. If you have any questions, please create a new [issue](https://github.com/saurlax/vivia/issues).
