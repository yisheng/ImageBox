# Image Box

An application who keeps your images [tinified](https://tinypng.com/).

- PNG: Advanced lossy compression for PNG images that preserves full alpha transparency.
- JPG: Compress JPEG files with a perfect balance in quality and file size.

# TODO

- Preserve file index
    * Preserver `fromSize` attribution
    * Use the md5 value to identify whether files have been changed
- Support drag & drop files that is not inside the syncing directory
- Support lossy & lossless compresion
- Supoort multi directories

# Done

- Tinify a file using TinyPNG API
- Evalute database projects (Use NeDB at last)
- Index all the files in the given directory
- Watch file changes in the given directory
- Tinify indexed files one by one
- UI with VueJS
- Config Module
- Config the syncing directory
- Status lock in FileTinify Module