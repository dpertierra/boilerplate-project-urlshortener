require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const { Schema } = mongoose
const bodyParser = require('body-parser');
const dns = require('dns');
const shortid = require('shortid');
const mongouri = process.env['MONGO_URI'];

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(mongouri, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch((err) =>{ console.log(err) });

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: {type: String, required: true},
  suffix: String
});
const URL = mongoose.model("URL", urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url;
  let urlDns = url.slice(url.indexOf('//') + 2);
  let slashIndex = urlDns.indexOf('/');
  urlDns = slashIndex < 0 ? urlDns : urlDns.slice(0, slashIndex);
  let host = req.hostname;

  dns.lookup(urlDns, (err, address) => {
    if (err){
      console.log(err || address === null | undefined)
      return res.json({'error': 'Invalid url'});
    }
    console.log(address);
  });
  let suffix = shortid.generate();
  let newURL = new URL({
    original_url: url,
    short_url: host + '/api/shorturl/' + suffix,
    suffix: suffix
  });
  newURL.save((err, data)=>{
    if (err) return console.log(err)
    res.json({
      "saved": true,
      "Original URL": newURL.original_url,
      "Shortened url": newURL.short_url,
      "id": suffix});
  });
});

app.get('/api/shorturl/:suffix', function(req, res){
  let suffix = req.params.suffix
  let redirectUrl = '';
  URL.findOne({suffix: suffix}).then(function (url, err) {
    if (err) return console.log(err);
    redirectUrl = url.original_url;
    res.redirect(redirectUrl);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
