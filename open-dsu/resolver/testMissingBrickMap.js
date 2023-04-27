process.env.OPENDSU_ENABLE_DEBUG = true;
process.env.DEV = true;
const path = require("path");
const fs = require("fs");

require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;


function getBrickStorageFolder(folder) {
    return path.join(folder, "external-volume/domains/default/brick-storage");
}

function getBrickFilePath(folder, hashLink) {
    let brickFolderName = hashLink.slice(0, 5);
    return path.join(getBrickStorageFolder(folder), brickFolderName, hashLink);
}

assert.callback("Test what happens when a brickmap is missing", (finishTest) => {
    double_check.createTestFolder('TEST', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const EnclaveAPI = openDSU.loadApi("enclave");
            const anchoring = openDSU.loadApi("anchoring");
            const sc = openDSU.loadApi("sc");
            const anchoringX = anchoring.getAnchoringX();

            sc.getMainEnclave((err, enclave) => {
                enclave.createTemplateSeedSSI("default", (err, templateSeed) => {
                    if (err) {
                        throw err;
                    }

                    enclave.createDSU(templateSeed, (err, dsu) => {
                        if (err) {
                            throw err;
                        }

                        dsu.getKeySSIAsObject(async (err, seed) => {
                            if (err) {
                                throw err;
                            }

                            await dsu.safeBeginBatchAsync()
                            dsu.writeFile("/test.txt", "just content", async (err) => {
                                console.log("Frist write was called!!!", new Date().getTime());
                                if (err) {
                                    throw err;
                                }
                                await dsu.commitBatchAsync();

                                await dsu.safeBeginBatchAsync()
                                dsu.writeFile("/secondfile.txt", "content that will be deleted from brick storage", async (err) => {
                                    if (err) {
                                        throw err;
                                    }

                                    await dsu.commitBatchAsync();
                                    seed.getAnchorId((err, anchorId) => {
                                        if (err) {
                                            throw err;
                                        }
                                        anchoringX.getAllVersions(anchorId, (err, allVersions) => {
                                            if (err) {
                                                throw err;
                                            }

                                            for (let i = 1; i < allVersions.length; i++) {
                                                let brickFilePath = getBrickFilePath(folder, allVersions[i].getHash());
                                                fs.unlinkSync(brickFilePath);
                                            }

                                            enclave.loadDSU(seed, {skipCache: true}, (err, dsu) => {
                                                console.log(err, dsu);

                                                assert.equal(!!err, true);
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
        });
    });

}, 100000);