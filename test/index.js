import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { compileSync } from '@mdx-js/mdx';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { recmaSplitWrap } from '../dist/index.js';


const defaultOptions = {
	splitComponent: 'hr',
	wrapComponent: 'Wrapper',
};

const testCases = [
	{
		desc: 'Basic content splitting',
		source: 'jsx/base.mdx',
		result: 'jsx/base.jsx',
	},
	{
		desc: 'Wrap entire content when there is no split',
		source: 'jsx/no-split.mdx',
		result: 'jsx/no-split.jsx',
	},
	{
		desc: 'Nested content splitting',
		source: 'jsx/nested.mdx',
		result: 'jsx/nested.jsx',
	},
	{
		desc: 'No empty wrappers at boundaries of nested content',
		source: 'jsx/nested-empty.mdx',
		result: 'jsx/nested.jsx',
	},

];


for (const uut of testCases) {
	test(uut.desc, () => {
		const sourceContent = readFileSync(resolve('test', uut.source)).toString();
		const targetContent = readFileSync(resolve('test', uut.result)).toString();
		const compiledContent = compileSync(
			sourceContent,
			{
				jsx: true,
				recmaPlugins: [[recmaSplitWrap, {...defaultOptions, ...uut.options}]],
			},
		).toString();

		if (uut.fullJSX) {
			assert.is(compiledContent, targetContent);
		} else {
			// Extract return statement
			const compiledReturn = compiledContent
				.split('\n')
				.map(s => s.trim())
				.filter(s => s.startsWith('return <>'));
			assert.ok(compiledReturn.length);

			// Extract JSX and remove {"\n"}
			const compiledJSX = compiledReturn[0].substring(7, compiledReturn[0].length - 1).replace(/{"\\n"}/g, '');

			// Flatten result
			const targetJSX = targetContent.split('\n').map(s => s.trim()).join('');

			// Assert JSX equality
			assert.is(compiledJSX, targetJSX);
		}
	});
}

test.run();