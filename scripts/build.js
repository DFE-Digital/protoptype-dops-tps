const fs = require('fs');
const path = require('path');
const sass = require('sass');
const nunjucks = require('nunjucks');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
for (const file of ['styles.css', 'app.js', 'journey.js']) {
  fs.copyFileSync(path.join(root, 'src', file), path.join(output, file));
}
const templates = new nunjucks.Environment(new nunjucks.FileSystemLoader([
  path.join(root, 'src'),
  path.join(root, 'node_modules/govuk-frontend/dist')
]), { autoescape: true });
fs.writeFileSync(path.join(output, 'index.html'), templates.render('index.njk'));
const frontend = path.join(root, 'node_modules/govuk-frontend/dist/govuk');
const assets = path.join(output, 'assets');
fs.mkdirSync(assets, { recursive: true });
fs.mkdirSync(path.join(assets, 'images'), { recursive: true });
fs.copyFileSync(path.join(frontend, 'assets/images/govuk-crest.svg'), path.join(assets, 'images/govuk-crest.svg'));
for (const file of ['govuk-frontend.min.js', 'govuk-frontend.min.js.map']) {
  fs.copyFileSync(path.join(frontend, file), path.join(assets, file));
}
const stylesheet = sass.compileString(`
  @use "govuk-frontend/dist/govuk" with (
    $govuk-font-family: (Arial, Helvetica, sans-serif),
    $govuk-include-default-font-face: false,
    $govuk-assets-path: "./"
  );
`, { loadPaths: [path.join(root, 'node_modules')], style: 'compressed', quietDeps: true });
fs.writeFileSync(path.join(assets, 'govuk-frontend.min.css'), stylesheet.css);
fs.copyFileSync(path.join(root, 'GOVUK-LICENSE.txt'), path.join(assets, 'GOVUK-LICENSE.txt'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Built static prototype in dist/.');
