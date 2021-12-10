const path = require('path');
const express= require('express');
const app = express();

const port = process.env.PORT || 9000;
const buildDir = '../../dist/';

const fs = require('fs');
const bodyParser = require('body-parser');
const compression = require('compression');

app.use(compression());
app.use(express.static(path.join(__dirname, buildDir)));

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json()); 
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin');
    next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, buildDir, 'index.html')));

router.get('/basemap/light_all/:zoom/:x/:tilename', (req, res) => {
  const zoom=parseInt(req.params.zoom);
  const x=parseInt(req.params.x);
  const tilename=req.params.tilename;

  const actualFilepath=path.join(__dirname, buildDir, `asset/basemap/light_all/${zoom}/${x}/${tilename}`)
  const localFilepath=path.join(__dirname, buildDir, `asset/img/filler_tile.png`)

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
  const filepathToStream=path.join(__dirname, buildDir, `asset/data/${filename}.json`)

  fs.readFile(filepathToStream, (_err, _data) => {
    if(_err) console.log(_err)
    var textContent=_data.toString('utf8');
    res.send(textContent);
  });
});

app.use('/api', router);

app.listen(port, () => {
  console.log(`App listening on port ${port}!`)
});