const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require('./config.service.js').getConfig();
const { env } = require('process');
const axios = require("axios");

var mode = env.NODE_ENV || 'development';
var debug = (mode != 'production');
var documentLoading = {};

module.exports = {
    getDocument,
    getSpreadSheedData
};

async function getDocument(sheetId) {
    if (!documentLoading[sheetId]) {
        documentLoading[sheetId] = new Promise(resolve => {
            console.info("Loading google docs sheet id:" + sheetId);
            var doc = new GoogleSpreadsheet(sheetId);
            if (debug) {
                doc.axios.interceptors.request.use((config) => {
                    console.info("✉️ ", config);
                    return config;
                }, (error) => {
                    console.error("✉️ ", error);
                    return Promise.reject(error);
                });
            }
            doc.useServiceAccountAuth(config.clientCredentials).then(() => {
                doc.loadInfo().then(() => {
                    resolve(doc);
                    documentLoading[sheetId] = null;
                })
            })
        });

    }
    else {
        console.info("Waiting for google docs sheet id:" + sheetId + " is loaded");
    }
    return documentLoading[sheetId];
}

async function getSpreadSheedData(doc, sheetIndex, isValidRowCb) {
    var sheet = await doc.sheetsByIndex[sheetIndex];
    var rows = await sheet.getRows();
    var dataSet = {
        data: []
    };
    for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var dataRow = [];
        var row = rows[rowIndex];
        dataRow.push(0);
        for (var colIndex = 0; colIndex < row._rawData.length; colIndex++) {
            dataRow.push(row._rawData[colIndex]);
        }
        if (isValidRowCb && isValidRowCb(dataRow)) {
            dataSet.data.push(dataRow);
        } else {
            dataSet.data.push(dataRow);
        }
    }
    return dataSet;
}
