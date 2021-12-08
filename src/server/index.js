const path = require('path');
const config = require('dotenv').config();
const debug = Boolean(config.debug);
if(debug) {
  console.log('Debug mode');
} else {
  console.log('Non-Debug mode');
}

const express= require('express');
const app = express();

const HOSTNAME = 'localhost';
const PORT = process.env.PORT;
const ORIGIN = process.env.ORIGIN;

const webpack= require('webpack');
const webpackconfig = require('../../webpack.config.js');

const buildDir = '../../dist/';

const fs = require('fs');
const request = require('request').defaults({ encoding: null });
const bodyParser = require('body-parser');
const compression = require('compression');

const chalk = require('chalk');

app.use(compression());

app.use(express.static(path.join(__dirname, buildDir)));
app.use('/basemap', express.static('src/basemap'));
app.use('/css', express.static('asset/resource/css'));
app.use('/js', express.static('asset/resource/js'));
app.use('/img', express.static('asset/resource/img'));

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json()); 
router.use((req, res, next) => { // router middleware
    res.header('Access-Control-Allow-Origin', ORIGIN || '*');
    next();
});

if(debug) {
  const webpackMiddleware= require('webpack-dev-middleware');
  const webpackHotMiddleware= require('webpack-hot-middleware');
  const webpackCompiler=webpack(webpackconfig);
  const wpmw = webpackMiddleware(webpackCompiler,{});
  app.use(wpmw);
  app.use(webpackHotMiddleware(webpackCompiler));
} else {
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, buildDir, 'index.html')));
}

router.get('/basemap/light_all/:zoom/:x/:tilename', (req, res) => {
  const zoom=parseInt(req.params.zoom);
  const x=parseInt(req.params.x);
  const tilename=req.params.tilename;

  const actualFilepath=path.join(path.resolve(__dirname, '../'), `basemap/light_all/${zoom}/${x}/${tilename}`);
  const localFilepath=path.join(path.resolve(__dirname, '../../'), 'asset/resource/img/filler_tile.png');

  var filepathToStream=localFilepath;
  if(fs.existsSync(actualFilepath)) {
      filepathToStream=actualFilepath;
  } else {
    filepathToStream=localFilepath;
  }
  var readStream = fs.createReadStream(filepathToStream);
  readStream
  .on('open', () => {
    readStream.pipe(res);
  })
  .on('error', (err_msg) => {
      console.log(err_msg);
      res.end(err_msg);
  });
});

router.get('/data/json/:filename', (req, res) => {
  const filename=req.params.filename;
  const filepathToStream=path.join(path.resolve(__dirname, 'asset/../../../'), `asset/resource/data/${filename}.json`);
  
  fs.readFile(filepathToStream, (_err, _data) => {
    if(_err) console.log(_err)
    var textContent=_data.toString('utf8');
    res.send(textContent);
  });
});

app.use('/api', router);

if(debug) {
  app.listen(PORT, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log(`
        =====================================================
        -> Server (${chalk.bgBlue('Hot reload')}) 🏃 (running) on ${chalk.green(HOSTNAME)}:${chalk.green(PORT)}
        =====================================================
    `);
    require('openurl').open(`http://${HOSTNAME}:${PORT}`);
  });
} else {
  app.listen( PORT, HOSTNAME, () => console.log(`
      =====================================================
      -> Server (${chalk.bgBlue('SPA')}) 🏃  (running) on ${chalk.green(HOSTNAME)}:${chalk.green(PORT)}
      =====================================================
    `)
  );
}