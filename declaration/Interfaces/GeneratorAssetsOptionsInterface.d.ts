/**
 * Generator Assets Options
 * @see https://github.com/adobe-photoshop/generator-assets/wiki/Configuration-Options
 */
export interface GeneratorAssetsOptionsInterface {
    'svg-enabled'?: boolean;
    'svgomg-enabled'?: boolean;
    'base-directory'?: string;
    'css-enabled'?: boolean;
    'use-smart-scaling'?: boolean;
    'include-ancestor-masks'?: boolean;
    'allow-dither'?: boolean;
    'use-psd-smart-object-pixel-scaling'?: boolean;
    'use-pngquant'?: boolean;
    'convert-color-space'?: boolean;
    'use-flite'?: boolean;
    'embed-icc-profile'?: boolean;
    'clip-all-images-to-document-bounds'?: boolean;
    'clip-all-images-to-artboard-bounds'?: boolean;
    'mask-adds-padding'?: boolean;
    'expand-max-dimensions'?: boolean;
    'webp-enabled'?: boolean;
    'interpolation-type'?: string;
    'icc-profile'?: string;
    'use-jpg-encoding'?: string;
}
