import uglify from 'rollup-plugin-uglify'
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

// PostCSS plugins
import simplevars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';
import cssnano from 'cssnano';

export default {
    entry : 'src/main.js',
    format : 'umd',
    dest : 'dist/bundle.min.js',
    sourceMap : true,
    plugins : [
        postcss({ // css 要先导入 either babel plugin error
            plugins: [
                simplevars(),
                nested(),
                cssnext({warnForDuplicates: false}),
                cssnano()
            ],
            extensions: ['.css']
        }),
        resolve({jsnext: true, main: true, browser: true}),
        // commonjs({
        //     namedExports: { 'src/js/modal.js': ['modal' ] },  // Default: undefined
        // }),
        commonjs(),
        babel({exclude: 'node_modules/**'}),
        uglify()
    ]
}