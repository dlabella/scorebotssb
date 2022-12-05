var path = require('path');
const config = require('./config.service.js').getConfig();
const fs = require("fs/promises");
const { env } = require('process');
const indicatorLength = 2;
module.exports = {
    render
};
var templateCache = {};
var mode = env.NODE_ENV || 'development';

async function render(sharedPath, basePath, templateFile) {

    var key = sharedPath + basePath + templateFile;
    if (mode !== 'development') {
        if (templateCache[key]) {
            console.log("return from [" + key + "] template");
            return templateCache[key];
        }
    }
    var partials = basePath + path.sep + "partials";
    var file = basePath + path.sep + templateFile;
    var data = await fs.readFile(file, { encoding: 'utf8' });
    if (!data) {
        return "";
    }
    var template = data.toString();
    var startIdx = null;
    var currentPos = 0;
    var html = template;
    do {
        startIdx = html.indexOf("<%", currentPos);
        endIdx = html.indexOf("%>", currentPos);
        var file = html.substring(startIdx + 2, endIdx);
        if (isReservedWord(file)) {
            var data =  getReservedWordValue(file);
            html = await renderText(html, startIdx, endIdx, data);
            currentPos = startIdx;
        } else if (startIdx != -1 && endIdx > startIdx) {
            var partial = await getPartialFile(sharedPath, partials, file.trim());
            html = await renderPartial(html, startIdx, endIdx, partial)
            currentPos = startIdx;
        }
    } while (startIdx !== -1);
    templateCache[key] = html;
    return html;
}

function isReservedWord(file) {
    return (file && file.trim().startsWith("$"));
}
function getReservedWordValue(word) {
    if (word.trim().toLowerCase() === "$stage$") {
        return config.stage;
    }
    if (word.trim().toLowerCase() === "$version$") {
        return config.version;
    }
    if (word.trim().toLowerCase() === "$standingssheetid$") {
        return config.standingsSheetId;
    }
    if (word.trim().toLowerCase() === "$userssheetid$") {
        return config.usersSheetId;
    }
}

async function renderText(result, startPos, endPos, text) {
    var left = result.substring(0, startPos);
    var right = result.substring(endPos + indicatorLength);
    return left + text + right;
}
async function renderPartial(result, startPos, endPos, partial) {
    var data = await fs.readFile(partial, { encoding: 'utf8' });
    return renderText(result, startPos, endPos, data);
}

async function getPartialFile(sharedPath, basePath, file) {
    var partialFile = basePath + path.sep + file;
    try {
        var stat = await fs.stat(partialFile);
        if (!stat) {
            partialFile = sharedPath + path.sep + file;
        }
    } catch (ex) {
        partialFile = sharedPath + path.sep + file;
    }
    return partialFile;
}
