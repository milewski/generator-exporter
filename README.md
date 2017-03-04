# Photoshop Assets Generator CI

Yeah, this package is a quickly but maybe not 100% reliable way to automate the assets generation plugin in photoshop.

what this lib will do for you:

- Automatically launch photoshop
- Open a given array of files
- Enable the 'Image Assets' for you
- Close all documents, and optionally close photoshop

#Why do i need this?

If you are developing something that grab some assets from a psd file, why not using the the magic of assets generation to streamline your pipeline? so then you don't have to export your assets (and version controlling) every time you make some changes, and even better, if you are working with some kind of CI (Jenkins, Bamboo, Strider CD....) you can automate the assets extraction process!

Usage (Node)

```js
import Photohsop from 'photoshop-exporter'
import * as glob from 'glob'
import * as path from 'path'

new Photohsop(glob.sync(path.resolve(__dirname, '**/*.psd')), {
    password: '123456',
    generatorOptions:{
        'base-directory': path.resolve(__dirname, 'output')
    }
}).then(() => console.log('done'))
```

Usage (CLI)

```bash
$generator-cli --help 
$generator-cli --files 'demo/**/*.psd' --password 654321 -c false
```
