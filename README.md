# Photoshop Assets Generator

Automate the extraction of photoshop assets using the **GENERATOR PLUGIN**,
[here you can find a detailed explanation](https://github.com/adobe-photoshop/generator-assets/wiki/Generate-Web-Assets-Functional-Spec#getting-started) on how you should name your layers in order for this library to work.

What this lib will do for you:

- Automatically launch photoshop
- Open a given array of files
- Enable the 'Image Assets' for you
- Close all documents after all assets has been generated, and optionally close photoshop.

Perfect for CI (**Continuous Integration**) _This was the reason i built this anyway._

#Why do i need this?

If you are developing something that grab some assets from a psd file, why not using the the magic of assets generation to streamline your pipeline? so then you don't have to export your assets every time you make some changes, and even better, if you are working with some kind of CI (Jenkins, Bamboo, [Strider](https://github.com/Strider-CD/strider)....) you can automate the assets extraction process!

#Requirements

**You must have photoshop installed in your local machine in order to this lib to work.**

In photoshop's preferences go to plug-ins and make sure **Enable Generator** and **Enable Remote Connections** are checked.

Pick any **Service Name** you like, and input a **Password** (this lib defaults to 123456).

#Install

```bash
npm install generator-exporter
```

####Usage with Node

```js
import { Generator } from 'generator-exporter'
import * as glob from 'glob'
import * as path from 'path'

const files = glob.sync(
    path.resolve(__dirname, '**/*.psd')
);

const generator = new Generator(files, {
    password: '123456',
    generatorOptions: {
        'base-directory': path.resolve(__dirname, 'output')
    }
})

generator.start().then(() => console.log('done'));
```

####Usage from Command Line

```bash
generator-cli --help 
generator-cli --files 'demo/**/*.psd' --password 654321 -c false
```


#Config Options

| Property         	| Default   	| Description                                                                                                              	|
|------------------	|-----------	|--------------------------------------------------------------------------------------------------------------------------	|
| closePhotoshop   	| true      	| Terminate photoshop after execution.                                                                                     	|
| hostname         	| 127.0.0.1 	| The host the socket is listing to connections, defaults to your local IP.                                                	|
| password         	| 123456    	| The generator's password set inside photoshop plugins section.                                                           	|
| port             	| 49494     	| Socket's port.                                                                                                           	|
| maxRetries       	| 10        	| Max number of retries this library will try to make with photoshop before assume it's dead.                              	|
| retryDelay       	| 5000      	| Delay between each retry.                                                                                                	|
| generatorOptions 	| { ... }   	| [See all the available options in here.](https://github.com/adobe-photoshop/generator-assets/wiki/Configuration-Options) 	|
