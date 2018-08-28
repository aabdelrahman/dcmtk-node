const { movescu, storescp } = require('../..')();
const { onListenerUp } = require('./util');
const harness = require('../external-pacs-harness');
const path = require('path');
const fs = require('fs-extra');

let storeServer;
const storeServerPort = '4002';
const localOutputDir = path.join(__dirname, '../data/output');

const calledAET = 'TEST';
const calledPort = '4141';
const calledHost = 'localhost';

const localAET = 'TESTLISTENER';

describe('called AET is offline', () => {
  test('tries to move a series of images from pacs to local', (done) => {
    const mover = movescu({
      args: [
        '--study',
        '-k',
        'QueryRetrieveLevel=STUDY',
        '-aet',
        localAET,
        '--call',
        calledAET,
        '-k',
        'AccessionNumber=7777777',
        '-k',
        'PatientID',
        '-k',
        'PatientName',
        '--move',
        localAET,
        calledHost,
        calledPort,
      ],
    });

    mover.on('close', async (code) => {
      expect(code).not.toEqual(0);
      done();
    });

    mover.on('error', (err) => {
      expect(err.message).toEqual(expect.stringContaining('Association Request Failed'));
    });
  });
});

describe('called AET online, local AET offline', () => {
  beforeAll(async (done) => {
    await harness.start();
    done();
  });

  afterAll(async (done) => {
    await harness.stop();
    done();
  });

  test('tries to move a series of images from pacs to local', (done) => {
    const responses = [];

    const mover = movescu({
      args: [
        '--study',
        '-k',
        'QueryRetrieveLevel=STUDY',
        '-aet',
        localAET,
        '--call',
        calledAET,
        '-k',
        'AccessionNumber=7777777',
        '-k',
        'PatientID',
        '-k',
        'PatientName',
        '--move',
        localAET,
        calledHost,
        calledPort,
      ],
    });

    mover.parsed.on('response', (response) => {
      responses.push(response);
    });

    mover.on('close', async (code) => {
      expect(responses.length).toEqual(1);
      expect(responses[0].status).toEqual('0xa702');
      expect(code).toEqual(0);
      done();
    });

    mover.on('error', (err) => {
      expect(err.message).toEqual(expect.stringContaining('Sub-Association Request Failed'));
    });
  });

  test('tries to move a series of images from pacs to an unknown local AET', (done) => {
    const responses = [];

    const mover = movescu({
      args: [
        '--study',
        '-k',
        'QueryRetrieveLevel=STUDY',
        '-aet',
        'UNKNOWNAET',
        '--call',
        calledAET,
        '-k',
        'AccessionNumber=7777777',
        '-k',
        'PatientID',
        '-k',
        'PatientName',
        '--move',
        'UNKNOWNAET',
        calledHost,
        calledPort,
      ],
    });

    mover.parsed.on('response', (response) => {
      responses.push(response);
    });

    mover.on('close', async (code) => {
      expect(responses.length).toEqual(1);
      expect(responses[0].status).toEqual('0xa801');
      expect(code).toEqual(0);
      done();
    });

    mover.on('error', (err) => {
      expect(err.message).toEqual(expect.stringContaining('Sub-Association Request Failed'));
    });
  });
});
