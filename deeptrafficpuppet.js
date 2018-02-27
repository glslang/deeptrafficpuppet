#!/usr/bin/env node

'use strict'

const puppeteer = require('puppeteer');
const options = require('yargs')
  .usage('$0 <filename> [--train] [--eval]')
  .command( 'filename', 'Path to net')
  .required( 1, 'Path is required')
  .option('train', { describe: 'Train and evaluate net', type: 'boolean' })
  .option('eval', { describe: 'Evaluate net', type: 'boolean' })
  .option('save', { describe: 'Save net', type: 'boolean' })
  .option('apply', { describe: 'Apply net', type: 'boolean'})
  .option('iterations', { describe: 'Train for iterations', default: 1})
  .help()
  .example('$0 Net.js --train --save', 'Train, evaluate and save net')
  .example('$0 Net.js --save', 'Train, evaluate and save net')
  .example('$0 Net.js --eval', 'Evaluate only net')
  .epilogue('Copyright 2018 - Goncalo Carvalho - GPLv3')
  .argv;

const filename = options._[ 0 ];

if (!options.train && !options.eval) {
    options.train = true;
}

const net_timeout = 2000000000;
const download_timeout = 10000;

const confirm_dialog = (async page => {
  await page.$('button[class="confirm"]').then(async btn => {
    await btn.click();
  });
});

const confirm_load_net = (async page => {
  await confirm_dialog(page);
  await confirm_dialog(page);
});

const load_net = (async (page, filename) => {
  await page.$('input[type="file"]').then(async picker => {
    await picker.uploadFile(filename);
    await confirm_load_net(page);
  });
  if (options.apply) {
    await page.$('button[class="button-small"]').then(async btn => {
      await btn.click();
    });
  }
});

const save_net = (async page => {
  await page.$('button[id="downloadCodeButton"]').then(async btn => {
      await btn.click();
      await page.waitFor(download_timeout);
  });
});

const train_net = (async page => {
  await page.$('button[id="trainButton"]').then(async btn => {
      await btn.click();
  });
  await page.waitForSelector('#trainProgress', {
    hidden: true,
    timeout: net_timeout
  });
  await confirm_dialog(page);
});

const evaluate_net = (async page => {
  await page.$('button[id="evalButton"]').then(async btn => {
      await btn.click();
  });
  await page.waitForSelector('#evalProgress', {
    hidden: true,
    timeout: net_timeout
  });
  const innerText = await page.evaluate(() => document.querySelector('b').innerText);
  await confirm_dialog(page);
  return innerText;
});

(async () => {
  puppeteer.launch({'headless': !options.save, 'slowMo': 1000}).then(async browser => {
    try {
      const page = await browser.newPage();
      page.on('console', msg => console.log(msg.text()));
      await page.goto('https://selfdrivingcars.mit.edu/deeptraffic/', {waitUntil: 'networkidle2'});
      await load_net(page, filename);
      for (var i = 0; i < options.iterations; ++i) {
        if (options.train) {
          await train_net(page);
        }
        if (options.train || options.eval) {
          await evaluate_net(page).then(async speed => {
            console.log('average speed: ' + speed);
          });
        }
        if (options.save) {
          await save_net(page);
        }
      }
      await browser.close();
    }
    catch (e) {
      console.trace(e);
    }
  })
})();
