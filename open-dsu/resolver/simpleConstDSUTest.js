process.env.OPENDSU_ENABLE_DEBUG = true;
process.env.DEV = true;
const path = require("path");
const fs = require("fs");

require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;
$$.LEGACY_BEHAVIOUR_ENABLED = true;

function getBrickStorageFolder(folder) {
    return path.join(folder, "external-volume/domains/default/brick-storage");
}

function getBrickFilePath(folder, hashLink) {
    let brickFolderName = hashLink.slice(0, 5);
    let targetPath = path.join(getBrickStorageFolder(folder), brickFolderName, hashLink);
    console.log(targetPath);
    return targetPath;
}

function createDSU(enclave, callback){
    enclave.createTemplateSeedSSI("default", (err, templateSeed) => {
        if (err) {
            throw err;
        }

        enclave.createDSU(templateSeed, (err, dsu) => {
            if (err) {
                throw err;
            }

            dsu.getKeySSIAsObject((err, seed) => {
                if (err) {
                    throw err;
                }
                return callback(undefined, {seed, dsu});
            });
        });
    });
}

assert.callback("Create and load Const DSU test", (finishTest) => {
    double_check.createTestFolder('TEST', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const EnclaveAPI = openDSU.loadApi("enclave");
            const keySSIApi = openDSU.loadApi("keyssi");
            const anchoring = openDSU.loadApi("anchoring");
            const resolver = openDSU.loadApi("resolver");
            const sc = openDSU.loadApi("sc");
            const anchoringX = anchoring.getAnchoringX();

            sc.getMainEnclave((err, enclave) => {
                keySSIApi.we_createArraySSI(undefined, "default", ["one", "two", "keys"], undefined, undefined, (err, arraySSI) => {
                    if (err) {
                        throw err;
                    }
                    enclave.createDSU(arraySSI, {useSSIAsIdentifier: true, encrypt: false}, async (err, constDSU) => {
                        if (err) {
                            throw err;
                        }

                        let filename = "/onefile.txt";
                        let fileContent = "data-to-not-be-altered"
                        let batchId = await constDSU.startOrAttachBatchAsync();
                        constDSU.writeFile(filename, fileContent, async (err)=>{
                            if(err){
                                throw err;
                            }

                            await constDSU.commitBatchAsync(batchId);
                            resolver.invalidateDSUCache(arraySSI, (err)=>{
                                //resetting brick cache
                                require('psk-cache').getDefaultInstance().resetCache();
                                resolver.loadDSU(arraySSI, (err, loadedConstDSU)=>{
                                    if(err){
                                        throw err;
                                    }

                                    loadedConstDSU.readFile(filename, (err, content)=>{
                                        if(err){
                                            throw err;
                                        }
                                        assert.true(content.toString()===fileContent);

                                        finishTest();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

}, 100000);