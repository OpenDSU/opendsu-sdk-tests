require('../../../builds/output/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;
const path = require("path");

const tir = require("../../../psknode/tests/util/tir.js");

assert.callback("AddFileEDFSTest", (callback) => {
    double_check.createTestFolder("extract", async (err, testFolder) => {
        const vaultDomainConfig = {
            "anchoring": {
                "type": "FS",
                "option": {}
            }
        }
        await tir.launchConfigurableApiHubTestNodeAsync({domains: [{name: "vault", config: vaultDomainConfig}], rootFolder: testFolder});
        const fs = require("fs");
        const folderPath = path.join(testFolder, "bar");
        fs.mkdirSync(folderPath, {recursive: true});
        const fileContent = "some text";
        const openDSU = require("opendsu");
        const resolver = openDSU.loadAPI("resolver");
        const keySSISpace = openDSU.loadAPI("keyssi");
        const filePath = "/file.txt";
        const dsuInstance = await $$.promisify(resolver.createSeedDSU)("vault");
        const batchId = await dsuInstance.startOrAttachBatchAsync();
        await $$.promisify(dsuInstance.writeFile)(filePath, fileContent);
        await dsuInstance.commitBatchAsync(batchId);
        const keySSI = await $$.promisify(dsuInstance.getKeySSIAsObject)();
        const newDSUInstance = await $$.promisify(resolver.loadDSU)(keySSI);
        const fsFilePath = path.join(folderPath, "file.txt");
        await $$.promisify(newDSUInstance.extractFile)(fsFilePath, filePath);
        const extractedFileContent = fs.readFileSync(fsFilePath).toString();
        assert.true(fileContent === extractedFileContent);
        callback();
    });
}, 20000);
